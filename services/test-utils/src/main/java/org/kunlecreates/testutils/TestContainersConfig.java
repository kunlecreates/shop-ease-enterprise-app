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
