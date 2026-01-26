package org.kunlecreates.order.interfaces.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateOrderStatusRequest(
    @NotBlank String status
) {}
