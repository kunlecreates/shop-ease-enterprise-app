package org.kunlecreates.order.infrastructure.product;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

/**
 * Service-to-service client for adjusting product stock levels.
 * Uses an internal API key (X-Internal-Api-Key) rather than a customer JWT,
 * since stock changes are system-initiated and not user-scoped.
 */
@Component
public class ProductServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(ProductServiceClient.class);

    private final WebClient webClient;
    private final String internalApiKey;
    private final boolean enabled;

    public ProductServiceClient(
            @Value("${product.service.url:http://localhost:8081}") String productServiceUrl,
            @Value("${product.service.internal-api-key:}") String internalApiKey,
            @Value("${product.service.enabled:true}") boolean enabled,
            WebClient.Builder webClientBuilder
    ) {
        this.webClient = webClientBuilder.baseUrl(productServiceUrl).build();
        this.internalApiKey = internalApiKey;
        this.enabled = enabled;
        logger.info("ProductServiceClient initialized with URL: {} (enabled: {})", productServiceUrl, enabled);
    }

    /**
     * Adjust stock for a product by its SKU.
     * @param sku       The product SKU stored as productRef on the order item
     * @param delta     Negative to decrement (sale), positive to restore (cancel/refund)
     * @param reason    Human-readable reason recorded in stock movement history
     */
    public void adjustStock(String sku, int delta, String reason) {
        if (!enabled) {
            logger.debug("Product service disabled, skipping stock adjustment for SKU {}", sku);
            return;
        }
        if (internalApiKey == null || internalApiKey.isBlank()) {
            logger.warn("INTERNAL_SERVICE_API_KEY is not configured — skipping stock adjustment for SKU {}", sku);
            return;
        }

        webClient.patch()
                .uri("/api/product/internal/{sku}/stock", sku)
                .header("X-Internal-Api-Key", internalApiKey)
                .bodyValue(Map.of("adjustment", delta, "reason", reason))
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .doOnSuccess(r -> logger.info("Stock adjusted for SKU {}: delta={}, reason={}", sku, delta, reason))
                .doOnError(e -> logger.error("Failed to adjust stock for SKU {}: {}", sku, e.getMessage()))
                .onErrorResume(e -> Mono.empty())
                .subscribe();
    }
}
