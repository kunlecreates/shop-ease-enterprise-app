package org.kunlecreates.user.interfaces.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(max = 200, message = "Full name must be at most 200 characters")
    String fullName,
    
    String email
) {}
