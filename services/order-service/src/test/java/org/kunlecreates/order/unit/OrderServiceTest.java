package org.kunlecreates.order.unit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.kunlecreates.order.application.OrderService;
import org.kunlecreates.order.application.PaymentService;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.domain.OrderStatus;
import org.kunlecreates.order.domain.OrderEvent;
import org.kunlecreates.order.repository.OrderRepository;
import org.kunlecreates.order.repository.OrderEventRepository;
import org.kunlecreates.order.infrastructure.notification.NotificationClient;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderEventRepository orderEventRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private NotificationClient notificationClient;

    @InjectMocks
    private OrderService orderService;

    private Order testOrder;

    @BeforeEach
    void setUp() {
        testOrder = new Order("user-123", "PENDING", 10000L);
        ReflectionTestUtils.setField(testOrder, "id", 1L);
    }

    @Test
    void createOrder_whenUserRefProvided_shouldUseUserRef() {
        Order savedOrder = new Order("custom-ref", "PENDING", 5000L);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        Order result = orderService.createOrder("custom-ref", null, "PENDING", 50.00, null);

        assertThat(result.getUserRef()).isEqualTo("custom-ref");
        verify(orderRepository).save(any(Order.class));
        verify(notificationClient, never()).sendOrderConfirmation(any(), any());
    }

    @Test
    void createOrder_whenOnlyUserIdProvided_shouldConvertToString() {
        Order savedOrder = new Order("456", "PENDING", 7500L);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        Order result = orderService.createOrder(null, 456L, "PENDING", 75.00, null);

        assertThat(result.getUserRef()).isEqualTo("456");
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void createOrder_whenNoUserRefOrUserId_shouldThrowException() {
        assertThatThrownBy(() -> orderService.createOrder(null, null, "PENDING", 50.00, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Either userRef or userId must be provided");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void createOrder_withJwtToken_shouldSendNotification() {
        Order savedOrder = new Order("user-789", "PENDING", 12000L);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        orderService.createOrder(null, 789L, "PENDING", 120.00, "jwt-token");

        verify(notificationClient).sendOrderConfirmation(savedOrder, "jwt-token");
    }

    @Test
    void processCheckout_whenPaymentSucceeds_shouldCreatePaidOrder() {
        Order savedOrder = new Order("user-100", "PAID", 25000L);
        when(paymentService.charge(100L, 250.00)).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        Order result = orderService.processCheckout(100L, 250.00, null);

        assertThat(result.getStatus()).isEqualTo("PAID");
        verify(paymentService).charge(100L, 250.00);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void processCheckout_whenPaymentFails_shouldThrowException() {
        when(paymentService.charge(200L, 100.00)).thenReturn(false);

        assertThatThrownBy(() -> orderService.processCheckout(200L, 100.00, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Payment failed");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void updateStatus_whenOrderNotFound_shouldThrowException() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.updateStatus(999L, OrderStatus.SHIPPED, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Order not found");
    }

    @Test
    void updateStatus_toShipped_shouldSendShippingNotification() {
        testOrder.transitionTo(OrderStatus.PAID);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);

        orderService.updateStatus(1L, OrderStatus.SHIPPED, "jwt-token");

        verify(notificationClient).sendShippingNotification(
                eq(testOrder),
                startsWith("TRACK-"),
                anyString(),
                eq("jwt-token")
        );
    }

    @Test
    void updateStatus_shouldSaveOrderEvents() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);

        orderService.updateStatus(1L, OrderStatus.PAID, null);

        verify(orderEventRepository).saveAll(anyList());
    }

    @Test
    void cancelOrder_whenOrderNotFound_shouldThrowException() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.cancelOrder(999L, "user-123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Order not found");
    }

    @Test
    void cancelOrder_whenUserDoesNotOwnOrder_shouldThrowException() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        assertThatThrownBy(() -> orderService.cancelOrder(1L, "different-user"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User does not own this order");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancelOrder_whenOrderNotPending_shouldThrowException() {
        Order paidOrder = new Order("user-123", "PAID", 10000L);
        ReflectionTestUtils.setField(paidOrder, "id", 2L);
        when(orderRepository.findById(2L)).thenReturn(Optional.of(paidOrder));

        assertThatThrownBy(() -> orderService.cancelOrder(2L, "user-123"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Only PENDING orders can be cancelled by user");
    }

    @Test
    void cancelOrder_whenValidPendingOrder_shouldCancel() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);

        Order result = orderService.cancelOrder(1L, "user-123");

        assertThat(result.getStatus()).isEqualTo("CANCELLED");
        verify(orderRepository).save(testOrder);
        verify(orderEventRepository).saveAll(anyList());
    }

    @Test
    void refundOrder_whenOrderNotFound_shouldThrowException() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.refundOrder(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Order not found");
    }

    @Test
    void refundOrder_shouldTransitionToRefunded() {
        Order paidOrder = new Order("user-123", "PAID", 15000L);
        ReflectionTestUtils.setField(paidOrder, "id", 3L);
        when(orderRepository.findById(3L)).thenReturn(Optional.of(paidOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(paidOrder);

        Order result = orderService.refundOrder(3L);

        assertThat(result.getStatus()).isEqualTo("REFUNDED");
        verify(orderRepository).save(paidOrder);
        verify(orderEventRepository).saveAll(anyList());
    }
}
