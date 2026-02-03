package org.kunlecreates.order.interfaces.dto;

import java.time.Instant;

public record OrderResponse(
    Long id,
    String userRef,
    String status,
    Long totalCents,
    String currency,
    Instant placedAt,
    Instant createdAt,
    Instant updatedAt
) {}
