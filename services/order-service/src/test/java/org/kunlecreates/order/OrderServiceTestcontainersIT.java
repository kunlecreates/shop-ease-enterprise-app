package org.kunlecreates.order;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.context.annotation.Import;
import org.testcontainers.containers.MSSQLServerContainer;
import java.time.Duration;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.kunlecreates.order.application.OrderService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.kunlecreates.order.domain.Order;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import org.springframework.context.annotation.Import;
import org.kunlecreates.testutils.TestContainersConfig;
import org.kunlecreates.testutils.FlywayTestInitializer;
import org.springframework.test.context.ContextConfiguration;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest
@ContextConfiguration(initializers = FlywayTestInitializer.class)
@Import(TestContainersConfig.class)
public class OrderServiceTestcontainersIT {

    @Container
    static MSSQLServerContainer<?> mssql = new MSSQLServerContainer<>(System.getProperty("testcontainers.mssql.image", "mcr.microsoft.com/mssql/server:2019-latest"))
            .withPassword(System.getProperty("testcontainers.mssql.sa.password", "YourStrong!Passw0rd"))
            // increase container shared memory to reduce OOMs on constrained CI runners
            .withCreateContainerCmdModifier(cmd -> cmd.getHostConfig().withShmSize(268435456L))
            // give MSSQL more time to initialize on busy CI runners
            .withStartupTimeout(Duration.ofMinutes(5));

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mssql::getJdbcUrl);
        registry.add("spring.datasource.username", mssql::getUsername);
        registry.add("spring.datasource.password", mssql::getPassword);
        registry.add("spring.datasource.driverClassName", () -> "com.microsoft.sqlserver.jdbc.SQLServerDriver");
            // Let Flyway run automatically during Spring context startup.
            // TestContainersConfig provides a FlywayMigrationStrategy that triggers
            // migrations and test resources include `V0__users.sql` so user table
            // migrations are applied before order-service migrations.
    }

    @Autowired
    OrderService orderService;

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Test
    void createAndFind_withPostgres() {
        // Ensure a user exists for the order: insert a test user and use the generated id.
        jdbcTemplate.update("INSERT INTO users (email, password_hash) VALUES (?, ?)", "it-user@example.com", "test-hash");
        Long userId = jdbcTemplate.queryForObject("SELECT id FROM users WHERE email = ?", new Object[]{"it-user@example.com"}, Long.class);

        Order o = orderService.createOrder(null, userId, "CREATED", 42.00);
        assertThat(o.getId()).isNotNull();
        assertThat(orderService.findById(o.getId())).isPresent();
    }
}
