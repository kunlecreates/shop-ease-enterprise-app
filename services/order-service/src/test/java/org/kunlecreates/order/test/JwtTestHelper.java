package org.kunlecreates.order.test;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

/**
 * Helper class for generating JWT tokens in integration tests.
 * Matches the JWT secret and algorithm configured in application.yml.
 */
public class JwtTestHelper {
    
    // Must match the default JWT secret in application.yml
    private static final String JWT_SECRET = "test-secret-key-minimum-256-bits-for-development-only";
    private static final SecretKey SECRET_KEY = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
    
    /**
     * Creates a valid JWT token for testing
     * 
     * @param username The username (subject) for the token
     * @param email The user's email
     * @param roles The user's roles
     * @return A valid JWT token string
     */
    public static String createToken(String username, String email, List<String> roles) {
        Instant now = Instant.now();
        Instant expiration = now.plus(30, ChronoUnit.MINUTES);
        
        return Jwts.builder()
                .subject(username)
                .claim("email", email)
                .claim("roles", roles)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(SECRET_KEY)
                .compact();
    }
    
    /**
     * Creates a valid JWT token with default USER role
     * 
     * @param username The username (subject) for the token
     * @return A valid JWT token string
     */
    public static String createToken(String username) {
        return createToken(username, username + "@example.com", List.of("ROLE_USER"));
    }
    
    /**
     * Creates an expired JWT token for testing
     * 
     * @param username The username (subject) for the token
     * @return An expired JWT token string
     */
    public static String createExpiredToken(String username) {
        Instant past = Instant.now().minus(10, ChronoUnit.MINUTES);
        Instant expiration = past.minus(5, ChronoUnit.MINUTES);
        
        return Jwts.builder()
                .subject(username)
                .claim("email", username + "@example.com")
                .claim("roles", List.of("ROLE_USER"))
                .issuedAt(Date.from(past))
                .expiration(Date.from(expiration))
                .signWith(SECRET_KEY)
                .compact();
    }
}
