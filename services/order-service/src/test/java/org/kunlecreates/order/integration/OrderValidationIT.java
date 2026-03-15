package org.kunlecreates.order.integration;

import org.junit.jupiter.api.AfterEach;
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
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for Order creation validation, line-item persistence,
 * and authentication enforcement against a real MSSQL Testcontainer.
 *
 * Covers:
 * - Unauthenticated request rejected with 401
 * - Expired JWT rejected with 401
 * - Negative total rejected with 400 (service-layer guard)
 * - Zero total accepted (boundary: inclusive at 0)
 * - Missing/blank status rejected with 400 (service-layer guard)
 * - Order with line items persists items to order_items table
 * - User isolation: list orders returns only the caller's orders
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
public class OrderValidationIT {

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
    void setUp() {
        cleanup();
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        try {
            jdbcTemplate.execute("DELETE FROM order_svc.order_items");
            jdbcTemplate.execute("DELETE FROM order_svc.orders");
        } catch (Exception e) {
            System.err.println("Cleanup warning: " + e.getMessage());
        }
    }

    private HttpHeaders authHeaders(String userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + JwtTestHelper.createToken(userId));
        return headers;
    }

    private Map<String, Object> validOrderRequest(double total) {
        return Map.of(
                "status", "PENDING",
                "total", total,
                "shippingAddress", Map.of(
                        "recipient", "Validation Test User",
                        "street1", "123 Verified St",
                        "city", "Toronto",
                        "state", "ON",
                        "postalCode", "M5H 2N2",
                        "country", "Canada",
                        "phone", "+1-416-555-0199"
                ),
                "paymentMethod", Map.of(
                        "type", "CREDIT_CARD",
                        "last4", "4242",
                        "brand", "Visa"
                )
        );
    }

    @Test
    void createOrder_withoutAuthentication_shouldReturn401() {
        // Unauthenticated requests must be rejected before reaching business logic
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/order",
                validOrderRequest(50.0),
                Map.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void createOrder_withExpiredJwtToken_shouldReturn401() {
        // Requests bearing an expired JWT must be rejected by the security filter
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + JwtTestHelper.createExpiredToken("exp-user"));
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/order",
                new HttpEntity<>(validOrderRequest(50.0), headers),
                Map.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void createOrder_withNegativeTotal_shouldReturn400() {
        // Service-layer guard in OrderService.createOrder() rejects negative totals
        Map<String, Object> req = Map.of(
                "status", "PENDING",
                "total", -1.0,
                "shippingAddress", Map.of(
                        "recipient", "Test User",
                        "street1", "123 Test St",
                        "city", "Toronto",
                        "state", "ON",
                        "postalCode", "M5H 2N2",
                        "country", "Canada"
                ),
                "paymentMethod", Map.of("type", "CREDIT_CARD", "last4", "0002", "brand", "Visa")
        );
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/order",
                new HttpEntity<>(req, authHeaders("val-user-3")),
                Map.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void createOrder_withZeroTotal_shouldPersistSuccessfully() {
        // Zero total is the inclusive lower boundary — must be accepted
        ResponseEntity<Void> response = restTemplate.postForEntity(
                "/api/order",
                new HttpEntity<>(validOrderRequest(0.0), authHeaders("val-user-4")),
                Void.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).isNotNull();
    }

    @Test
    void createOrder_withMissingStatus_shouldReturn400() {
        // Service-layer guard in OrderService.createOrder() rejects null/blank status
        Map<String, Object> req = Map.of(
                "total", 99.0,
                "shippingAddress", Map.of(
                        "recipient", "Test User",
                        "street1", "456 Main St",
                        "city", "Ottawa",
                        "state", "ON",
                        "postalCode", "K1A 0A9",
                        "country", "Canada"
                ),
                "paymentMethod", Map.of("type", "CREDIT_CARD", "last4", "0003", "brand", "Amex")
        );
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/order",
                new HttpEntity<>(req, authHeaders("val-user-5")),
                Map.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void createOrder_withLineItems_shouldPersistItemsToDatabase() {
        // Verify that line items submitted with an order are written to order_items
        Map<String, Object> req = Map.of(
                "status", "PENDING",
                "total", 150.0,
                "items", List.of(
                        Map.of("productRef", "SKU-VAL-001", "productName", "Test Product A",
                               "quantity", 2, "unitPrice", 50.0),
                        Map.of("productRef", "SKU-VAL-002", "productName", "Test Product B",
                               "quantity", 1, "unitPrice", 50.0)
                ),
                "shippingAddress", Map.of(
                        "recipient", "Items Test User",
                        "street1", "789 Items Ave",
                        "city", "Vancouver",
                        "state", "BC",
                        "postalCode", "V6B 2N9",
                        "country", "Canada",
                        "phone", "+1-604-555-0299"
                ),
                "paymentMethod", Map.of("type", "DEBIT_CARD", "last4", "1234", "brand", "Mastercard")
        );

        ResponseEntity<Void> createResp = restTemplate.postForEntity(
                "/api/order",
                new HttpEntity<>(req, authHeaders("val-user-6")),
                Void.class
        );
        assertThat(createResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Parse the new order ID from the Location header
        String location = createResp.getHeaders().getLocation().toString();
        long orderId = Long.parseLong(location.substring(location.lastIndexOf('/') + 1));

        // Verify both items were persisted
        Integer itemCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM order_svc.order_items WHERE order_id = ?",
                Integer.class,
                orderId
        );
        assertThat(itemCount).isEqualTo(2);

        // Verify product references are stored correctly
        List<String> productRefs = jdbcTemplate.queryForList(
                "SELECT product_ref FROM order_svc.order_items WHERE order_id = ? ORDER BY product_ref",
                String.class,
                orderId
        );
        assertThat(productRefs).containsExactlyInAnyOrder("SKU-VAL-001", "SKU-VAL-002");
    }

    @Test
    void createOrder_thenListOrders_shouldOnlyReturnOwnOrders() {
        // User isolation: each user must only see their own orders in the list endpoint
        String userA = "isolation-user-A";
        String userB = "isolation-user-B";

        // Create one order each for userA and userB
        restTemplate.postForEntity(
                "/api/order",
                new HttpEntity<>(validOrderRequest(10.0), authHeaders(userA)),
                Void.class
        );
        restTemplate.postForEntity(
                "/api/order",
                new HttpEntity<>(validOrderRequest(20.0), authHeaders(userB)),
                Void.class
        );

        // userA fetches their order list — must only see their own order
        ResponseEntity<List> listResponse = restTemplate.exchange(
                "/api/order",
                HttpMethod.GET,
                new HttpEntity<>(authHeaders(userA)),
                List.class
        );
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listResponse.getBody()).hasSize(1);
        @SuppressWarnings("unchecked")
        Map<String, Object> order = (Map<String, Object>) listResponse.getBody().get(0);
        assertThat(order.get("userRef")).isEqualTo(userA);
    }
}
