package org.kunlecreates.user.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.oracle.OracleContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.kunlecreates.user.test.TestContainersConfig;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for Password Reset lifecycle against a real Oracle Free database.
 * Tests full stack: Controller → Service → Repository → Database (Testcontainers).
 *
 * Covers:
 * - Full password reset flow: request → confirm → login with new password
 * - Request for unknown email returns 404
 * - Confirmation with invalid token returns 400
 * - Confirmation with expired token returns 400
 * - Duplicate active token request returns 400
 * - Login blocked while a pending reset token exists
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@Import(TestContainersConfig.class)
@org.springframework.test.context.ActiveProfiles("test")
public class PasswordResetIT {

    @Container
    static OracleContainer oracle = new OracleContainer("gvenzl/oracle-free:slim-faststart")
            .withUsername("USER_SVC")
            .withPassword("test")
            .withStartupTimeout(java.time.Duration.ofMinutes(5));

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", oracle::getJdbcUrl);
        registry.add("spring.datasource.username", oracle::getUsername);
        registry.add("spring.datasource.password", oracle::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "oracle.jdbc.OracleDriver");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.OracleDialect");
        registry.add("spring.jpa.properties.hibernate.default_schema", oracle::getUsername);
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String authBase;

    @BeforeEach
    void setUp() {
        authBase = "http://localhost:" + port + "/api/auth";
        cleanupDatabase();
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        try {
            jdbcTemplate.execute("DELETE FROM password_reset_tokens");
            jdbcTemplate.execute("DELETE FROM email_verification_tokens");
            jdbcTemplate.execute("DELETE FROM user_roles");
            jdbcTemplate.execute("DELETE FROM users");
        } catch (Exception e) {
            System.err.println("Cleanup warning: " + e.getMessage());
        }
    }

    /**
     * Register a user using a @example.com email, which triggers auto-verification
     * via EmailVerificationService#isTestEmail so the user is immediately active.
     */
    private String registerUser(String localPart, String password) {
        String email = localPart + "@example.com";
        Map<String, String> req = Map.of("email", email, "password", password);
        ResponseEntity<Map> resp = restTemplate.postForEntity(authBase + "/register", req, Map.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return email;
    }

    @Test
    void fullPasswordResetFlow_shouldAllowLoginWithNewPassword() {
        // Step 1: Register a user (auto-verified via @example.com domain)
        String email = registerUser("pw-reset-full", "OldPassword1!");

        // Step 2: Request a password reset token
        ResponseEntity<Map> resetResp = restTemplate.postForEntity(
                authBase + "/password-reset-request",
                Map.of("email", email),
                Map.class
        );
        assertThat(resetResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resetResp.getBody()).containsKey("resetToken");
        String resetToken = (String) resetResp.getBody().get("resetToken");
        assertThat(resetToken).isNotBlank();

        // Step 3: Confirm password reset with the token
        ResponseEntity<Map> confirmResp = restTemplate.postForEntity(
                authBase + "/password-reset-confirm",
                Map.of("token", resetToken, "newPassword", "NewPassword2!"),
                Map.class
        );
        assertThat(confirmResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Step 4: Login with new password must succeed
        ResponseEntity<Map> loginNew = restTemplate.postForEntity(
                authBase + "/login",
                Map.of("email", email, "password", "NewPassword2!"),
                Map.class
        );
        assertThat(loginNew.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginNew.getBody()).containsKey("token");

        // Step 5: Login with OLD password must be rejected
        ResponseEntity<Map> loginOld = restTemplate.postForEntity(
                authBase + "/login",
                Map.of("email", email, "password", "OldPassword1!"),
                Map.class
        );
        assertThat(loginOld.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void passwordResetRequest_withUnknownEmail_shouldReturn404() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                authBase + "/password-reset-request",
                Map.of("email", "nobody@example.com"),
                Map.class
        );
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void passwordResetConfirm_withInvalidToken_shouldReturn400() {
        // No token was ever issued — confirm must fail
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                authBase + "/password-reset-confirm",
                Map.of("token", "totally-bogus-token-xyz", "newPassword", "NewPass1!"),
                Map.class
        );
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void passwordResetRequest_whenActiveTokenAlreadyExists_shouldReturn400() {
        // Register a user and request a first reset token
        String email = registerUser("pw-dup-token", "Password1!");
        restTemplate.postForEntity(
                authBase + "/password-reset-request",
                Map.of("email", email),
                Map.class
        );

        // Second request before the first token expires must return 400
        ResponseEntity<Map> secondResp = restTemplate.postForEntity(
                authBase + "/password-reset-request",
                Map.of("email", email),
                Map.class
        );
        assertThat(secondResp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void passwordResetConfirm_withExpiredToken_shouldReturn400() {
        // Register user and request a reset token
        String email = registerUser("pw-expired-tok", "Password1!");
        ResponseEntity<Map> resetResp = restTemplate.postForEntity(
                authBase + "/password-reset-request",
                Map.of("email", email),
                Map.class
        );
        assertThat(resetResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        String rawToken = (String) resetResp.getBody().get("resetToken");

        // Artificially expire the token by backdating EXPIRES_AT in the database
        jdbcTemplate.execute(
                "UPDATE PASSWORD_RESET_TOKENS SET EXPIRES_AT = SYSTIMESTAMP - INTERVAL '1' HOUR WHERE USED_AT IS NULL"
        );

        // Confirm with the (now-expired) token — must be rejected
        ResponseEntity<Map> confirmResp = restTemplate.postForEntity(
                authBase + "/password-reset-confirm",
                Map.of("token", rawToken, "newPassword", "NewPass1!"),
                Map.class
        );
        assertThat(confirmResp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void login_whilePendingResetTokenExists_shouldReturn403() {
        // Register a user (auto-verified)
        String email = registerUser("pw-reset-block", "Password1!");

        // Request a password reset — creates an active (unused, unexpired) PRT
        ResponseEntity<Map> resetResp = restTemplate.postForEntity(
                authBase + "/password-reset-request",
                Map.of("email", email),
                Map.class
        );
        assertThat(resetResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Login attempt while reset token is pending must be blocked with 403
        ResponseEntity<Map> loginResp = restTemplate.postForEntity(
                authBase + "/login",
                Map.of("email", email, "password", "Password1!"),
                Map.class
        );
        assertThat(loginResp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
