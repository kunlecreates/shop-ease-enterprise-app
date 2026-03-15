package org.kunlecreates.user.unit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kunlecreates.user.infrastructure.security.JwtService;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @Mock
    private JwtEncoder jwtEncoder;

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(jwtEncoder);
        ReflectionTestUtils.setField(jwtService, "issuer", "shopease-test");
        ReflectionTestUtils.setField(jwtService, "expiryMinutes", 30L);
    }

    @Test
    void generateToken_shouldIncludeFullNameWhenProvided() {
        Jwt jwt = new Jwt("token-value", Instant.now(), Instant.now().plusSeconds(1800),
                java.util.Map.of("alg", "HS256"), java.util.Map.of("sub", "1"));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(jwt);

        String token = jwtService.generateToken("1", "user@shop.com", List.of("CUSTOMER"), "Jane User");

        assertThat(token).isEqualTo("token-value");
    }

    @Test
    void generateToken_shouldAllowMissingFullName() {
        Jwt jwt = new Jwt("token-no-name", Instant.now(), Instant.now().plusSeconds(1800),
                java.util.Map.of("alg", "HS256"), java.util.Map.of("sub", "2"));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(jwt);

        String token = jwtService.generateToken("2", "noname@shop.com", List.of("ADMIN"), "");

        assertThat(token).isEqualTo("token-no-name");
    }
}