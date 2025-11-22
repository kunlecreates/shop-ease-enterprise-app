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
    public Order createOrder(Long userId, String status, double total) {
        Order o = new Order(userId, status, total);
        return orderRepository.save(o);
    }

    @Transactional
    public Order processCheckout(Long userId, double total) {
        boolean paid = paymentService.charge(userId, total);
        if (!paid) {
            throw new RuntimeException("Payment failed");
        }
        return createOrder(userId, "PLACED", total);
    }
}
