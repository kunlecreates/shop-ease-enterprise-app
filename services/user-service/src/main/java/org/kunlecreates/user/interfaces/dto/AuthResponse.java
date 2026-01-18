package org.kunlecreates.user.interfaces.dto;

public record AuthResponse(
    String token,
    String userId,
    String email
) {}
