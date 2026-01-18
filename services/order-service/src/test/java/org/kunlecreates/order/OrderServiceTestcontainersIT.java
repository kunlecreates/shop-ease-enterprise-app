package org.kunlecreates.order;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.context.annotation.Import;
import org.testcontainers.containers.MSSQLServerContainer;
import java.sql.DriverManager;
import java.io.InputStream;
import java.time.Duration;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.kunlecreates.order.application.OrderService;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.test.TestContainersConfig;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest
@ActiveProfiles("test")
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
        // Use Testcontainers-provided JDBC URL (do not force a non-existent databaseName)
        registry.add("spring.datasource.url", mssql::getJdbcUrl);
        // Ensure Hibernate can determine the JDBC metadata early in startup
        registry.add("jakarta.persistence.jdbc.url", mssql::getJdbcUrl);
        // Explicitly set Hibernate dialect for SQL Server to avoid dialect-detection race
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.SQLServer2012Dialect");
        registry.add("spring.datasource.username", mssql::getUsername);
        registry.add("spring.datasource.password", mssql::getPassword);
        registry.add("spring.datasource.driverClassName", () -> "com.microsoft.sqlserver.jdbc.SQLServerDriver");
            // Let Flyway run automatically during Spring context startup.
            // TestContainersConfig provides a FlywayMigrationStrategy that triggers
            // migrations and test resources should contain only order-related
            // fixtures (classpath:db/test-migration) for fast Testcontainers runs.

        // Ensure test schema/table exist before Spring initializes JPA by executing
        // the test SQL directly against the container using a raw JDBC connection.
        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            try (java.sql.Connection c = DriverManager.getConnection(mssql.getJdbcUrl(), mssql.getUsername(), mssql.getPassword())) {
                InputStream in = OrderServiceTestcontainersIT.class.getClassLoader().getResourceAsStream("db/test-migration/V0__order_schema.sql");
                if (in != null) {
                    String sql = new String(in.readAllBytes());
                    String[] batches = sql.split("(?m)^[ \\t]*GO\\s*$");
                    try (java.sql.Statement stmt = c.createStatement()) {
                        for (String batch : batches) {
                            String trimmed = batch.trim();
                            if (trimmed.isEmpty()) continue;
                            stmt.execute(trimmed);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            // best-effort creation; if it fails we'll rely on Flyway during context startup
        }
    }

    @Autowired
    OrderService orderService;

    

    @Test
    void createAndFind_withMssql() {
        // Use a userRef string so order tests don't depend on a users fixture
        Order o = orderService.createOrder("it-user-ref-1", null, "PENDING", 42.00, null);
        assertThat(o.getId()).isNotNull();
        assertThat(orderService.findById(o.getId())).isPresent();
    }
}
