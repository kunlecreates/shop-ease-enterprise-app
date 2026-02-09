package org.kunlecreates.user.interfaces.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(max = 100, message = "First name must be at most 100 characters")
    String firstName,
    
    @Size(max = 100, message = "Last name must be at most 100 characters")
    String lastName,
    
    String email,
    
    @Size(min = 6, message = "Password must be at least 6 characters")
    String currentPassword,
    
    @Size(min = 6, message = "Password must be at least 6 characters")
    String newPassword
) {}
