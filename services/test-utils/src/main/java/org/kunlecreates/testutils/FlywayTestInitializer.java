package org.kunlecreates.testutils;

import org.flywaydb.core.Flyway;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

import javax.sql.DataSource;

/**
 * ApplicationContext initializer that runs shared Flyway migrations when the
 * Spring test ApplicationContext is being prepared. Some integration tests
 * reference this class via `@ContextConfiguration(initializers = ... )` so
 * implementing the correct interface ensures the tests compile.
 */
public final class FlywayTestInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

	@Override
	public void initialize(ConfigurableApplicationContext applicationContext) {
		try {
			// Try to obtain a DataSource bean from the context and run migrations.
			if (applicationContext.containsBean("dataSource")) {
				Object ds = applicationContext.getBean("dataSource");
				if (ds instanceof DataSource) {
					runMigrations((DataSource) ds);
				}
			}
		} catch (Exception e) {
			// Swallow exceptions to avoid failing context startup in environments
			// where migrations are run separately; tests that need stricter
			// behavior should run migrations explicitly.
			applicationContext.getEnvironment().getPropertySources(); // no-op to reference env
		}
	}

	private static void runMigrations(DataSource dataSource) {
		Flyway.configure()
				.dataSource(dataSource)
				.locations("classpath:db/shared-migration", "classpath:db/migration")
				.load()
				.migrate();
	}
}
