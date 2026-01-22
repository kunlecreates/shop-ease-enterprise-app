package org.kunlecreates.user.interfaces.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AuthResponse(
    String token,
    @JsonProperty("userId")
    String userId,
    String email
) {
    // Add 'id' as alias for 'userId' for backward compatibility with tests
    @JsonProperty("id")
    public String id() {
        return userId;
    }
}
