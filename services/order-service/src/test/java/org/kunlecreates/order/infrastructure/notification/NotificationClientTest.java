package org.kunlecreates.order.infrastructure.notification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.domain.OrderItem;
import org.kunlecreates.order.repository.OrderItemRepository;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NotificationClientTest {

    @Mock
    private WebClient.Builder webClientBuilder;

    @Mock
    private WebClient webClient;

    @Mock
    private JwtDecoder jwtDecoder;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private WebClient.RequestBodySpec requestBodySpec;

    @Mock
    private WebClient.RequestHeadersSpec<?> requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    private NotificationClient enabledClient;
    private NotificationClient disabledClient;

    @BeforeEach
    void setUp() {
        when(webClientBuilder.baseUrl(any(String.class))).thenReturn(webClientBuilder);
        when(webClientBuilder.build()).thenReturn(webClient);

        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(any(String.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.header(any(String.class), any(String.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn((WebClient.RequestHeadersSpec) requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(any(Class.class))).thenReturn((Mono) Mono.empty());

        enabledClient = new NotificationClient(
                "http://notification:8003",
                true,
                webClientBuilder,
                jwtDecoder,
                orderItemRepository
        );

        disabledClient = new NotificationClient(
                "http://notification:8003",
                false,
                webClientBuilder,
                jwtDecoder,
                orderItemRepository
        );
    }

    @Test
    void sendOrderConfirmation_shouldSkipWhenDisabled() {
        disabledClient.sendOrderConfirmation(buildOrder(1L, "user@shop.com", "User Name"), "jwt");
        verify(webClient, never()).post();
    }

    @Test
    void sendOrderConfirmation_shouldUseStoredCustomerDataAndItems() {
        Order order = buildOrder(2L, "stored@shop.com", "Stored User");
        when(orderItemRepository.findByOrderId(2L)).thenReturn(List.of(
                new OrderItem(order, "SKU-1", "Coffee", 2, 1200L),
                new OrderItem(order, "SKU-2", "Milk", 1, 500L)
        ));

        enabledClient.sendOrderConfirmation(order, "jwt-token");

        verify(orderItemRepository).findByOrderId(2L);
        verify(requestBodyUriSpec).uri("/api/notification/order-confirmation");
        verify(requestBodySpec).header("Authorization", "Bearer jwt-token");
        verify(requestBodySpec).bodyValue(any(NotificationClient.OrderConfirmationRequest.class));
    }

    @Test
    void sendOrderConfirmation_shouldFallbackToJwtClaimsWhenStoredValuesMissing() {
        Order order = buildOrder(3L, null, null);
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("email", "jwt@shop.com")
                .claim("fullName", "Jwt User")
                .build();
        when(jwtDecoder.decode("jwt-token")).thenReturn(jwt);
        when(orderItemRepository.findByOrderId(3L)).thenReturn(List.of());

        enabledClient.sendOrderConfirmation(order, "jwt-token");

        verify(jwtDecoder).decode("jwt-token");
        verify(requestBodySpec).bodyValue(any(NotificationClient.OrderConfirmationRequest.class));
    }

    @Test
    void sendOrderConfirmation_shouldUseFallbackValuesWhenJwtDecodeFails() {
        Order order = buildOrder(4L, null, null);
        when(jwtDecoder.decode("bad-jwt")).thenThrow(new RuntimeException("invalid token"));
        when(orderItemRepository.findByOrderId(4L)).thenReturn(List.of());

        enabledClient.sendOrderConfirmation(order, "bad-jwt");

        verify(jwtDecoder).decode("bad-jwt");
        verify(requestBodySpec).bodyValue(any(NotificationClient.OrderConfirmationRequest.class));
    }

    @Test
    void sendShippingNotification_shouldExecuteHappyPath() {
        Order order = buildOrder(5L, "ship@shop.com", "Shipper");

        enabledClient.sendShippingNotification(order, "TRK123", "Tomorrow", "jwt-token");

        verify(requestBodyUriSpec).uri("/api/notification/shipping");
        verify(requestBodySpec).bodyValue(any(NotificationClient.ShippingNotificationRequest.class));
    }

    @Test
    void sendOrderPaidNotification_shouldExecuteHappyPath() {
        Order order = buildOrder(6L, "paid@shop.com", "Paid User");
        enabledClient.sendOrderPaidNotification(order, "jwt-token");
        verify(requestBodyUriSpec).uri("/api/notification/order-paid");
        verify(requestBodySpec).bodyValue(any(NotificationClient.OrderPaidRequest.class));
    }

    @Test
    void sendOrderDeliveredNotification_shouldExecuteHappyPath() {
        Order order = buildOrder(7L, "delivered@shop.com", "Delivered User");
        enabledClient.sendOrderDeliveredNotification(order, "jwt-token");
        verify(requestBodyUriSpec).uri("/api/notification/order-delivered");
        verify(requestBodySpec).bodyValue(any(NotificationClient.OrderDeliveredRequest.class));
    }

    @Test
    void sendOrderCancelledNotification_shouldExecuteHappyPath() {
        Order order = buildOrder(8L, "cancelled@shop.com", "Cancelled User");
        enabledClient.sendOrderCancelledNotification(order, "jwt-token");
        verify(requestBodyUriSpec).uri("/api/notification/order-cancelled");
        verify(requestBodySpec).bodyValue(any(NotificationClient.OrderCancelledRequest.class));
    }

    @Test
    void sendOrderRefundedNotification_shouldExecuteHappyPath() {
        Order order = buildOrder(9L, "refunded@shop.com", "Refunded User");
        enabledClient.sendOrderRefundedNotification(order, "jwt-token");
        verify(requestBodyUriSpec).uri("/api/notification/order-refunded");
        verify(requestBodySpec).bodyValue(any(NotificationClient.OrderRefundedRequest.class));
    }

    private Order buildOrder(Long id, String email, String name) {
        Order order = new Order("user-ref", "PENDING", 1999L);
        ReflectionTestUtils.setField(order, "id", id);
        ReflectionTestUtils.setField(order, "createdAt", Instant.now());
        order.setCustomerEmail(email);
        order.setCustomerName(name);
        order.setShippingRecipient("Fallback Recipient");
        return order;
    }
}