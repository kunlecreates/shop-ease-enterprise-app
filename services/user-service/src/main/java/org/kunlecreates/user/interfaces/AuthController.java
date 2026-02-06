package org.kunlecreates.user.interfaces;

import jakarta.validation.Valid;
import org.kunlecreates.user.application.AuthService;
import org.kunlecreates.user.application.EmailVerificationService;
import org.kunlecreates.user.interfaces.dto.AuthResponse;
import org.kunlecreates.user.interfaces.dto.CreateUserRequest;
import org.kunlecreates.user.interfaces.dto.LoginRequest;
import org.kunlecreates.user.interfaces.dto.PasswordResetRequest;
import org.kunlecreates.user.interfaces.dto.PasswordResetConfirm;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.kunlecreates.user.domain.exception.PasswordResetRequiredException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    public AuthController(AuthService authService, EmailVerificationService emailVerificationService) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody CreateUserRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Invalid registration data"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (PasswordResetRequiredException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "password_reset_required"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid email or password"));
        }
    }

    @PostMapping("/password-reset-request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequest request) {
        try {
            String token = authService.initiatePasswordReset(request.email());
            Map<String, String> response = new HashMap<>();
            response.put("resetToken", token);
            response.put("message", "Password reset token generated");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "User not found"));
        }
    }

    @PostMapping("/password-reset-confirm")
    public ResponseEntity<Map<String, String>> confirmPasswordReset(
            @Valid @RequestBody PasswordResetConfirm request) {
        try {
            authService.confirmPasswordReset(request.token(), request.newPassword());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password reset successful");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Invalid or expired reset token"));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String token = request.get("token");
            
            if (email == null || token == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Email and token are required"));
            }
            
            boolean verified = emailVerificationService.verifyEmail(email, token);
            if (verified) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Email verified successfully"
                ));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Invalid or expired verification token"));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, Object>> resendVerification(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Email is required"));
            }
            emailVerificationService.resendVerificationEmail(email);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Verification email sent",
                "email", email
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
        }
    }
}
