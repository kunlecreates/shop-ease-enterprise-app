package org.kunlecreates.order.application;

import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.domain.OrderEvent;
import org.kunlecreates.order.domain.OrderStatus;
import org.kunlecreates.order.infrastructure.notification.NotificationClient;
import org.kunlecreates.order.repository.OrderEventRepository;
import org.kunlecreates.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    
    private final OrderRepository orderRepository;
    private final OrderEventRepository orderEventRepository;
    private final PaymentService paymentService;
    private final NotificationClient notificationClient;

    public OrderService(
            OrderRepository orderRepository, 
            OrderEventRepository orderEventRepository,
            PaymentService paymentService,
            NotificationClient notificationClient) {
        this.orderRepository = orderRepository;
        this.orderEventRepository = orderEventRepository;
        this.paymentService = paymentService;
        this.notificationClient = notificationClient;
    }

    @Transactional(readOnly = true)
    public List<Order> listOrders() {
        return orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id);
    }
    
    @Transactional
    public Order createOrder(String userRef, Long userId, String status, double total, String jwtToken,
                           String shippingRecipient, String shippingStreet1, String shippingStreet2,
                           String shippingCity, String shippingState, String shippingPostalCode,
                           String shippingCountry, String shippingPhone,
                           String paymentMethodType, String paymentLast4, String paymentBrand) {
        String ref;
        if (userRef != null && !userRef.isBlank()) {
            ref = userRef;
        } else if (userId != null) {
            ref = String.valueOf(userId);
        } else {
            throw new IllegalArgumentException("Either userRef or userId must be provided");
        }
        long cents = Math.round(total * 100);
        Order o = new Order(ref, status, cents);
        
        o.setShippingRecipient(shippingRecipient);
        o.setShippingStreet1(shippingStreet1);
        o.setShippingStreet2(shippingStreet2);
        o.setShippingCity(shippingCity);
        o.setShippingState(shippingState);
        o.setShippingPostalCode(shippingPostalCode);
        o.setShippingCountry(shippingCountry);
        o.setShippingPhone(shippingPhone);
        
        o.setPaymentMethodType(paymentMethodType);
        o.setPaymentLast4(paymentLast4);
        o.setPaymentBrand(paymentBrand);
        
        Order saved = orderRepository.save(o);
        
        // Send order confirmation email asynchronously (non-blocking)
        if (jwtToken != null) {
            notificationClient.sendOrderConfirmation(saved, jwtToken);
        }
        
        return saved;
    }

    @Transactional
    public Order processCheckout(Long userId, double total, String jwtToken,
                                String shippingRecipient, String shippingStreet1, String shippingStreet2,
                                String shippingCity, String shippingState, String shippingPostalCode,
                                String shippingCountry, String shippingPhone,
                                String paymentMethodType, String paymentLast4, String paymentBrand) {
        boolean paid = paymentService.charge(userId, total);
        if (!paid) {
            throw new RuntimeException("Payment failed");
        }
        return createOrder(null, userId, "PAID", total, jwtToken,
                shippingRecipient, shippingStreet1, shippingStreet2, shippingCity,
                shippingState, shippingPostalCode, shippingCountry, shippingPhone,
                paymentMethodType, paymentLast4, paymentBrand);
    }
    
    @Transactional
    public Order updateStatus(Long orderId, OrderStatus newStatus, String jwtToken) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        OrderStatus previousStatus = OrderStatus.fromString(order.getStatus());
        order.transitionTo(newStatus);
        Order saved = orderRepository.save(order);
        
        List<OrderEvent> events = order.getDomainEvents();
        if (!events.isEmpty()) {
            orderEventRepository.saveAll(events);
            order.clearDomainEvents();
        }
        
        // Send appropriate email notification based on new status
        if (jwtToken != null) {
            switch (newStatus) {
                case PAID:
                    notificationClient.sendOrderPaidNotification(saved, jwtToken);
                    break;
                case SHIPPED:
                    String trackingNumber = generateTrackingNumber(orderId);
                    String estimatedDelivery = calculateEstimatedDelivery();
                    notificationClient.sendShippingNotification(saved, trackingNumber, estimatedDelivery, jwtToken);
                    break;
                case DELIVERED:
                    notificationClient.sendOrderDeliveredNotification(saved, jwtToken);
                    break;
                case CANCELLED:
                    notificationClient.sendOrderCancelledNotification(saved, jwtToken);
                    break;
                case REFUNDED:
                    notificationClient.sendOrderRefundedNotification(saved, jwtToken);
                    break;
                default:
                    // No notification for other statuses
                    break;
            }
        }
        
        return saved;
    }
    
    private String generateTrackingNumber(Long orderId) {
        return String.format("TRACK-%d-%d", orderId, System.currentTimeMillis() % 1000000);
    }
    
    private String calculateEstimatedDelivery() {
        LocalDateTime delivery = LocalDateTime.now().plusDays(3);
        return delivery.format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
    }
    
    @Transactional
    public Order cancelOrder(Long orderId, String userRef) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        if (!order.getUserRef().equals(userRef)) {
            throw new IllegalArgumentException("User does not own this order");
        }
        
        OrderStatus currentStatus = OrderStatus.fromString(order.getStatus());
        if (currentStatus != OrderStatus.PENDING) {
            throw new IllegalStateException("Only PENDING orders can be cancelled by user");
        }
        
        order.cancel();
        Order saved = orderRepository.save(order);
        
        List<OrderEvent> events = order.getDomainEvents();
        if (!events.isEmpty()) {
            orderEventRepository.saveAll(events);
            order.clearDomainEvents();
        }
        
        // Note: Cancellation notification sent separately via updateStatus method when called with CANCELLED status
        
        return saved;
    }
    
    @Transactional
    public Order refundOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        order.refund();
        Order saved = orderRepository.save(order);
        
        List<OrderEvent> events = order.getDomainEvents();
        if (!events.isEmpty()) {
            orderEventRepository.saveAll(events);
            order.clearDomainEvents();
        }
        
        // Note: Refund notification sent separately via updateStatus method when called with REFUNDED status
        
        return saved;
    }
    
    @Transactional(readOnly = true)
    public List<OrderEvent> getOrderHistory(Long orderId) {
        return orderEventRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
    }
}
