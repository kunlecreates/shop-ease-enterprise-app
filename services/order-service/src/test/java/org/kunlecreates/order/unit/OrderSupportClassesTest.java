package org.kunlecreates.order.unit;

import org.junit.jupiter.api.Test;
import org.kunlecreates.order.application.MockPaymentService;
import org.kunlecreates.order.domain.Cart;
import org.kunlecreates.order.domain.CartItem;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.domain.OrderItem;
import org.kunlecreates.order.domain.Payment;
import org.kunlecreates.order.domain.PaymentTransaction;
import org.kunlecreates.order.interfaces.dto.CartResponse;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class OrderSupportClassesTest {

    @Test
    void payment_shouldExposeBasicFieldsAndAmountConversion() {
        Payment payment = new Payment(10L, 1234L, "PAID");
        assertThat(payment.getOrderId()).isEqualTo(10L);
        assertThat(payment.getAmountCents()).isEqualTo(1234L);
        assertThat(payment.getAmount()).isEqualTo(12.34);
        assertThat(payment.getStatus()).isEqualTo("PAID");
        assertThat(payment.getCreatedAt()).isNotNull();
    }

    @Test
    void orderItem_andPaymentTransaction_shouldInitializeCorrectly() {
        Order order = new Order("u1", "PENDING", 1000L);
        OrderItem orderItem = new OrderItem(order, "SKU-1", "Coffee", 2, 500L);
        Payment payment = new Payment(11L, 2000L, "AUTHORIZED");
        PaymentTransaction tx = new PaymentTransaction(payment, "CHARGE", "OK", 2000L);

        assertThat(orderItem.getOrder()).isEqualTo(order);
        assertThat(orderItem.getProductRef()).isEqualTo("SKU-1");
        assertThat(orderItem.getProductName()).isEqualTo("Coffee");
        assertThat(orderItem.getQuantity()).isEqualTo(2);
        assertThat(orderItem.getUnitPriceCents()).isEqualTo(500L);
        assertThat(tx.getId()).isNull();
    }

    @Test
    void cartResponse_shouldMapItemsAndComputeTotals() {
        Cart cart = new Cart("user-ref");
        ReflectionTestUtils.setField(cart, "id", 99L);

        CartItem item1 = new CartItem(cart, "SKU-1", 2, 700L);
        ReflectionTestUtils.setField(item1, "id", 1L);
        CartItem item2 = new CartItem(cart, "SKU-2", 1, 300L);
        ReflectionTestUtils.setField(item2, "id", 2L);

        cart.getItems().add(item1);
        cart.getItems().add(item2);

        CartResponse response = CartResponse.from(cart);

        assertThat(response.id()).isEqualTo(99L);
        assertThat(response.userRef()).isEqualTo("user-ref");
        assertThat(response.totalCents()).isEqualTo(1700L);
        assertThat(response.items()).hasSize(2);
        assertThat(response.items().getFirst().subtotalCents()).isEqualTo(1400L);
    }

    @Test
    void mockPaymentService_shouldAlwaysChargeSuccessfully() {
        MockPaymentService mockPaymentService = new MockPaymentService();
        assertThat(mockPaymentService.charge(1L, 10.50)).isTrue();
    }
}