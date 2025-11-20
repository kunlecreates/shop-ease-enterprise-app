package org.kunlecreates.order.test;

import org.flywaydb.core.Flyway;
import javax.sql.DataSource;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;

@TestConfiguration
public class TestContainersConfig {

    /**
     * Ensure Flyway runs during test context startup. Because test resources include
     * `V0__users.sql` (test-only user migrations) and main resources contain
     * order-service migrations, Flyway will apply them in version order (V0 then V1...).
     */
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(DataSource dataSource) {
        return flyway -> {
            // Build a Flyway instance that includes shared test migrations first,
            // then the service-specific migrations. This ensures the centralized
            // `db/shared-migration` is applied before `db/migration`.
            Flyway custom = Flyway.configure()
                    .dataSource(dataSource)
                    .locations("classpath:db/shared-migration", "classpath:db/migration")
                    .load();
            try {
                custom.repair();
            } catch (Exception ignored) {
            }
            custom.migrate();
        };
    }
}
