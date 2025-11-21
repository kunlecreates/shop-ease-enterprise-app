package org.kunlecreates.order;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.context.annotation.Import;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import java.time.Duration;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.kunlecreates.order.application.OrderService;
import org.kunlecreates.order.domain.Order;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import org.kunlecreates.testutils.TestContainersConfig;
import org.kunlecreates.testutils.FlywayTestInitializer;

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
            // Reduce Postgres memory usage to avoid OOM in CI runners.
            // These settings lower shared buffers and work_mem so the DB
            // can start within the limited RAM provided by GitHub Actions.
            .withCommand("postgres", "-c", "fsync=off", "-c", "shared_buffers=32MB", "-c", "work_mem=4MB");
            // Wait for the Postgres server message that indicates readiness.
            // This makes the test more robust in CI where startup can vary.
            static {
                postgres.waitingFor(
                        Wait.forLogMessage(".*database system is ready to accept connections.*\\n", 1)
                                .withStartupTimeout(Duration.ofSeconds(120))
                );
            }

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
            registry.add("spring.datasource.driverClassName", () -> "org.postgresql.Driver");
                // Flyway is disabled for automatic startup in tests. We run migrations
                // programmatically via the `FlywayTestInitializer` before the Spring
                // context finishes initializing to ensure DB schema is applied.
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
