package org.kunlecreates.user.test;

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
        Flyway.configure()
            .dataSource(dataSource)
            .locations("classpath:db/test-migration")
            .load()
            .migrate();
    }
}
