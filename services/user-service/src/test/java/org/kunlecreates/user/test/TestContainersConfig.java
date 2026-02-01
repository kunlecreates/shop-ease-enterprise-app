package org.kunlecreates.user.test;

import org.flywaydb.core.Flyway;
import javax.sql.DataSource;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;

@TestConfiguration
public class TestContainersConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(DataSource dataSource) {
        return flyway -> {
            // Use ONLY test-specific migration directory
            String testLocation = "classpath:db/test-migration";
            Flyway shared = Flyway.configure()
                .dataSource(dataSource)
                .locations(testLocation)
                .load();
            try { shared.repair(); } catch (Exception ignored) {}
            shared.migrate();
        };
    }
}
