package org.kunlecreates.user.interfaces.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
    @NotNull(message = "isActive status is required")
    Boolean isActive
) {}
