package org.kunlecreates.order.infrastructure.user;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.Set;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UserResponse(
    String id,
    String email,
    String firstName,
    String lastName,
    boolean isActive,
    Set<String> roles,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    LocalDateTime lastLoginAt
) {}
