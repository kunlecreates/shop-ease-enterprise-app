package org.kunlecreates.testutils;

import org.flywaydb.core.Flyway;

import javax.sql.DataSource;

/**
 * Small utility to allow tests to trigger Flyway migrations programmatically
 * if they need explicit control. Some test classes reference this helper;
 * providing a simple implementation resolves compilation failures in CI.
 */
public final class FlywayTestInitializer {

	private FlywayTestInitializer() {
		// utility class
	}

	public static void runMigrations(DataSource dataSource) {
		Flyway.configure()
				.dataSource(dataSource)
				.locations("classpath:db/shared-migration", "classpath:db/migration")
				.load()
				.migrate();
	}
}
