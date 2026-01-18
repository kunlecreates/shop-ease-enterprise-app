package org.kunlecreates.user.integration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.ContextConfiguration;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.kunlecreates.user.test.FlywayTestInitializer;

import java.util.Map;
import java.util.HashMap;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test for UserController REST API with real PostgreSQL database.
 * Tests full stack: Controller → Service → Repository → Database (Testcontainers).
 * 
 * Note: Using PostgreSQL for testing instead of Oracle for CI compatibility.
 * Testcontainers oracle-free requires Docker with specific Oracle licensing.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ContextConfiguration(initializers = FlywayTestInitializer.class)
public class UserControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:14-alpine")
            .withDatabaseName("usersdb_it")
            .withUsername("test")
            .withPassword("test")
            .withStartupTimeout(java.time.Duration.ofMinutes(3));

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String baseUrl;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port + "/api/user";
    }

    @Test
    void registerUser_shouldPersistToDatabase_andReturnToken() {
        // Arrange: Create registration request
        Map<String, String> registerRequest = new HashMap<>();
        registerRequest.put("email", "integration-test@example.com");
        registerRequest.put("password", "SecurePass123!");

        // Act: Register user
        ResponseEntity<Map> registerResponse = restTemplate.postForEntity(
                baseUrl + "/register",
                registerRequest,
                Map.class
        );

        // Assert: User created successfully
        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(registerResponse.getBody()).isNotNull();
        assertThat(registerResponse.getBody().get("token")).isNotNull();
        assertThat(registerResponse.getBody().get("email")).isEqualTo("integration-test@example.com");

        // Store token for next test
        String token = (String) registerResponse.getBody().get("token");
        assertThat(token).isNotEmpty();
    }

    @Test
    void registerUser_thenLogin_shouldReturnValidToken() {
        // Step 1: Register new user
        Map<String, String> registerRequest = new HashMap<>();
        registerRequest.put("email", "login-test@example.com");
        registerRequest.put("password", "SecurePass456!");

        ResponseEntity<Map> registerResponse = restTemplate.postForEntity(
                baseUrl + "/register",
                registerRequest,
                Map.class
        );
        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Step 2: Login with same credentials
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("email", "login-test@example.com");
        loginRequest.put("password", "SecurePass456!");

        ResponseEntity<Map> loginResponse = restTemplate.postForEntity(
                baseUrl + "/login",
                loginRequest,
                Map.class
        );

        // Assert: Login successful
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).isNotNull();
        assertThat(loginResponse.getBody().get("token")).isNotNull();
        assertThat(loginResponse.getBody().get("email")).isEqualTo("login-test@example.com");
    }

    @Test
    void loginWithInvalidCredentials_shouldReturn401() {
        // Arrange: Invalid login request
        Map<String, String> invalidLogin = new HashMap<>();
        invalidLogin.put("email", "nonexistent@example.com");
        invalidLogin.put("password", "wrongpassword");

        // Act: Attempt login
        ResponseEntity<Map> response = restTemplate.postForEntity(
                baseUrl + "/login",
                invalidLogin,
                Map.class
        );

        // Assert: Unauthorized
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void registerWithDuplicateEmail_shouldReturn409() {
        // Step 1: Register first user
        Map<String, String> firstUser = new HashMap<>();
        firstUser.put("email", "duplicate@example.com");
        firstUser.put("password", "Password123!");

        ResponseEntity<Map> firstResponse = restTemplate.postForEntity(
                baseUrl + "/register",
                firstUser,
                Map.class
        );
        assertThat(firstResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Step 2: Attempt to register with same email
        Map<String, String> duplicateUser = new HashMap<>();
        duplicateUser.put("email", "duplicate@example.com");
        duplicateUser.put("password", "DifferentPass456!");

        ResponseEntity<Map> duplicateResponse = restTemplate.postForEntity(
                baseUrl + "/register",
                duplicateUser,
                Map.class
        );

        // Assert: Conflict
        assertThat(duplicateResponse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void getProfile_withValidToken_shouldReturnUserDetails() {
        // Step 1: Register and get token
        Map<String, String> registerRequest = new HashMap<>();
        registerRequest.put("email", "profile-test@example.com");
        registerRequest.put("password", "ProfilePass789!");

        ResponseEntity<Map> registerResponse = restTemplate.postForEntity(
                baseUrl + "/register",
                registerRequest,
                Map.class
        );
        String token = (String) registerResponse.getBody().get("token");

        // Step 2: Get profile with token
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> profileResponse = restTemplate.exchange(
                baseUrl + "/profile",
                HttpMethod.GET,
                entity,
                Map.class
        );

        // Assert: Profile retrieved successfully
        assertThat(profileResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(profileResponse.getBody()).isNotNull();
        assertThat(profileResponse.getBody().get("email")).isEqualTo("profile-test@example.com");
    }

    @Test
    void getProfile_withoutToken_shouldReturn401() {
        // Act: Get profile without token
        ResponseEntity<Map> response = restTemplate.getForEntity(
                baseUrl + "/profile",
                Map.class
        );

        // Assert: Unauthorized
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
