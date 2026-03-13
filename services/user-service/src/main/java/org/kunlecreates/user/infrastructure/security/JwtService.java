package org.kunlecreates.user.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;

    @Value("${jwt.issuer:shopease}")
    private String issuer;

    @Value("${jwt.expiry-minutes:60}")
    private long expiryMinutes;

    public JwtService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public String generateToken(String userId, String email, List<String> roles, String fullName) {
        Instant now = Instant.now();
        Instant expiry = now.plus(expiryMinutes, ChronoUnit.MINUTES);

        // Build JWT headers with explicit algorithm specification
        JwsHeader headers = JwsHeader.with(() -> "HS256").build();

        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(now)
                .expiresAt(expiry)
                .subject(userId)
                .claim("email", email)
                .claim("roles", roles);
        
        // Only add fullName claim if it's not null and not empty
        if (fullName != null && !fullName.isEmpty()) {
            claimsBuilder.claim("fullName", fullName);
        }

        return jwtEncoder.encode(JwtEncoderParameters.from(headers, claimsBuilder.build())).getTokenValue();
    }
}
