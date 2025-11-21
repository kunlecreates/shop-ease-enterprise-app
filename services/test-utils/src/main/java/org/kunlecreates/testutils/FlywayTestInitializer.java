package org.kunlecreates.testutils;

import org.flywaydb.core.Flyway;
import org.springframework.context.ApplicationContextException;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.context.ApplicationContextInitializer;

import java.sql.Connection;
import java.sql.DriverManager;

/**
 * ApplicationContextInitializer used by tests to run Flyway migrations
 * programmatically before the Spring ApplicationContext completes refresh.
 *
 * This reads JDBC props from the test Environment (which includes values
 * registered via @DynamicPropertySource) and runs Flyway migrations from the
 * shared and service locations. It also waits for the database to accept
 * connections for a configurable timeout.
 */
public class FlywayTestInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    // Use stdout for simple test-time diagnostics to avoid extra logging deps

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment env = applicationContext.getEnvironment();

        String url = env.getProperty("spring.datasource.url");
        String user = env.getProperty("spring.datasource.username");
        String pass = env.getProperty("spring.datasource.password");

        if (url == null || user == null) {
            System.out.println("FlywayTestInitializer: datasource properties not available yet, skipping programmatic migration");
            return;
        }

        System.out.println("FlywayTestInitializer: running programmatic Flyway migrations against " + url);

        // Wait for DB to accept connections
        final int maxAttempts = 120;
        int attempt = 0;
        boolean ready = false;
        while (attempt < maxAttempts) {
            attempt++;
            try (Connection ignored = DriverManager.getConnection(url, user, pass)) {
                ready = true;
                break;
            } catch (Exception e) {
                try {
                    Thread.sleep(1000L);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                            throw new ApplicationContextException("Interrupted waiting for test DB readiness", ie);
                }
            }
        }

        if (!ready) {
            throw new ApplicationContextException("Timed out waiting for test database to become ready: " + url);
        }

        try {
            Flyway.configure()
                    .dataSource(url, user, pass)
                    .locations("classpath:db/shared-migration", "classpath:db/migration")
                    .load()
                    .migrate();
            System.out.println("FlywayTestInitializer: migrations applied successfully");
        } catch (Exception ex) {
            System.err.println("FlywayTestInitializer: migration failed: " + ex.getMessage());
            throw new ApplicationContextException("Flyway migrations failed in test initializer", ex);
        }
    }
}
