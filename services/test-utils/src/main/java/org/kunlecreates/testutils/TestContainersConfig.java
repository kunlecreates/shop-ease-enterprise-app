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
