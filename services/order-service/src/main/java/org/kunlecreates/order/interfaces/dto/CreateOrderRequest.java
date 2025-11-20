package org.kunlecreates.order.interfaces.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateOrderRequest(
    @NotNull
    Long userId,

    @NotNull
    String status,

    @Min(0)
    double total
) {}
