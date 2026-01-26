package org.kunlecreates.user.interfaces.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateRoleRequest(
    @NotBlank(message = "Role name is required")
    String role
) {}
