package org.kunlecreates.order.infrastructure.product;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProductServiceClientTest {

    @Mock
    private WebClient.Builder webClientBuilder;

    @Mock
    private WebClient webClient;

    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private WebClient.RequestBodySpec requestBodySpec;

    @Mock
    private WebClient.RequestHeadersSpec<?> requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    @BeforeEach
    void setUp() {
        when(webClientBuilder.baseUrl(any(String.class))).thenReturn(webClientBuilder);
        when(webClientBuilder.build()).thenReturn(webClient);
        when(webClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(eq("/api/product/internal/{sku}/stock"), any(String.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.header(any(String.class), any(String.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn((WebClient.RequestHeadersSpec) requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(any(Class.class))).thenReturn((Mono) Mono.empty());
    }

    @Test
    void adjustStock_shouldSkipWhenDisabled() {
        ProductServiceClient client = new ProductServiceClient(
                "http://product:8081",
                "api-key",
                false,
                webClientBuilder
        );

        client.adjustStock("SKU-1", -2, "Order paid");

        verify(webClient, never()).patch();
    }

    @Test
    void adjustStock_shouldSkipWhenInternalApiKeyMissing() {
        ProductServiceClient client = new ProductServiceClient(
                "http://product:8081",
                "   ",
                true,
                webClientBuilder
        );

        client.adjustStock("SKU-1", -2, "Order paid");

        verify(webClient, never()).patch();
    }

    @Test
    void adjustStock_shouldCallInternalApiWhenEnabledWithKey() {
        ProductServiceClient client = new ProductServiceClient(
                "http://product:8081",
                "secret-key",
                true,
                webClientBuilder
        );

        client.adjustStock("SKU-2", 3, "Order cancelled");

        verify(webClient).patch();
        verify(requestBodyUriSpec).uri("/api/product/internal/{sku}/stock", "SKU-2");
        verify(requestBodySpec).header("X-Internal-Api-Key", "secret-key");
        verify(requestBodySpec).bodyValue(any());
    }
}