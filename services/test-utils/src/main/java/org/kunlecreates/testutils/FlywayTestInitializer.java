package org.kunlecreates.testutils;

import org.flywaydb.core.Flyway;
import org.springframework.context.ApplicationContextException;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.context.ApplicationContextInitializer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.io.File;
import java.io.IOException;
import java.net.JarURLConnection;
import java.net.URL;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

/**
 * ApplicationContextInitializer used by tests to run Flyway migrations
 * programmatically before the Spring ApplicationContext completes refresh.
 *
 * This reads JDBC props from the test Environment (which includes values
 * registered via @DynamicPropertySource) and runs Flyway migrations from the
 * shared and service locations. It also waits for the database to accept
 * connections for a configurable timeout.
 */
public class FlywayTestInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    // Use stdout for simple test-time diagnostics to avoid extra logging deps

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment env = applicationContext.getEnvironment();

        String url = env.getProperty("spring.datasource.url");
        String user = env.getProperty("spring.datasource.username");
        String pass = env.getProperty("spring.datasource.password");

        if (url == null || user == null) {
            System.out.println("FlywayTestInitializer: datasource properties not available yet, skipping programmatic migration");
            return;
        }

        System.out.println("FlywayTestInitializer: running programmatic Flyway migrations against " + url);

        // Wait for DB to accept connections
        final int maxAttempts = 120;
        int attempt = 0;
        boolean ready = false;
        while (attempt < maxAttempts) {
            attempt++;
            try (Connection ignored = DriverManager.getConnection(url, user, pass)) {
                ready = true;
                break;
            } catch (Exception e) {
                try {
                    Thread.sleep(1000L);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                            throw new ApplicationContextException("Interrupted waiting for test DB readiness", ie);
                }
            }
        }

        if (!ready) {
            throw new ApplicationContextException("Timed out waiting for test database to become ready: " + url);
        }

        try {
            // Strip any JDBC query parameters (Testcontainers appends params like loggerLevel=OFF)
            // so Flyway can correctly detect the database type from the JDBC URL.
            String flywayUrl = url;
            int q = url.indexOf('?');
            if (q > 0) {
                flywayUrl = url.substring(0, q);
                System.out.println("FlywayTestInitializer: stripped JDBC query params, using " + flywayUrl);
            }

            // Create a simple DataSource wrapper that uses DriverManager to obtain
            // connections. Passing a DataSource avoids Flyway's URL-based database
            // type detection failure in some classloader/testcontainer environments.
            javax.sql.DataSource ds = new javax.sql.DataSource() {
                @Override
                public java.sql.Connection getConnection() throws java.sql.SQLException {
                    return DriverManager.getConnection(url, user, pass);
                }

                @Override
                public java.sql.Connection getConnection(String username, String password) throws java.sql.SQLException {
                    return DriverManager.getConnection(url, username, password);
                }

                @Override
                public <T> T unwrap(Class<T> iface) throws java.sql.SQLException { throw new java.sql.SQLException("Not a wrapper"); }

                @Override
                public boolean isWrapperFor(Class<?> iface) throws java.sql.SQLException { return false; }

                @Override
                public java.io.PrintWriter getLogWriter() throws java.sql.SQLException { return null; }

                @Override
                public void setLogWriter(java.io.PrintWriter out) throws java.sql.SQLException { }

                @Override
                public void setLoginTimeout(int seconds) throws java.sql.SQLException { }

                @Override
                public int getLoginTimeout() throws java.sql.SQLException { return 0; }

                @Override
                public java.util.logging.Logger getParentLogger() { return java.util.logging.Logger.getLogger("global"); }
            };

            try {
                Flyway.configure()
                        .dataSource(ds)
                        .locations("classpath:db/shared-migration", "classpath:db/migration")
                        .load()
                        .migrate();
                System.out.println("FlywayTestInitializer: migrations applied successfully");
            } catch (Exception flywayEx) {
                // If Flyway cannot detect or support the database in this environment,
                // fall back to executing SQL scripts manually using Spring's ScriptUtils.
                System.err.println("FlywayTestInitializer: Flyway failed: " + flywayEx.getMessage());
                System.err.println("FlywayTestInitializer: falling back to manual script execution");
                try (Connection conn = DriverManager.getConnection(url, user, pass)) {
                    executeSqlScriptsFallback(conn, "db/shared-migration");
                    executeSqlScriptsFallback(conn, "db/migration");
                }
                System.out.println("FlywayTestInitializer: manual migrations applied successfully");
            }
        } catch (Exception ex) {
            System.err.println("FlywayTestInitializer: migration failed: " + ex.getMessage());
            throw new ApplicationContextException("Flyway migrations failed in test initializer", ex);
        }
    }

    private void executeSqlScriptsFallback(Connection conn, String classpathDir) throws Exception {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath*:" + classpathDir + "/*.sql");
        if (resources == null || resources.length == 0) {
            return;
        }

        // Sort by filename to ensure version order (V*__...)
        List<Resource> resourceList = new ArrayList<>();
        Collections.addAll(resourceList, resources);
        resourceList.sort((a, b) -> {
            String an = a.getFilename() == null ? "" : a.getFilename();
            String bn = b.getFilename() == null ? "" : b.getFilename();
            return an.compareTo(bn);
        });

        for (Resource r : resourceList) {
            String resourcePath = classpathDir + "/" + (r.getFilename() == null ? r.toString() : r.getFilename());
            System.out.println("FlywayTestInitializer: executing script fallback " + resourcePath);
            ScriptUtils.executeSqlScript(conn, new EncodedResource(r, "UTF-8"));
        }
    }

    private String[] listResourceFiles(String path) throws IOException {
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        URL url = cl.getResource(path);
        if (url == null) return new String[0];
        String protocol = url.getProtocol();
        if ("file".equals(protocol)) {
            try {
                File folder = new File(url.getPath());
                String[] list = folder.list((dir, name) -> name != null && name.endsWith(".sql"));
                return list == null ? new String[0] : list;
            } catch (Exception e) {
                return new String[0];
            }
        } else if ("jar".equals(protocol)) {
            String urlPath = url.getPath();
            int bang = urlPath.indexOf('!');
            String jarPath = urlPath.substring(5, bang); // strip "file:"
            jarPath = URLDecoder.decode(jarPath, "UTF-8");
            try (JarFile jar = new JarFile(jarPath)) {
                Enumeration<JarEntry> entries = jar.entries();
                List<String> results = new ArrayList<>();
                while (entries.hasMoreElements()) {
                    JarEntry entry = entries.nextElement();
                    String name = entry.getName();
                    if (name.startsWith(path + "/") && !entry.isDirectory() && name.endsWith(".sql")) {
                        results.add(name.substring(path.length() + 1));
                    }
                }
                return results.toArray(new String[0]);
            }
        }
        return new String[0];
    }
}
