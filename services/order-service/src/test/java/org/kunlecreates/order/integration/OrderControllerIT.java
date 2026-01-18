package org.kunlecreates.order.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.kunlecreates.order.test.FlywayTestInitializer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test for OrderController REST API endpoints.
 * Tests full stack: Controller → Service → Repository → MSSQL Database (Testcontainers)
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ContextConfiguration(initializers = FlywayTestInitializer.class)
public class OrderControllerIT {

    @Container
    static MSSQLServerContainer<?> mssql = new MSSQLServerContainer<>(
            System.getProperty("testcontainers.mssql.image", "mcr.microsoft.com/mssql/server:2019-latest"))
            .withPassword(System.getProperty("testcontainers.mssql.sa.password", "YourStrong!Passw0rd"))
            .withCreateContainerCmdModifier(cmd -> cmd.getHostConfig().withShmSize(268435456L))
            .withStartupTimeout(Duration.ofMinutes(5));

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mssql::getJdbcUrl);
        registry.add("jakarta.persistence.jdbc.url", mssql::getJdbcUrl);
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.SQLServer2012Dialect");
        registry.add("spring.datasource.username", mssql::getUsername);
        registry.add("spring.datasource.password", mssql::getPassword);
        registry.add("spring.datasource.driverClassName", () -> "com.microsoft.sqlserver.jdbc.SQLServerDriver");
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanDatabase() {
        // Clean orders table before each test for isolation
        try {
            jdbcTemplate.execute("DELETE FROM orders");
        } catch (Exception e) {
            // Table might not exist yet, ignore
        }
    }

    @Test
    @WithMockUser(username = "test-user-1", roles = {"USER"})
    void createOrder_shouldPersistToDatabase_andReturnLocation() {
        // Given: Valid order creation request
        Map<String, Object> orderRequest = Map.of(
                "status", "PENDING",
                "total", 99.99
        );

        // When: Create order via REST API
        ResponseEntity<Void> response = restTemplate.postForEntity(
                "/api/order",
                orderRequest,
                Void.class
        );

        // Then: Should return 201 Created with Location header
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).isNotNull();

        // And: Order should exist in database
        String location = response.getHeaders().getLocation().toString();
        String orderId = location.substring(location.lastIndexOf('/') + 1);
        
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE id = ?",
                Integer.class,
                Long.parseLong(orderId)
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    @WithMockUser(username = "test-user-2", roles = {"USER"})
    void createOrder_shouldUseAuthenticatedUserId() {
        // Given: Order creation request
        Map<String, Object> orderRequest = Map.of(
                "status", "PENDING",
                "total", 49.99
        );

        // When: Create order
        ResponseEntity<Void> createResponse = restTemplate.postForEntity(
                "/api/order",
                orderRequest,
                Void.class
        );

        // Then: Should succeed
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // And: Order should be created with authenticated user ID
        String location = createResponse.getHeaders().getLocation().toString();
        String orderId = location.substring(location.lastIndexOf('/') + 1);

        // Fetch order and verify user_ref matches authenticated user
        ResponseEntity<Map> getResponse = restTemplate.getForEntity(
                "/api/order/" + orderId,
                Map.class
        );
        
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody()).isNotNull();
        assertThat(getResponse.getBody().get("userRef")).isEqualTo("test-user-2");
    }

    @Test
    @WithMockUser(username = "test-user-3", roles = {"USER"})
    void getOrder_withValidId_shouldReturnOrder() {
        // Given: Order exists in database
        Map<String, Object> orderRequest = Map.of(
                "status", "PENDING",
                "total", 79.99
        );

        ResponseEntity<Void> createResponse = restTemplate.postForEntity(
                "/api/order",
                orderRequest,
                Void.class
        );

        String location = createResponse.getHeaders().getLocation().toString();
        String orderId = location.substring(location.lastIndexOf('/') + 1);

        // When: Get order by ID
        ResponseEntity<Map> response = restTemplate.getForEntity(
                "/api/order/" + orderId,
                Map.class
        );

        // Then: Should return order details
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("id")).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("PENDING");
        assertThat(response.getBody().get("total")).isEqualTo(79.99);
    }

    @Test
    @WithMockUser(username = "test-user-4", roles = {"USER"})
    void getOrder_withInvalidId_shouldReturn404() {
        // When: Get non-existent order
        ResponseEntity<Map> response = restTemplate.getForEntity(
                "/api/order/99999",
                Map.class
        );

        // Then: Should return 404 Not Found
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @WithMockUser(username = "user-a", roles = {"USER"})
    void getOrder_belongingToAnotherUser_shouldReturn403() {
        // Given: Order created by user-b
        Map<String, Object> orderRequest = Map.of(
                "status", "PENDING",
                "total", 59.99
        );

        // Create order as user-b
        TestRestTemplate userBTemplate = restTemplate.withBasicAuth("user-b", "password");
        ResponseEntity<Void> createResponse = userBTemplate.postForEntity(
                "/api/order",
                orderRequest,
                Void.class
        );

        String location = createResponse.getHeaders().getLocation().toString();
        String orderId = location.substring(location.lastIndexOf('/') + 1);

        // When: user-a tries to access user-b's order
        ResponseEntity<Map> response = restTemplate.getForEntity(
                "/api/order/" + orderId,
                Map.class
        );

        // Then: Should return 403 Forbidden
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @WithMockUser(username = "admin-user", roles = {"ADMIN"})
    void getOrder_asAdmin_shouldAccessAnyOrder() {
        // Given: Order created by regular user
        Map<String, Object> orderRequest = Map.of(
                "status", "PENDING",
                "total", 129.99
        );

        TestRestTemplate regularUserTemplate = restTemplate.withBasicAuth("regular-user", "password");
        ResponseEntity<Void> createResponse = regularUserTemplate.postForEntity(
                "/api/order",
                orderRequest,
                Void.class
        );

        String location = createResponse.getHeaders().getLocation().toString();
        String orderId = location.substring(location.lastIndexOf('/') + 1);

        // When: Admin accesses the order
        ResponseEntity<Map> response = restTemplate.getForEntity(
                "/api/order/" + orderId,
                Map.class
        );

        // Then: Admin should be able to access
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @WithMockUser(username = "test-user-5", roles = {"USER"})
    void listOrders_shouldReturnOnlyUserOrders() {
        // Given: Multiple orders for different users
        Map<String, Object> orderRequest1 = Map.of("status", "PENDING", "total", 10.00);
        Map<String, Object> orderRequest2 = Map.of("status", "COMPLETED", "total", 20.00);

        // Create orders as test-user-5
        restTemplate.postForEntity("/api/order", orderRequest1, Void.class);
        restTemplate.postForEntity("/api/order", orderRequest2, Void.class);

        // Create order as different user
        TestRestTemplate otherUserTemplate = restTemplate.withBasicAuth("other-user", "password");
        otherUserTemplate.postForEntity("/api/order", Map.of("status", "PENDING", "total", 30.00), Void.class);

        // When: List orders as test-user-5
        ResponseEntity<Object[]> response = restTemplate.getForEntity(
                "/api/order",
                Object[].class
        );

        // Then: Should only see own orders (2 orders)
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(2);
    }

    @Test
    @WithMockUser(username = "admin-user-2", roles = {"ADMIN"})
    void listOrders_asAdmin_shouldReturnAllOrders() {
        // Given: Orders from multiple users
        TestRestTemplate user1Template = restTemplate.withBasicAuth("user-1", "password");
        TestRestTemplate user2Template = restTemplate.withBasicAuth("user-2", "password");

        user1Template.postForEntity("/api/order", Map.of("status", "PENDING", "total", 15.00), Void.class);
        user2Template.postForEntity("/api/order", Map.of("status", "COMPLETED", "total", 25.00), Void.class);

        // When: Admin lists orders
        ResponseEntity<Object[]> response = restTemplate.getForEntity(
                "/api/order",
                Object[].class
        );

        // Then: Should see all orders
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void createOrder_withoutAuthentication_shouldReturn401() {
        // Given: Order creation request without authentication
        TestRestTemplate unauthenticatedTemplate = new TestRestTemplate();
        Map<String, Object> orderRequest = Map.of(
                "status", "PENDING",
                "total", 39.99
        );

        // When: Try to create order without auth
        ResponseEntity<Void> response = unauthenticatedTemplate.postForEntity(
                restTemplate.getRootUri() + "/api/order",
                orderRequest,
                Void.class
        );

        // Then: Should return 401 Unauthorized
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
