package org.kunlecreates.order.infrastructure.notification;

import org.kunlecreates.order.domain.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class NotificationClient {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationClient.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMMM dd, yyyy HH:mm:ss z")
            .withZone(ZoneId.systemDefault());
    
    private final WebClient webClient;
    private final boolean enabled;
    
    public NotificationClient(
            @Value("${notification.service.url:http://localhost:8003}") String notificationServiceUrl,
            @Value("${notification.service.enabled:true}") boolean enabled,
            WebClient.Builder webClientBuilder
    ) {
        this.webClient = webClientBuilder
                .baseUrl(notificationServiceUrl)
                .build();
        this.enabled = enabled;
        logger.info("NotificationClient initialized with URL: {} (enabled: {})", notificationServiceUrl, enabled);
    }
    
    /**
     * Send order confirmation email
     * Note: Currently uses userRef for customer name/email as a temporary solution
     * TODO: Add proper customer fields to Order entity
     */
    public void sendOrderConfirmation(Order order, String jwtToken) {
        if (!enabled) {
            logger.debug("Notification service disabled, skipping order confirmation email");
            return;
        }
        
        try {
            // Use userRef as email (assuming it's the user's email or ID)
            // In production, we'd fetch user details from user-service
            String userEmail = order.getUserRef() + "@example.com"; // Temporary: append domain if needed
            
            OrderConfirmationRequest request = new OrderConfirmationRequest(
                    order.getId().intValue(),
                    order.getUserRef(), // Using userRef as customer name temporarily
                    userEmail,
                    order.getTotal(),
                    List.of(), // Empty items list for now - TODO: fetch from OrderItem repository
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
            String userEmail = order.getUserRef() + "@example.com";
            
            ShippingNotificationRequest request = new ShippingNotificationRequest(
                    order.getId().intValue(),
                    order.getUserRef(),
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
    
    record EmailResponse(
            String message_id,
            String status,
            String recipient
    ) {}
}
