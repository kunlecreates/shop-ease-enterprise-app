package org.kunlecreates.order.interfaces.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AddCartItemRequest(
    @NotNull String productRef,
    @NotNull @Min(1) Integer quantity,
    @NotNull Long unitPriceCents
) {}
