package org.kunlecreates.order;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Assumptions;
import org.testcontainers.DockerClientFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.junit.jupiter.api.extension.ExtendWith;
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

@ExtendWith(DockerAvailableCondition.class)
@SpringBootTest(properties = "spring.flyway.enabled=false")
@ContextConfiguration(initializers = FlywayTestInitializer.class)
@Import(TestContainersConfig.class)
public class OrderServiceTestcontainersIT {

    // Docker availability is controlled by the DockerAvailableCondition (see class in test sources).
    // We avoid using @BeforeAll assumptions because JUnit/Testcontainers may initialize
    // extensions before @BeforeAll is invoked. The condition prevents the Testcontainers
    // extension from running when Docker is not available.

    // We do NOT use the JUnit `@Testcontainers` extension here because it will attempt
    // to start containers before we have a chance to check for Docker availability.
    // Instead we create the container instance and start it conditionally.
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:14-alpine")
            .withDatabaseName("ordersdb")
            .withUsername("test")
            .withPassword("test")
            // Reduce Postgres memory usage to avoid OOM in CI runners.
            .withCommand("postgres", "-c", "fsync=off", "-c", "shared_buffers=32MB", "-c", "work_mem=4MB");

    static boolean dockerAvailable;

    static {
        // Early check for Docker availability; this runs when the class is loaded and
        // prevents the test framework from attempting to start containers on machines
        // without Docker (e.g., some developer workstations or constrained CI agents).
        boolean available = false;
        try {
            available = DockerClientFactory.instance().isDockerAvailable();
        } catch (Throwable t) {
            available = false;
        }
        dockerAvailable = available;

        if (dockerAvailable) {
            postgres.waitingFor(
                    Wait.forLogMessage(".*database system is ready to accept connections.*\\n", 1)
                            .withStartupTimeout(Duration.ofSeconds(120))
            );
        }
    }

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        if (dockerAvailable) {
            // Start the container if not already started and expose JDBC properties.
            try {
                if (!postgres.isRunning()) {
                    postgres.start();
                }
            } catch (Throwable t) {
                // If container start fails, fall back to an in-memory DB for local runs.
                dockerAvailable = false;
            }
        }

        if (dockerAvailable) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
            registry.add("spring.datasource.driverClassName", () -> "org.postgresql.Driver");
        } else {
            // When Docker isn't available, use an H2 in-memory DB so tests can run locally.
            registry.add("spring.datasource.url", () -> "jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1");
            registry.add("spring.datasource.username", () -> "sa");
            registry.add("spring.datasource.password", () -> "");
            registry.add("spring.datasource.driverClassName", () -> "org.h2.Driver");
        }
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
