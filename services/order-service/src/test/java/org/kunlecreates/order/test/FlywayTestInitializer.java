package org.kunlecreates.order.test;

import org.flywaydb.core.Flyway;
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
            applicationContext.getEnvironment().getPropertySources();
        }
    }

    private static void runMigrations(DataSource dataSource) {
        // Apply only test-only shared migrations during fast Testcontainers runs.
        // Production migrations under src/main/resources/db/migration must not
        // be applied in these fast runs to avoid dialect conflicts and duplicate
        // version collisions. Full migration validation should run in a
        // separate Oracle-based job.
        Flyway.configure()
            .dataSource(dataSource)
            .locations("classpath:db/test-migration")
            .load()
            .migrate();
    }
}
