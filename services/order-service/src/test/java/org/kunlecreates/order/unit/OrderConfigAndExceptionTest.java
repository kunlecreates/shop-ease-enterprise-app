package org.kunlecreates.order.unit;

import org.junit.jupiter.api.Test;
import org.kunlecreates.order.config.SecurityConfig;
import org.kunlecreates.order.domain.exception.ResourceNotFoundException;
import org.kunlecreates.order.infrastructure.security.JwtConfig;
import org.kunlecreates.order.interfaces.exception.GlobalExceptionHandler;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class OrderConfigAndExceptionTest {

    @Test
    void securityConfig_shouldCreateJwtAuthenticationConverter() {
        SecurityConfig config = new SecurityConfig();
        JwtAuthenticationConverter converter = config.jwtAuthenticationConverter();
        assertThat(converter).isNotNull();
    }

    @Test
    void jwtConfig_shouldCreateJwtDecoder() {
        JwtConfig config = new JwtConfig();
        ReflectionTestUtils.setField(config, "jwtSecret", "this-is-a-very-long-test-secret-for-hs256-signing");
        assertThat(config.jwtDecoder()).isNotNull();
    }

    @Test
    void globalExceptionHandler_shouldMapExceptionsToExpectedStatusCodes() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        var notFound = handler.handleResourceNotFound(new ResourceNotFoundException("missing"));
        assertThat(notFound.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(notFound.getBody()).isEqualTo(Map.of("error", "missing"));

        var badRequest = handler.handleIllegalArgument(new IllegalArgumentException("bad input"));
        assertThat(badRequest.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(badRequest.getBody()).isEqualTo(Map.of("error", "bad input"));

        var conflict = handler.handleIllegalState(new IllegalStateException("conflict"));
        assertThat(conflict.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(conflict.getBody()).isEqualTo(Map.of("error", "conflict"));
    }
}