package org.kunlecreates.order.application;

import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;

    public OrderService(OrderRepository orderRepository, PaymentService paymentService) {
        this.orderRepository = orderRepository;
        this.paymentService = paymentService;
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
    public Order createOrder(String userRef, Long userId, String status, double total) {
        // Prefer explicit userRef (string/UUID). Fall back to numeric userId for compatibility.
        String ref;
        if (userRef != null && !userRef.isBlank()) {
            ref = userRef;
        } else if (userId != null) {
            ref = String.valueOf(userId);
        } else {
            throw new IllegalArgumentException("Either userRef or userId must be provided");
        }
        // convert decimal total to cents for storage
        long cents = Math.round(total * 100);
        Order o = new Order(ref, status, cents);
        return orderRepository.save(o);
    }

    @Transactional
    public Order processCheckout(Long userId, double total) {
        boolean paid = paymentService.charge(userId, total);
        if (!paid) {
            throw new RuntimeException("Payment failed");
        }
        // Mark order as PAID after successful payment to match DB constraint values
        return createOrder(null, userId, "PAID", total);
    }
}
