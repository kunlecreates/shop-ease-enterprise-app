package org.kunlecreates.order;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.context.annotation.Import;
import org.testcontainers.containers.PostgreSQLContainer;
import java.time.Duration;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.kunlecreates.order.application.OrderService;
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
@SpringBootTest(properties = "spring.flyway.enabled=false")
@ContextConfiguration(initializers = FlywayTestInitializer.class)
@Import(TestContainersConfig.class)
public class OrderServiceTestcontainersIT {

    @Container
        static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:14-alpine")
            .withDatabaseName("ordersdb")
            .withUsername("test")
            .withPassword("test")
            // increase container shared memory to reduce OOMs on constrained CI runners
            .withCreateContainerCmdModifier(cmd -> cmd.getHostConfig().withShmSize(268435456L))
            // give Postgres more time to initialize on busy CI runners
            .withStartupTimeout(Duration.ofMinutes(3));

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
            registry.add("spring.datasource.driverClassName", () -> "org.postgresql.Driver");
            // Let Flyway run automatically during Spring context startup.
            // TestContainersConfig provides a FlywayMigrationStrategy that triggers
            // migrations and test resources include `V0__users.sql` so user table
            // migrations are applied before order-service migrations.
    }

    @Autowired
    OrderService orderService;

    @Test
    void createAndFind_withPostgres() {
        Order o = orderService.createOrder(2L, "CREATED", 42.00);
        assertThat(o.getId()).isNotNull();
        assertThat(orderService.findById(o.getId())).isPresent();
    }
}
