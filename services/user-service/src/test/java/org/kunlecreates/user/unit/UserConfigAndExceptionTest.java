package org.kunlecreates.user.unit;

import org.junit.jupiter.api.Test;
import org.kunlecreates.user.config.SecurityConfig;
import org.kunlecreates.user.domain.exception.DuplicateUserException;
import org.kunlecreates.user.domain.exception.PasswordResetRequiredException;
import org.kunlecreates.user.domain.exception.PasswordResetTokenException;
import org.kunlecreates.user.infrastructure.security.JwtConfig;
import org.kunlecreates.user.interfaces.exception.GlobalExceptionHandler;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class UserConfigAndExceptionTest {

    @Test
    void securityConfig_shouldCreateJwtAuthenticationConverter() {
        SecurityConfig config = new SecurityConfig();
        JwtAuthenticationConverter converter = config.jwtAuthenticationConverter();
        assertThat(converter).isNotNull();
    }

    @Test
    void jwtConfig_shouldCreateEncoderDecoderAndPasswordEncoder() {
        JwtConfig config = new JwtConfig();
        ReflectionTestUtils.setField(config, "jwtSecret", "this-is-a-very-long-test-secret-for-hs256-signing");

        assertThat(config.passwordEncoder()).isNotNull();
        assertThat(config.jwtEncoder()).isNotNull();
        assertThat(config.jwtDecoder()).isNotNull();
    }

    @Test
    void globalExceptionHandler_shouldMapKnownExceptions() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        var duplicate = handler.handleDuplicateUser(new DuplicateUserException("exists"));
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(duplicate.getBody()).isEqualTo(Map.of("error", "exists"));

        var resetRequired = handler.handlePasswordResetRequired(new PasswordResetRequiredException("reset"));
        assertThat(resetRequired.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(resetRequired.getBody()).isEqualTo(Map.of("error", "reset"));

        var tokenError = handler.handlePasswordResetToken(new PasswordResetTokenException("invalid"));
        assertThat(tokenError.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(tokenError.getBody()).isEqualTo(Map.of("error", "invalid"));

        var badArg = handler.handleIllegalArgument(new IllegalArgumentException("bad"));
        assertThat(badArg.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(badArg.getBody()).isEqualTo(Map.of("error", "bad"));
    }
}