package org.kunlecreates.testutils;

import org.flywaydb.core.Flyway;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import javax.sql.DataSource;

@TestConfiguration
public class TestContainersConfig {

    /**
     * Shared Flyway migration strategy for tests. This loads shared migrations
     * from `classpath:db/shared-migration` first, then service migrations from
     * `classpath:db/migration`.
     */
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(DataSource dataSource) {
        return flyway -> {
            // Wait for the DataSource/DB to be ready before running Flyway migrations.
            // This avoids transient failures where the container is up but the DB
            // isn't fully initialized and Flyway reports unexpected/unsupported
            // metadata during startup.
            int maxAttempts = 120; // total wait ~120 seconds
            int attempt = 0;
            boolean ready = false;
            while (attempt < maxAttempts) {
                attempt++;
                try (var conn = dataSource.getConnection()) {
                    // Simple validation query
                    try (var stmt = conn.createStatement()) {
                        stmt.executeQuery("SELECT 1");
                    }
                    ready = true;
                    break;
                } catch (Exception ex) {
                    try {
                        Thread.sleep(1000L);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }

            if (!ready) {
                // If DB never became ready, let Flyway try once to produce a clearer failure.
                // This will fail fast in CI and provide diagnostics.
                Flyway custom = Flyway.configure()
                        .dataSource(dataSource)
                        .locations("classpath:db/shared-migration", "classpath:db/migration")
                        .load();
                try {
                    custom.repair();
                } catch (Exception ignored) {
                }
                custom.migrate();
                return;
            }

            // Log DB metadata for diagnostics before running Flyway
            try {
                try (var conn = dataSource.getConnection()) {
                    var meta = conn.getMetaData();
                    System.out.println("[TestContainersConfig] DB Product: " + meta.getDatabaseProductName());
                    System.out.println("[TestContainersConfig] DB Product Version: " + meta.getDatabaseProductVersion());
                    System.out.println("[TestContainersConfig] Driver Name: " + meta.getDriverName());
                    System.out.println("[TestContainersConfig] Driver Version: " + meta.getDriverVersion());
                }
            } catch (Exception ex) {
                System.out.println("[TestContainersConfig] Failed to read DB metadata: " + ex.getMessage());
            }

            Flyway custom = Flyway.configure()
                    .dataSource(dataSource)
                    .locations("classpath:db/shared-migration", "classpath:db/migration")
                    .load();
            try {
                custom.repair();
            } catch (Exception ignored) {
            }
            try {
                custom.migrate();
            } catch (org.flywaydb.core.api.FlywayException fe) {
                // Re-throw with additional context so CI logs are clearer
                throw new RuntimeException("Flyway migration failed (after DB readiness wait): " + fe.getMessage(), fe);
            }
        };
    }
}
