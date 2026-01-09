package org.kunlecreates.order.test;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

import javax.sql.DataSource;

public final class FlywayTestInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        try {
            if (applicationContext.containsBean("dataSource")) {
                Object ds = applicationContext.getBean("dataSource");
                if (ds instanceof DataSource) {
                    runMigrations((DataSource) ds);
                }
            }
        } catch (Exception e) {
            LoggerFactory.getLogger(FlywayTestInitializer.class).debug("FlywayTestInitializer initialization skipped: {}", e.getMessage());
        }
    }

    private static void runMigrations(DataSource dataSource) {
        Logger log = LoggerFactory.getLogger(FlywayTestInitializer.class);
        log.info("Applying test Flyway migrations from classpath:db/test-migration");
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            .locations("classpath:db/test-migration")
            .load();
        try {
            flyway.migrate();
        } catch (Exception e) {
            log.warn("Test Flyway migration failed: {}", e.getMessage());
        }
    }
}
