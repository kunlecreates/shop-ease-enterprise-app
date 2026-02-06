package org.kunlecreates.order.unit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.domain.OrderStatus;
import org.kunlecreates.order.domain.OrderEvent;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OrderTest {

    private Order testOrder;

    @BeforeEach
    void setUp() {
        testOrder = new Order("user-100", "PENDING", 10000L);
        ReflectionTestUtils.setField(testOrder, "id", 1L);
    }

    @Test
    void transitionTo_fromPendingToPaid_shouldSucceed() {
        Instant beforeTransition = testOrder.getUpdatedAt();
        
        testOrder.transitionTo(OrderStatus.PAID);
        
        assertThat(testOrder.getStatus()).isEqualTo("PAID");
        assertThat(testOrder.getUpdatedAt()).isAfter(beforeTransition);
    }

    @Test
    void transitionTo_fromPendingToCancelled_shouldSucceed() {
        testOrder.transitionTo(OrderStatus.CANCELLED);
        
        assertThat(testOrder.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void transitionTo_fromPendingToShipped_shouldFail() {
        assertThatThrownBy(() -> testOrder.transitionTo(OrderStatus.SHIPPED))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Invalid status transition from PENDING to SHIPPED");
    }

    @Test
    void transitionTo_fromPaidToShipped_shouldSucceed() {
        testOrder.transitionTo(OrderStatus.PAID);
        
        testOrder.transitionTo(OrderStatus.SHIPPED);
        
        assertThat(testOrder.getStatus()).isEqualTo("SHIPPED");
    }

    @Test
    void transitionTo_fromShippedToDelivered_shouldSucceed() {
        testOrder.transitionTo(OrderStatus.PAID);
        testOrder.transitionTo(OrderStatus.SHIPPED);
        
        testOrder.transitionTo(OrderStatus.DELIVERED);
        
        assertThat(testOrder.getStatus()).isEqualTo("DELIVERED");
    }

    @Test
    void transitionTo_fromDeliveredToAnyStatus_shouldFail() {
        testOrder.transitionTo(OrderStatus.PAID);
        testOrder.transitionTo(OrderStatus.SHIPPED);
        testOrder.transitionTo(OrderStatus.DELIVERED);
        
        assertThatThrownBy(() -> testOrder.transitionTo(OrderStatus.REFUNDED))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Invalid status transition from DELIVERED");
    }

    @Test
    void transitionTo_shouldEmitOrderEvent() {
        testOrder.clearDomainEvents();
        
        testOrder.transitionTo(OrderStatus.PAID);
        
        assertThat(testOrder.getDomainEvents()).hasSize(1);
        OrderEvent event = testOrder.getDomainEvents().get(0);
        assertThat(event.getOrderId()).isEqualTo(1L);
        assertThat(event.getType()).isEqualTo("STATUS_CHANGED");
        assertThat(event.getPayload()).contains("\"from\":\"PENDING\"").contains("\"to\":\"PAID\"");
    }

    @Test
    void transitionTo_shouldUpdateTimestamp() {
        Instant originalUpdatedAt = testOrder.getUpdatedAt();
        
        testOrder.transitionTo(OrderStatus.PAID);
        
        assertThat(testOrder.getUpdatedAt()).isAfter(originalUpdatedAt);
    }

    @Test
    void cancel_shouldTransitionToCancelled() {
        testOrder.cancel();
        
        assertThat(testOrder.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void markAsPaid_shouldTransitionToPaid() {
        testOrder.markAsPaid();
        
        assertThat(testOrder.getStatus()).isEqualTo("PAID");
    }

    @Test
    void markAsPaid_shouldSetPlacedAtTimestamp() {
        assertThat(testOrder.getPlacedAt()).isNull();
        
        testOrder.markAsPaid();
        
        assertThat(testOrder.getPlacedAt()).isNotNull();
        assertThat(testOrder.getPlacedAt()).isBeforeOrEqualTo(Instant.now());
    }

    @Test
    void markAsPaid_whenAlreadyPaid_shouldNotUpdatePlacedAt() {
        testOrder.markAsPaid();
        Instant firstPlacedAt = testOrder.getPlacedAt();
        
        testOrder.transitionTo(OrderStatus.SHIPPED);
        testOrder.transitionTo(OrderStatus.DELIVERED);
        
        assertThat(testOrder.getPlacedAt()).isEqualTo(firstPlacedAt);
    }

    @Test
    void ship_shouldTransitionToShipped() {
        testOrder.transitionTo(OrderStatus.PAID);
        
        testOrder.ship();
        
        assertThat(testOrder.getStatus()).isEqualTo("SHIPPED");
    }

    @Test
    void deliver_shouldTransitionToDelivered() {
        testOrder.transitionTo(OrderStatus.PAID);
        testOrder.transitionTo(OrderStatus.SHIPPED);
        
        testOrder.deliver();
        
        assertThat(testOrder.getStatus()).isEqualTo("DELIVERED");
    }

    @Test
    void refund_shouldTransitionToRefunded() {
        testOrder.transitionTo(OrderStatus.PAID);
        
        testOrder.refund();
        
        assertThat(testOrder.getStatus()).isEqualTo("REFUNDED");
    }

    @Test
    void refund_fromShipped_shouldFail() {
        testOrder.transitionTo(OrderStatus.PAID);
        testOrder.transitionTo(OrderStatus.SHIPPED);
        
        assertThatThrownBy(() -> testOrder.refund())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Invalid status transition from SHIPPED to REFUNDED");
    }

    @Test
    void clearDomainEvents_shouldRemoveAllEvents() {
        testOrder.transitionTo(OrderStatus.PAID);
        testOrder.transitionTo(OrderStatus.SHIPPED);
        
        assertThat(testOrder.getDomainEvents()).isNotEmpty();
        
        testOrder.clearDomainEvents();
        
        assertThat(testOrder.getDomainEvents()).isEmpty();
    }

    @Test
    void getDomainEvents_shouldReturnDefensiveCopy() {
        testOrder.transitionTo(OrderStatus.PAID);
        var events = testOrder.getDomainEvents();
        
        events.clear();
        
        assertThat(testOrder.getDomainEvents()).isNotEmpty();
    }

    @Test
    void getTotal_shouldConvertCentsToDouble() {
        Order order = new Order("user-200", "PENDING", 12345L);
        
        assertThat(order.getTotal()).isEqualTo(123.45);
    }

    @Test
    void getTotal_whenTotalCentsIsNull_shouldReturnZero() {
        Order order = new Order("user-300", "PENDING", null);
        
        assertThat(order.getTotal()).isEqualTo(0.0);
    }
}
