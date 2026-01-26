package org.kunlecreates.order.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.kunlecreates.order.test.JwtTestHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
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
@ActiveProfiles("test")
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
            jdbcTemplate.execute("DELETE FROM order_svc.orders");
        } catch (Exception e) {
            // Table might not exist yet, ignore
        }
    }

    @Test
    void createOrder_shouldPersistToDatabase_andReturnLocation() {
        // Given: Valid order creation request with JWT authentication
        String token = JwtTestHelper.createToken("test-user-1");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        
        Map<String, Object> orderRequest = Map.of(
                "status", "PENDING",
                "total", 99.99
        );
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(orderRequest, headers);

        // When: Create order via REST API
        ResponseEntity<Void> response = restTemplate.postForEntity(
                "/api/order",
                entity,
                Void.class
        );

        // Then: Should return 201 Created with Location header
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).isNotNull();

        // And: Order should exist in database
        String location = response.getHeaders().getLocation().toString();
        String orderId = location.substring(location.lastIndexOf('/') + 1);
        
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM order_svc.orders WHERE id = ?",
                Integer.class,
                Long.parseLong(orderId)
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    void createOrder_shouldUseAuthenticatedUserId() {
        // Given: Order creation request with JWT
        String token = JwtTestHelper.createToken("test-user-2");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        
        Map<String, Object> orderRequest = Map.of(
                "status", "PENDING",
                "total", 49.99
        );
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(orderRequest, headers);

        // When: Create order
        ResponseEntity<Void> createResponse = restTemplate.postForEntity(
                "/api/order",
                entity,
                Void.class
        );

        // Then: Should succeed
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // And: Order should be created with authenticated user ID
        String location = createResponse.getHeaders().getLocation().toString();
        String orderId = location.substring(location.lastIndexOf('/') + 1);

        // Fetch order and verify user_ref matches authenticated user
        HttpEntity<Void> getEntity = new HttpEntity<>(headers);
        ResponseEntity<Map> getResponse = restTemplate.exchange(
                "/api/order/" + orderId,
                HttpMethod.GET,
                getEntity,
                Map.class
        );
        
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody()).isNotNull();
        assertThat(getResponse.getBody().get("userRef")).isEqualTo("test-user-2");
    }

    @Test
    void getOrder_withValidId_shouldReturnOrder() {
        // Given: Order exists in database
        String token = JwtTestHelper.createToken("test-user-3");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        
        Map<String, Object> orderRequest = Map.of(
                "status", "PENDING",
                "total", 79.99
        );
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(orderRequest, headers);

        ResponseEntity<Void> createResponse = restTemplate.postForEntity(
                "/api/order",
                entity,
                Void.class
        );

        String location = createResponse.getHeaders().getLocation().toString();
        String orderId = location.substring(location.lastIndexOf('/') + 1);

        // When: Get order by ID
        HttpEntity<Void> getEntity = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/order/" + orderId,
                HttpMethod.GET,
                getEntity,
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
    void getOrder_withInvalidId_shouldReturn404() {
        // Given: Valid JWT token
        String token = JwtTestHelper.createToken("test-user-4");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        
        // When: Get non-existent order
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/order/99999",
                HttpMethod.GET,
                entity,
                Map.class
        );

        // Then: Should return 404 Not Found
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getOrder_belongingToAnotherUser_shouldReturn403() {
        // Given: Order created by user-b
        String tokenUserB = JwtTestHelper.createToken("user-b");
        HttpHeaders headersUserB = new HttpHeaders();
        headersUserB.set("Authorization", "Bearer " + tokenUserB);
        
        Map<String, Object> orderRequest = Map.of(
                "status", "PENDING",
                "total", 59.99
        );
        HttpEntity<Map<String, Object>> createEntity = new HttpEntity<>(orderRequest, headersUserB);

        // Create order as user-b
        ResponseEntity<Void> createResponse = restTemplate.postForEntity(
                "/api/order",
                createEntity,
                Void.class
        );

        String location = createResponse.getHeaders().getLocation().toString();
        String orderId = location.substring(location.lastIndexOf('/') + 1);

        // When: user-a tries to access user-b's order
        String tokenUserA = JwtTestHelper.createToken("user-a");
        HttpHeaders headersUserA = new HttpHeaders();
        headersUserA.set("Authorization", "Bearer " + tokenUserA);
        HttpEntity<Void> getEntity = new HttpEntity<>(headersUserA);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/order/" + orderId,
                HttpMethod.GET,
                getEntity,
                Map.class
        );

        // Then: Should return 403 Forbidden
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void getOrder_asAdmin_shouldAccessAnyOrder() {
        // Given: Order created by regular user
        String regularUserToken = JwtTestHelper.createToken("regular-user");
        HttpHeaders regularUserHeaders = new HttpHeaders();
        regularUserHeaders.set("Authorization", "Bearer " + regularUserToken);
        
        Map<String, Object> orderRequest = Map.of(
                "status", "PENDING",
                "total", 129.99
        );
        HttpEntity<Map<String, Object>> createEntity = new HttpEntity<>(orderRequest, regularUserHeaders);

        ResponseEntity<Void> createResponse = restTemplate.postForEntity(
                "/api/order",
                createEntity,
                Void.class
        );
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(createResponse.getHeaders().getLocation()).isNotNull();

        String location = createResponse.getHeaders().getLocation().toString();
        String orderId = location.substring(location.lastIndexOf('/') + 1);

        // When: Admin accesses the order
        String adminToken = JwtTestHelper.createToken("admin-user", "admin@example.com", java.util.List.of("ADMIN"));
        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.set("Authorization", "Bearer " + adminToken);
        HttpEntity<Void> getEntity = new HttpEntity<>(adminHeaders);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/order/" + orderId,
                HttpMethod.GET,
                getEntity,
                Map.class
        );

        // Then: Admin should be able to access
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void listOrders_shouldReturnOnlyUserOrders() {
        // Given: Multiple orders for different users
        String tokenUser5 = JwtTestHelper.createToken("test-user-5");
        HttpHeaders headersUser5 = new HttpHeaders();
        headersUser5.set("Authorization", "Bearer " + tokenUser5);
        
        Map<String, Object> orderRequest1 = Map.of("status", "PENDING", "total", 10.00);
        Map<String, Object> orderRequest2 = Map.of("status", "DELIVERED", "total", 20.00);

        // Create orders as test-user-5
        ResponseEntity<Void> createResponse1 = restTemplate.postForEntity("/api/order", new HttpEntity<>(orderRequest1, headersUser5), Void.class);
        assertThat(createResponse1.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        
        ResponseEntity<Void> createResponse2 = restTemplate.postForEntity("/api/order", new HttpEntity<>(orderRequest2, headersUser5), Void.class);
        assertThat(createResponse2.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Create order as different user
        String tokenOther = JwtTestHelper.createToken("other-user");
        HttpHeaders headersOther = new HttpHeaders();
        headersOther.set("Authorization", "Bearer " + tokenOther);
        ResponseEntity<Void> createResponse3 = restTemplate.postForEntity("/api/order", new HttpEntity<>(Map.of("status", "PENDING", "total", 30.00), headersOther), Void.class);
        assertThat(createResponse3.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // When: List orders as test-user-5
        HttpEntity<Void> getEntity = new HttpEntity<>(headersUser5);
        ResponseEntity<Object[]> response = restTemplate.exchange(
                "/api/order",
                HttpMethod.GET,
                getEntity,
                Object[].class
        );

        // Then: Should only see own orders (2 orders)
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(2);
    }

    @Test
    void listOrders_asAdmin_shouldReturnAllOrders() {
        // Given: Orders from multiple users
        String tokenUser1 = JwtTestHelper.createToken("user-1");
        HttpHeaders headersUser1 = new HttpHeaders();
        headersUser1.set("Authorization", "Bearer " + tokenUser1);
        
        String tokenUser2 = JwtTestHelper.createToken("user-2");
        HttpHeaders headersUser2 = new HttpHeaders();
        headersUser2.set("Authorization", "Bearer " + tokenUser2);

        ResponseEntity<Void> createResponse1 = restTemplate.postForEntity("/api/order", new HttpEntity<>(Map.of("status", "PENDING", "total", 15.00), headersUser1), Void.class);
        assertThat(createResponse1.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        
        ResponseEntity<Void> createResponse2 = restTemplate.postForEntity("/api/order", new HttpEntity<>(Map.of("status", "DELIVERED", "total", 25.00), headersUser2), Void.class);
        assertThat(createResponse2.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // When: Admin lists orders
        String adminToken = JwtTestHelper.createToken("admin-user-2", "admin2@example.com", java.util.List.of("ADMIN"));
        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.set("Authorization", "Bearer " + adminToken);
        HttpEntity<Void> getEntity = new HttpEntity<>(adminHeaders);
        
        ResponseEntity<Object[]> response = restTemplate.exchange(
                "/api/order",
                HttpMethod.GET,
                getEntity,
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
