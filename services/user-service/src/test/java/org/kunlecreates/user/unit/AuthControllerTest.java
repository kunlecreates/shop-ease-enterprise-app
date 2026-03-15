package org.kunlecreates.user.unit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kunlecreates.user.application.AuthService;
import org.kunlecreates.user.application.EmailVerificationService;
import org.kunlecreates.user.domain.exception.PasswordResetRequiredException;
import org.kunlecreates.user.interfaces.AuthController;
import org.kunlecreates.user.interfaces.dto.AuthResponse;
import org.kunlecreates.user.interfaces.dto.CreateUserRequest;
import org.kunlecreates.user.interfaces.dto.LoginRequest;
import org.kunlecreates.user.interfaces.dto.PasswordResetConfirm;
import org.kunlecreates.user.interfaces.dto.PasswordResetRequest;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private EmailVerificationService emailVerificationService;

    private AuthController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthController(authService, emailVerificationService);
    }

    @Test
    void register_shouldReturnCreatedOnSuccess() {
        CreateUserRequest request = new CreateUserRequest("new@shop.com", "pass123");
        AuthResponse authResponse = new AuthResponse("jwt", "1", "new@shop.com",
                new AuthResponse.UserInfo("1", "new", "new@shop.com", "CUSTOMER"));
        when(authService.register(request)).thenReturn(authResponse);

        ResponseEntity<?> response = controller.register(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isEqualTo(authResponse);
    }

    @Test
    void register_shouldReturnBadRequestOnIllegalArgument() {
        CreateUserRequest request = new CreateUserRequest("bad@shop.com", "pass123");
        when(authService.register(request)).thenThrow(new IllegalArgumentException("invalid request"));

        ResponseEntity<?> response = controller.register(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isEqualTo(Map.of("message", "invalid request"));
    }

    @Test
    void login_shouldReturnOkOnSuccess() {
        LoginRequest request = new LoginRequest("user@shop.com", "pass");
        AuthResponse authResponse = new AuthResponse("jwt", "1", "user@shop.com",
                new AuthResponse.UserInfo("1", "user", "user@shop.com", "CUSTOMER"));
        when(authService.login(request)).thenReturn(authResponse);

        ResponseEntity<?> response = controller.login(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(authResponse);
    }

    @Test
    void login_shouldReturnForbiddenWhenPasswordResetIsRequired() {
        LoginRequest request = new LoginRequest("user@shop.com", "pass");
        when(authService.login(request)).thenThrow(new PasswordResetRequiredException("reset required"));

        ResponseEntity<?> response = controller.login(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isEqualTo(Map.of("message", "password_reset_required"));
    }

    @Test
    void login_shouldReturnUnauthorizedOnIllegalArgument() {
        LoginRequest request = new LoginRequest("user@shop.com", "pass");
        when(authService.login(request)).thenThrow(new IllegalArgumentException("bad creds"));

        ResponseEntity<?> response = controller.login(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isEqualTo(Map.of("message", "Invalid email or password"));
    }

    @Test
    void requestPasswordReset_shouldReturnTokenWhenSuccessful() {
        PasswordResetRequest request = new PasswordResetRequest("user@shop.com");
        when(authService.initiatePasswordReset("user@shop.com")).thenReturn("reset-token");

        ResponseEntity<Map<String, String>> response = controller.requestPasswordReset(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Map.of(
                "resetToken", "reset-token",
                "message", "Password reset token generated"
        ));
    }

    @Test
    void requestPasswordReset_shouldReturnNotFoundWhenUserDoesNotExist() {
        PasswordResetRequest request = new PasswordResetRequest("missing@shop.com");
        when(authService.initiatePasswordReset(request.email())).thenThrow(new IllegalArgumentException("missing"));

        ResponseEntity<Map<String, String>> response = controller.requestPasswordReset(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isEqualTo(Map.of("message", "User not found"));
    }

    @Test
    void confirmPasswordReset_shouldReturnOkWhenSuccessful() {
        PasswordResetConfirm request = new PasswordResetConfirm("ok-token", "newpass");

        ResponseEntity<Map<String, String>> response = controller.confirmPasswordReset(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Map.of("message", "Password reset successful"));
        verify(authService).confirmPasswordReset("ok-token", "newpass");
    }

    @Test
    void confirmPasswordReset_shouldReturnBadRequestOnInvalidToken() {
        PasswordResetConfirm request = new PasswordResetConfirm("bad-token", "newpass");
        doThrow(new IllegalArgumentException("Invalid token")).when(authService).confirmPasswordReset("bad-token", "newpass");

        ResponseEntity<Map<String, String>> response = controller.confirmPasswordReset(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isEqualTo(Map.of("message", "Invalid token"));
    }

    @Test
    void verifyEmail_shouldReturnBadRequestWhenPayloadIsIncomplete() {
        ResponseEntity<Map<String, Object>> response = controller.verifyEmail(Map.of("email", "user@shop.com"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isEqualTo(Map.of("success", false, "message", "Email and token are required"));
    }

    @Test
    void verifyEmail_shouldReturnOkWhenVerificationSucceeds() {
        when(emailVerificationService.verifyEmail("user@shop.com", "token-1")).thenReturn(true);

        ResponseEntity<Map<String, Object>> response = controller.verifyEmail(Map.of(
                "email", "user@shop.com",
                "token", "token-1"
        ));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Map.of("success", true, "message", "Email verified successfully"));
    }

    @Test
    void verifyEmail_shouldReturnBadRequestWhenVerificationFails() {
        when(emailVerificationService.verifyEmail("user@shop.com", "token-1")).thenReturn(false);

        ResponseEntity<Map<String, Object>> response = controller.verifyEmail(Map.of(
                "email", "user@shop.com",
                "token", "token-1"
        ));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isEqualTo(Map.of("success", false, "message", "Invalid or expired verification token"));
    }

    @Test
    void verifyEmail_shouldReturnNotFoundOnIllegalArgument() {
        when(emailVerificationService.verifyEmail("user@shop.com", "token-1"))
                .thenThrow(new IllegalArgumentException("User not found"));

        ResponseEntity<Map<String, Object>> response = controller.verifyEmail(Map.of(
                "email", "user@shop.com",
                "token", "token-1"
        ));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isEqualTo(Map.of("success", false, "message", "User not found"));
    }

    @Test
    void resendVerification_shouldReturnBadRequestWhenEmailIsMissing() {
        ResponseEntity<Map<String, Object>> response = controller.resendVerification(Map.of());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isEqualTo(Map.of("success", false, "message", "Email is required"));
    }

    @Test
    void resendVerification_shouldReturnOkOnSuccess() {
        ResponseEntity<Map<String, Object>> response = controller.resendVerification(Map.of("email", "user@shop.com"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Map.of(
                "success", true,
                "message", "Verification email sent",
                "email", "user@shop.com"
        ));
        verify(emailVerificationService).resendVerificationEmail("user@shop.com");
    }

    @Test
    void resendVerification_shouldReturnNotFoundOnIllegalArgument() {
        doThrow(new IllegalArgumentException("User not found"))
                .when(emailVerificationService).resendVerificationEmail("missing@shop.com");

        ResponseEntity<Map<String, Object>> response = controller.resendVerification(Map.of("email", "missing@shop.com"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isEqualTo(Map.of("message", "User not found"));
    }

    @Test
    void resendVerification_shouldReturnBadRequestOnIllegalState() {
        doThrow(new IllegalStateException("already verified"))
                .when(emailVerificationService).resendVerificationEmail("verified@shop.com");

        ResponseEntity<Map<String, Object>> response = controller.resendVerification(Map.of("email", "verified@shop.com"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isEqualTo(Map.of("message", "already verified"));
    }
}