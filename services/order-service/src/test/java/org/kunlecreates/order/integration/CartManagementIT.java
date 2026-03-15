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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
class CartManagementIT {

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
        cleanup();
    }

    @AfterEach
    void cleanupAfterTest() {
        cleanup();
    }

    private void cleanup() {
        try {
            jdbcTemplate.execute("DELETE FROM order_svc.cart_items");
            jdbcTemplate.execute("DELETE FROM order_svc.carts");
            jdbcTemplate.execute("DELETE FROM order_svc.order_items");
            jdbcTemplate.execute("DELETE FROM order_svc.orders");
        } catch (Exception ignored) {
        }
    }

    private HttpHeaders authHeaders(String userId) {
        String token = JwtTestHelper.createToken(userId);
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        return headers;
    }

    @Test
    void activeCart_shouldBeCreatedAndReturnedForAuthenticatedUser() {
        HttpEntity<Void> entity = new HttpEntity<>(authHeaders("cart-user-1"));

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/cart/active",
                HttpMethod.GET,
                entity,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("userRef")).isEqualTo("cart-user-1");
        assertThat(response.getBody()).containsKey("id");
    }

    @Test
    void addItem_thenGetCart_shouldPersistItemToDatabase() {
        HttpHeaders headers = authHeaders("cart-user-2");

        ResponseEntity<Map> createCart = restTemplate.exchange(
                "/api/cart",
                HttpMethod.POST,
                new HttpEntity<>(Map.of(), headers),
                Map.class
        );
        assertThat(createCart.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Number cartIdNum = (Number) createCart.getBody().get("id");
        long cartId = cartIdNum.longValue();

        Map<String, Object> addItemPayload = Map.of(
                "productRef", "SKU-INT-001",
                "quantity", 2,
                "unitPriceCents", 1500
        );

        ResponseEntity<Void> addItem = restTemplate.exchange(
                "/api/cart/" + cartId + "/items",
                HttpMethod.POST,
                new HttpEntity<>(addItemPayload, headers),
                Void.class
        );

        assertThat(addItem.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<Map> getCart = restTemplate.exchange(
                "/api/cart/" + cartId,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        assertThat(getCart.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getCart.getBody()).isNotNull();
        assertThat(getCart.getBody().get("totalCents")).isEqualTo(3000);

        List<Map<String, Object>> items = (List<Map<String, Object>>) getCart.getBody().get("items");
        assertThat(items).hasSize(1);
        assertThat(items.getFirst().get("productRef")).isEqualTo("SKU-INT-001");
        assertThat(items.getFirst().get("quantity")).isEqualTo(2);
    }

    @Test
    void getCart_shouldReturnForbiddenForDifferentUser() {
        HttpHeaders ownerHeaders = authHeaders("cart-owner");
        ResponseEntity<Map> createCart = restTemplate.exchange(
                "/api/cart",
                HttpMethod.POST,
                new HttpEntity<>(Map.of(), ownerHeaders),
                Map.class
        );
        Number cartIdNum = (Number) createCart.getBody().get("id");
        long cartId = cartIdNum.longValue();

        HttpHeaders otherHeaders = authHeaders("other-user");
        ResponseEntity<Map> getAsOther = restTemplate.exchange(
                "/api/cart/" + cartId,
                HttpMethod.GET,
                new HttpEntity<>(otherHeaders),
                Map.class
        );

        assertThat(getAsOther.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}