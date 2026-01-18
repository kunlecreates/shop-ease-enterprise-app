package org.kunlecreates.order.test;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Helper class for generating JWT tokens in integration tests.
 * Matches the JWT secret and algorithm configured in application.yml.
 */
public class JwtTestHelper {
    
    // Must match the default JWT secret in application.yml
    private static final String JWT_SECRET = "test-secret-key-for-development-only-min-256-bits-required-for-hs256-algorithm";
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
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("roles", roles);
        
        return Jwts.builder()
                .header().add("alg", "HS256").and()  // Explicitly set algorithm header
                .issuer("shopease")  // Match the default issuer in application.yml
                .subject(username)
                .claims(claims)
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
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", username + "@example.com");
        claims.put("roles", List.of("ROLE_USER"));
        
        return Jwts.builder()
                .issuer("shopease")
                .subject(username)
                .claims(claims)
                .issuedAt(Date.from(past))
                .expiration(Date.from(expiration))
                .signWith(SECRET_KEY)
                .compact();
    }
}
