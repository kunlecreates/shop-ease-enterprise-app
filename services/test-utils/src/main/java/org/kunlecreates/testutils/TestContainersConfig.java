package org.kunlecreates.testutils;

import org.flywaydb.core.Flyway;
import javax.sql.DataSource;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;

@TestConfiguration
public class TestContainersConfig {

    /**
     * Provide a FlywayMigrationStrategy bean so consuming modules can import
     * `org.kunlecreates.testutils.TestContainersConfig` in their tests and
     * have shared-test migrations applied before service migrations.
     */
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(DataSource dataSource) {
        return flyway -> {
            // Apply shared, test-only migrations first using a separate Flyway
            // instance. Then delegate to the auto-configured Flyway instance
            // passed in so the application's own migrations (classpath:db/migration)
            // run normally. This prevents Flyway from scanning the same
            // migration versions from multiple locations in one resolve pass.
            Flyway shared = Flyway.configure()
                    .dataSource(dataSource)
                    .locations("classpath:db/shared-migration")
                    .load();
            try {
                shared.repair();
            } catch (Exception ignored) {
            }
            shared.migrate();

            // Now run the application's Flyway (will use its configured locations)
            flyway.migrate();
        };
    }
}
