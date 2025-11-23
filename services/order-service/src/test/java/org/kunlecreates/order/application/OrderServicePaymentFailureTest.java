package org.kunlecreates.order.application;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.repository.OrderRepository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class OrderServicePaymentFailureTest {

    private OrderRepository orderRepository;
    private PaymentService paymentService;
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        paymentService = mock(PaymentService.class);
        orderService = new OrderService(orderRepository, paymentService);
    }

    @Test
    void processCheckout_paymentFails_throws() {
        Long userId = 99L;
        double total = 10.00;
        when(paymentService.charge(userId, total)).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> orderService.processCheckout(userId, total));
        assertEquals("Payment failed", ex.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }
}
