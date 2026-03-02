package org.kunlecreates.order.infrastructure.notification;

import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.domain.OrderItem;
import org.kunlecreates.order.repository.OrderItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class NotificationClient {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationClient.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMMM dd, yyyy HH:mm:ss z")
            .withZone(ZoneId.systemDefault());
    
    private final WebClient webClient;
    private final JwtDecoder jwtDecoder;
    private final OrderItemRepository orderItemRepository;
    private final boolean enabled;
    
    public NotificationClient(
            @Value("${notification.service.url:http://localhost:8003}") String notificationServiceUrl,
            @Value("${notification.service.enabled:true}") boolean enabled,
            WebClient.Builder webClientBuilder,
            JwtDecoder jwtDecoder,
            OrderItemRepository orderItemRepository
    ) {
        this.webClient = webClientBuilder
                .baseUrl(notificationServiceUrl)
                .build();
        this.jwtDecoder = jwtDecoder;
        this.orderItemRepository = orderItemRepository;
        this.enabled = enabled;
        logger.info("NotificationClient initialized with URL: {} (enabled: {})", notificationServiceUrl, enabled);
    }

    /**
     * Extract user email from JWT token claims
     * The email is already authenticated and included in the JWT by user-service
     * Returns email if found, otherwise returns a fallback email with warning
     */
    private String extractEmailFromJwt(String jwtToken) {
        try {
            Jwt jwt = jwtDecoder.decode(jwtToken);
            String email = jwt.getClaimAsString("email");
            
            if (email != null && !email.isEmpty()) {
                logger.debug("Extracted email {} from JWT", email);
                return email;
            } else {
                logger.warn("JWT token does not contain email claim. Using fallback.");
                return "noreply@example.com";
            }
        } catch (Exception e) {
            logger.error("Failed to decode JWT or extract email: {}. Using fallback email.", e.getMessage());
            return "noreply@example.com";
        }
    }

    /**
     * Extract customer full name from JWT token claims
     * Returns fullName or "Customer" as fallback
     */
    private String extractCustomerNameFromJwt(String jwtToken) {
        try {
            Jwt jwt = jwtDecoder.decode(jwtToken);
            String fullName = jwt.getClaimAsString("fullName");
            
            // Enhanced debug logging to understand JWT contents
            logger.debug("JWT claims: {}", jwt.getClaims().keySet());
            logger.debug("Extracted fullName claim: '{}'", fullName);
            
            if (fullName != null && !fullName.isEmpty()) {
                logger.info("Using customer name from JWT: {}", fullName);
                return fullName;
            } else {
                logger.warn("JWT token does not contain fullName claim or it is empty. Using fallback 'Customer'.");
                logger.debug("Available JWT claims: {}", jwt.getClaims());
                return "Customer";
            }
        } catch (Exception e) {
            logger.error("Failed to decode JWT or extract name: {}. Using fallback 'Customer'.", e.getMessage(), e);
            return "Customer";
        }
    }
    
    /**
     * Resolve the customer email for notifications.
     * Prefers the email stored on the order (set at creation time from the customer's JWT),
     * falls back to extracting from the provided JWT for backwards compatibility.
     */
    private String resolveCustomerEmail(Order order, String jwtToken) {
        String stored = order.getCustomerEmail();
        if (stored != null && !stored.isEmpty()) {
            return stored;
        }
        logger.warn("Order {} has no stored customer email, falling back to JWT extraction", order.getId());
        return extractEmailFromJwt(jwtToken);
    }

    /**
     * Resolve the customer display name for notifications.
     * Prefers the name stored on the order, falls back to JWT extraction or shipping recipient.
     */
    private String resolveCustomerName(Order order, String jwtToken) {
        String stored = order.getCustomerName();
        if (stored != null && !stored.isEmpty() && !stored.equals("Customer")) {
            return stored;
        }
        // Try shipping recipient as a human-readable fallback
        String recipient = order.getShippingRecipient();
        if (recipient != null && !recipient.isEmpty()) {
            return recipient;
        }
        return extractCustomerNameFromJwt(jwtToken);
    }

    /**
     * Send order confirmation email
     * Extracts customer name and email from JWT token claims
     */
    public void sendOrderConfirmation(Order order, String jwtToken) {
        if (!enabled) {
            logger.debug("Notification service disabled, skipping order confirmation email");
            return;
        }
        
        try {
            String userEmail = resolveCustomerEmail(order, jwtToken);
            String customerName = resolveCustomerName(order, jwtToken);
            
            // Fetch order items from database
            List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());
            List<OrderItemDto> itemDtos = orderItems.stream()
                    .map(item -> new OrderItemDto(
                            item.getProductRef(),  // Using productRef as name (TODO: fetch product details)
                            item.getProductRef(),  // Using productRef as SKU
                            item.getQuantity(),
                            item.getUnitPriceCents() / 100.0  // Convert cents to dollars
                    ))
                    .collect(Collectors.toList());
            
            logger.debug("Fetched {} order items for order {}", itemDtos.size(), order.getId());
            
            OrderConfirmationRequest request = new OrderConfirmationRequest(
                    order.getId().intValue(),
                    customerName,
                    userEmail,
                    order.getTotal(),
                    itemDtos,
                    formatInstant(order.getCreatedAt())
            );
            
            webClient.post()
                    .uri("/api/notification/order-confirmation")
                    .header("Authorization", "Bearer " + jwtToken)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(EmailResponse.class)
                    .timeout(Duration.ofSeconds(5))
                    .doOnSuccess(response -> logger.info("Order confirmation email sent for order {}: {}", 
                            order.getId(), response.message_id()))
                    .doOnError(error -> logger.error("Failed to send order confirmation email for order {}: {}", 
                            order.getId(), error.getMessage()))
                    .onErrorResume(throwable -> Mono.empty())
                    .subscribe();
                    
        } catch (Exception e) {
            logger.error("Error sending order confirmation for order {}: {}", order.getId(), e.getMessage());
        }
    }
    
    /**
     * Send shipping notification email
     */
    public void sendShippingNotification(Order order, String trackingNumber, String estimatedDelivery, String jwtToken) {
        if (!enabled) {
            logger.debug("Notification service disabled, skipping shipping notification email");
            return;
        }
        
        try {
            String userEmail = resolveCustomerEmail(order, jwtToken);
            String customerName = resolveCustomerName(order, jwtToken);
            
            ShippingNotificationRequest request = new ShippingNotificationRequest(
                    order.getId().intValue(),
                    customerName,
                    userEmail,
                    trackingNumber,
                    estimatedDelivery
            );
            
            webClient.post()
                    .uri("/api/notification/shipping")
                    .header("Authorization", "Bearer " + jwtToken)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(EmailResponse.class)
                    .timeout(Duration.ofSeconds(5))
                    .doOnSuccess(response -> logger.info("Shipping notification email sent for order {}: {}", 
                            order.getId(), response.message_id()))
                    .doOnError(error -> logger.error("Failed to send shipping notification email for order {}: {}", 
                            order.getId(), error.getMessage()))
                    .onErrorResume(throwable -> Mono.empty())
                    .subscribe();
                    
        } catch (Exception e) {
            logger.error("Error sending shipping notification for order {}: {}", order.getId(), e.getMessage());
        }
    }
    
    /**
     * Send payment confirmation email
     */
    public void sendOrderPaidNotification(Order order, String jwtToken) {
        if (!enabled) {
            logger.debug("Notification service disabled, skipping payment confirmation email");
            return;
        }
        
        try {
            String userEmail = resolveCustomerEmail(order, jwtToken);
            String customerName = resolveCustomerName(order, jwtToken);
            
            OrderPaidRequest request = new OrderPaidRequest(
                    order.getId().intValue(),
                    customerName,
                    userEmail,
                    order.getTotal()
            );
            
            webClient.post()
                    .uri("/api/notification/order-paid")
                    .header("Authorization", "Bearer " + jwtToken)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(EmailResponse.class)
                    .timeout(Duration.ofSeconds(5))
                    .doOnSuccess(response -> logger.info("Payment confirmation email sent for order {}: {}", 
                            order.getId(), response.message_id()))
                    .doOnError(error -> logger.error("Failed to send payment confirmation email for order {}: {}", 
                            order.getId(), error.getMessage()))
                    .onErrorResume(throwable -> Mono.empty())
                    .subscribe();
                    
        } catch (Exception e) {
            logger.error("Error sending payment confirmation for order {}: {}", order.getId(), e.getMessage());
        }
    }
    
    /**
     * Send delivery confirmation email
     */
    public void sendOrderDeliveredNotification(Order order, String jwtToken) {
        if (!enabled) {
            logger.debug("Notification service disabled, skipping delivery confirmation email");
            return;
        }
        
        try {
            String userEmail = resolveCustomerEmail(order, jwtToken);
            String customerName = resolveCustomerName(order, jwtToken);
            
            OrderDeliveredRequest request = new OrderDeliveredRequest(
                    order.getId().intValue(),
                    customerName,
                    userEmail
            );
            
            webClient.post()
                    .uri("/api/notification/order-delivered")
                    .header("Authorization", "Bearer " + jwtToken)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(EmailResponse.class)
                    .timeout(Duration.ofSeconds(5))
                    .doOnSuccess(response -> logger.info("Delivery confirmation email sent for order {}: {}", 
                            order.getId(), response.message_id()))
                    .doOnError(error -> logger.error("Failed to send delivery confirmation email for order {}: {}", 
                            order.getId(), error.getMessage()))
                    .onErrorResume(throwable -> Mono.empty())
                    .subscribe();
                    
        } catch (Exception e) {
            logger.error("Error sending delivery confirmation for order {}: {}", order.getId(), e.getMessage());
        }
    }
    
    /**
     * Send cancellation notification email
     */
    public void sendOrderCancelledNotification(Order order, String jwtToken) {
        if (!enabled) {
            logger.debug("Notification service disabled, skipping cancellation notification email");
            return;
        }
        
        try {
            String userEmail = resolveCustomerEmail(order, jwtToken);
            String customerName = resolveCustomerName(order, jwtToken);
            
            OrderCancelledRequest request = new OrderCancelledRequest(
                    order.getId().intValue(),
                    customerName,
                    userEmail
            );
            
            webClient.post()
                    .uri("/api/notification/order-cancelled")
                    .header("Authorization", "Bearer " + jwtToken)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(EmailResponse.class)
                    .timeout(Duration.ofSeconds(5))
                    .doOnSuccess(response -> logger.info("Cancellation notification email sent for order {}: {}", 
                            order.getId(), response.message_id()))
                    .doOnError(error -> logger.error("Failed to send cancellation notification email for order {}: {}", 
                            order.getId(), error.getMessage()))
                    .onErrorResume(throwable -> Mono.empty())
                    .subscribe();
                    
        } catch (Exception e) {
            logger.error("Error sending cancellation notification for order {}: {}", order.getId(), e.getMessage());
        }
    }
    
    /**
     * Send refund confirmation email
     */
    public void sendOrderRefundedNotification(Order order, String jwtToken) {
        if (!enabled) {
            logger.debug("Notification service disabled, skipping refund confirmation email");
            return;
        }
        
        try {
            String userEmail = resolveCustomerEmail(order, jwtToken);
            String customerName = resolveCustomerName(order, jwtToken);
            
            OrderRefundedRequest request = new OrderRefundedRequest(
                    order.getId().intValue(),
                    customerName,
                    userEmail,
                    order.getTotal()
            );
            
            webClient.post()
                    .uri("/api/notification/order-refunded")
                    .header("Authorization", "Bearer " + jwtToken)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(EmailResponse.class)
                    .timeout(Duration.ofSeconds(5))
                    .doOnSuccess(response -> logger.info("Refund confirmation email sent for order {}: {}", 
                            order.getId(), response.message_id()))
                    .doOnError(error -> logger.error("Failed to send refund confirmation email for order {}: {}", 
                            order.getId(), error.getMessage()))
                    .onErrorResume(throwable -> Mono.empty())
                    .subscribe();
                    
        } catch (Exception e) {
            logger.error("Error sending refund confirmation for order {}: {}", order.getId(), e.getMessage());
        }
    }
    
    private String formatInstant(Instant instant) {
        return DATE_FORMATTER.format(instant);
    }
    
    record OrderConfirmationRequest(
            Integer order_id,
            String customer_name,
            String customer_email,
            Double order_total,
            List<OrderItemDto> items,
            String order_date
    ) {}
    
    record OrderItemDto(
            String name,
            String sku,
            Integer quantity,
            Double price
    ) {}
    
    record ShippingNotificationRequest(
            Integer order_id,
            String customer_name,
            String customer_email,
            String tracking_number,
            String estimated_delivery
    ) {}
    
    record OrderPaidRequest(
            Integer order_id,
            String customer_name,
            String customer_email,
            Double order_total
    ) {}
    
    record OrderDeliveredRequest(
            Integer order_id,
            String customer_name,
            String customer_email
    ) {}
    
    record OrderCancelledRequest(
            Integer order_id,
            String customer_name,
            String customer_email
    ) {}
    
    record OrderRefundedRequest(
            Integer order_id,
            String customer_name,
            String customer_email,
            Double refund_amount
    ) {}
    
    record EmailResponse(
            String message_id,
            String status,
            String recipient
    ) {}
}
