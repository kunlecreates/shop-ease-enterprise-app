package org.kunlecreates.order.infrastructure.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
public class UserClient {
    
    private static final Logger logger = LoggerFactory.getLogger(UserClient.class);
    
    private final WebClient webClient;
    
    public UserClient(
            @Value("${user.service.url:http://localhost:8081}") String userServiceUrl,
            WebClient.Builder webClientBuilder
    ) {
        this.webClient = webClientBuilder
                .baseUrl(userServiceUrl)
                .build();
        logger.info("UserClient initialized with URL: {}", userServiceUrl);
    }
    
    /**
     * Fetch user details by user ID
     * Uses service-level JWT token for authentication
     */
    public Mono<UserResponse> getUserById(Long userId, String jwtToken) {
        return webClient.get()
                .uri("/api/user/{id}", userId)
                .header("Authorization", "Bearer " + jwtToken)
                .retrieve()
                .bodyToMono(UserResponse.class)
                .timeout(Duration.ofSeconds(5))
                .doOnSuccess(user -> logger.debug("Fetched user {} with email {}", userId, user.email()))
                .doOnError(error -> logger.error("Failed to fetch user {}: {}", userId, error.getMessage()))
                .onErrorResume(throwable -> {
                    logger.warn("Error fetching user {}, using fallback", userId);
                    return Mono.empty();
                });
    }
}
