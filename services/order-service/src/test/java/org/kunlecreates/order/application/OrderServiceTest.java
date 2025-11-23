package org.kunlecreates.order.application;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.repository.OrderRepository;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class OrderServiceTest {

    private OrderRepository orderRepository;
    private PaymentService paymentService;
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        paymentService = new MockPaymentService();
        orderService = new OrderService(orderRepository, paymentService);
    }

    @Test
    void processCheckout_success_savesOrder() {
        Long userId = 42L;
        double total = 123.45;

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order result = orderService.processCheckout(userId, total);

        assertNotNull(result);
        assertEquals(userId, result.getUserId());
        assertEquals("PLACED", result.getStatus());
        assertEquals(total, result.getTotal());

        verify(orderRepository, times(1)).save(captor.capture());
        Order saved = captor.getValue();
        assertEquals(userId, saved.getUserId());
        assertEquals(total, saved.getTotal());
    }

}
