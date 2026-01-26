package org.kunlecreates.user.interfaces.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import org.kunlecreates.user.domain.User;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

public record UserResponse(
    String id,
    String email,
    String firstName,
    String lastName,
    boolean isActive,
    Set<String> roles,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime createdAt,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime updatedAt,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime lastLoginAt
) {
    public static UserResponse from(User user) {
        String fullName = user.getFullName();
        String firstName = "";
        String lastName = "";
        
        if (fullName != null && !fullName.isEmpty()) {
            String[] parts = fullName.split(" ", 2);
            firstName = parts[0];
            lastName = parts.length > 1 ? parts[1] : "";
        }
        
        return new UserResponse(
            user.getId().toString(),
            user.getEmail(),
            firstName,
            lastName,
            user.getIsActive() == 1,
            user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toSet()),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            user.getLastLoginAt()
        );
    }
}
