package org.kunlecreates.order.unit;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kunlecreates.order.application.OrderService;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.domain.OrderEvent;
import org.kunlecreates.order.domain.OrderStatus;
import org.kunlecreates.order.interfaces.OrderController;
import org.kunlecreates.order.interfaces.dto.CreateOrderRequest;
import org.kunlecreates.order.interfaces.dto.OrderResponse;
import org.kunlecreates.order.interfaces.dto.PaymentMethod;
import org.kunlecreates.order.interfaces.dto.ShippingAddress;
import org.kunlecreates.order.interfaces.dto.UpdateOrderStatusRequest;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    @Mock
    private OrderService orderService;

    private OrderController controller;

    @BeforeEach
    void setUp() {
        controller = new OrderController(orderService);
    }

    @Test
    void list_shouldFilterOrdersForRegularUsers() {
        Order ownOrder = buildOrder(1L, "user-1", "PENDING", 2500L, "User One", "User One");
        Order otherOrder = buildOrder(2L, "user-2", "PENDING", 3000L, "User Two", "User Two");
        when(orderService.listOrders()).thenReturn(List.of(ownOrder, otherOrder));

        List<OrderResponse> result = controller.list(userAuth("user-1"));

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().userRef()).isEqualTo("user-1");
    }

    @Test
    void get_shouldUseShippingRecipientWhenCustomerNameIsMissing() {
        Order order = buildOrder(5L, "user-5", "PENDING", 4200L, "", "Fallback Recipient");
        when(orderService.findById(5L)).thenReturn(Optional.of(order));

        ResponseEntity<OrderResponse> response = controller.get(5L, userAuth("user-5"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().customerName()).isEqualTo("Fallback Recipient");
        assertThat(response.getBody().total()).isEqualTo(42.0);
    }

    @Test
    void get_shouldReturnForbiddenForNonOwner() {
        Order order = buildOrder(6L, "owner-1", "PENDING", 1000L, "Owner", "Owner");
        when(orderService.findById(6L)).thenReturn(Optional.of(order));

        ResponseEntity<OrderResponse> response = controller.get(6L, userAuth("other-user"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void create_shouldExtractJwtClaimsAndAuthorizationHeader() {
        Order created = buildOrder(9L, "jwt-user", "PENDING", 9999L, "Jane Doe", "Jane Doe");
        when(orderService.createOrder(eq("jwt-user"), eq(null), eq("PENDING"), eq(99.99), eq("token-123"),
                eq("Jane Doe"), eq("123 Test St"), eq("Apt 2"), eq("Toronto"),
                eq("ON"), eq("M5H 2N2"), eq("Canada"), eq("+1-416-555-0100"),
                eq("CREDIT_CARD"), eq("4242"), eq("Visa"),
            eq("jane@example.com"), eq("Jane Doe"), any(List.class)))
            .thenReturn(created);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer token-123");

        CreateOrderRequest createOrderRequest = new CreateOrderRequest(
                "ignored-user-ref",
                77L,
                "PENDING",
                99.99,
                List.of(new CreateOrderRequest.CreateOrderItem("SKU-1", "Phone", 2, 49.995)),
                new ShippingAddress("Jane Doe", "123 Test St", "Apt 2", "Toronto", "ON", "M5H 2N2", "Canada", "+1-416-555-0100"),
                new PaymentMethod("CREDIT_CARD", "4242", "Visa")
        );

        ResponseEntity<OrderResponse> response = controller.create(
                createOrderRequest,
                jwtAuth("jwt-user", "jane@example.com", "Jane Doe", "USER"),
                request,
                UriComponentsBuilder.newInstance()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).hasPath("/api/order/9");
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().userRef()).isEqualTo("jwt-user");
    }

    @Test
    void updateStatus_shouldRejectNonAdmins() {
        ResponseEntity<Order> response = controller.updateStatus(
                3L,
                new UpdateOrderStatusRequest("PAID"),
                new MockHttpServletRequest(),
                userAuth("user-3")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(orderService, never()).updateStatus(any(Long.class), any(OrderStatus.class), any());
    }

    @Test
    void updateStatus_shouldReturnBadRequestWhenTransitionFails() {
        when(orderService.updateStatus(3L, OrderStatus.PAID, "admin-token"))
                .thenThrow(new IllegalStateException("bad transition"));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer admin-token");

        ResponseEntity<Order> response = controller.updateStatus(
                3L,
                new UpdateOrderStatusRequest("PAID"),
                request,
                adminAuth("admin-1")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void cancelOrder_shouldUseAdminStatusUpdatePathForAdmins() {
        Order order = buildOrder(8L, "user-8", "PENDING", 8000L, "User Eight", "User Eight");
        when(orderService.findById(8L)).thenReturn(Optional.of(order));
        when(orderService.updateStatus(8L, OrderStatus.CANCELLED, "admin-token")).thenReturn(order);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer admin-token");

        ResponseEntity<Order> response = controller.cancelOrder(8L, request, adminAuth("admin-8"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(orderService, never()).cancelOrder(any(Long.class), any(String.class));
        verify(orderService).updateStatus(8L, OrderStatus.CANCELLED, "admin-token");
    }

    @Test
    void refundOrder_shouldReturnBadRequestWhenRefundFails() {
        when(orderService.refundOrder(12L)).thenThrow(new IllegalArgumentException("not refundable"));

        ResponseEntity<Order> response = controller.refundOrder(12L, adminAuth("admin-12"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getOrderTracking_shouldReturnForbiddenForOtherUsers() {
        Order order = buildOrder(20L, "owner-20", "SHIPPED", 1200L, "Owner", "Owner");
        when(orderService.findById(20L)).thenReturn(Optional.of(order));

        ResponseEntity<List<OrderEvent>> response = controller.getOrderTracking(20L, userAuth("intruder"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(orderService, never()).getOrderHistory(20L);
    }

    @Test
    void getOrderTracking_shouldReturnHistoryForAdmins() {
        Order order = buildOrder(21L, "owner-21", "DELIVERED", 5000L, "Owner", "Owner");
        List<OrderEvent> history = List.of(new OrderEvent(21L, "PAID", "SHIPPED", Instant.now()));
        when(orderService.findById(21L)).thenReturn(Optional.of(order));
        when(orderService.getOrderHistory(21L)).thenReturn(history);

        ResponseEntity<List<OrderEvent>> response = controller.getOrderTracking(21L, adminAuth("admin-21"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(history);
    }

    private Authentication userAuth(String userId) {
        return new TestingAuthenticationToken(userId, "password", "ROLE_USER");
    }

    private Authentication adminAuth(String userId) {
        return new TestingAuthenticationToken(userId, "password", "ROLE_ADMIN");
    }

    private Authentication jwtAuth(String sub, String email, String fullName, String... roles) {
        Jwt.Builder builder = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", sub)
                .claim("email", email)
                .claim("fullName", fullName);

        List<SimpleGrantedAuthority> authorities = java.util.Arrays.stream(roles)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();

        return new JwtAuthenticationToken(builder.build(), authorities);
    }

    private Order buildOrder(Long id, String userRef, String status, Long totalCents, String customerName, String shippingRecipient) {
        Order order = new Order(userRef, status, totalCents);
        ReflectionTestUtils.setField(order, "id", id);
        order.setCustomerName(customerName);
        order.setShippingRecipient(shippingRecipient);
        order.setShippingStreet1("123 Test St");
        order.setShippingCity("Toronto");
        order.setShippingState("ON");
        order.setShippingPostalCode("M5H 2N2");
        order.setShippingCountry("Canada");
        order.setShippingPhone("+1-416-555-0100");
        order.setPaymentMethodType("CREDIT_CARD");
        order.setPaymentLast4("4242");
        order.setPaymentBrand("Visa");
        return order;
    }
}