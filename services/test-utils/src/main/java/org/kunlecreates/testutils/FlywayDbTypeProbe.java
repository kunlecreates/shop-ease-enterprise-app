package org.kunlecreates.testutils;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.internal.database.DatabaseTypeRegister;
import org.flywaydb.core.api.configuration.Configuration;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

/**
 * Simple probe to ask Flyway how it classifies a Connection's database type
 * given different DatabaseMetaData.getDatabaseProductName()/Version values.
 */
public class FlywayDbTypeProbe {
    public static void main(String[] args) throws Exception {
        System.out.println("Flyway DB type probe starting...");

        // Use Flyway's configuration object (FluentConfiguration implements Configuration)
        Configuration cfg = (Configuration) Flyway.configure();

        probe(cfg, "PostgreSQL 14.20", "14.20");
        probe(cfg, "PostgreSQL", "14.20");
        probe(cfg, "Postgres", "14.20");
        probe(cfg, "PostgreSQL 14", "14");
    }

    private static void probe(Configuration cfg, String productName, String productVersion) {
        System.out.println("\n--- Testing product='" + productName + "' version='" + productVersion + "' ---");

        InvocationHandler metaHandler = new InvocationHandler() {
            @Override
            public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                String name = method.getName();
                // Handle common DatabaseMetaData accessors flexibly to avoid throwing
                // for less-common methods Flyway may call.
                Class<?> returnType = method.getReturnType();
                if (returnType == String.class) {
                    if (name.toLowerCase().contains("productname") || name.toLowerCase().contains("product_name")
                            || name.equals("getDatabaseProductName")) {
                        return productName;
                    }
                    if (name.toLowerCase().contains("productversion") || name.equals("getDatabaseProductVersion")) {
                        return productVersion;
                    }
                    if (name.equals("getDriverName")) {
                        return "Mock JDBC Driver";
                    }
                    if (name.equals("getDriverVersion")) {
                        return "0.0-mock";
                    }
                    return null;
                }
                if (returnType == int.class || returnType == Integer.TYPE) {
                    if (name.toLowerCase().contains("maj") || name.contains("Major")) {
                        try {
                            String s = productVersion == null ? "" : productVersion;
                            String[] parts = s.split("\\.");
                            return parts.length > 0 && parts[0].length() > 0 ? Integer.parseInt(parts[0]) : 0;
                        } catch (Exception e) {
                            return 0;
                        }
                    }
                    if (name.toLowerCase().contains("min") || name.contains("Minor")) {
                        try {
                            String s = productVersion == null ? "" : productVersion;
                            String[] parts = s.split("\\.");
                            return parts.length > 1 && parts[1].length() > 0 ? Integer.parseInt(parts[1]) : 0;
                        } catch (Exception e) {
                            return 0;
                        }
                    }
                    return 0;
                }
                if (returnType == boolean.class || returnType == Boolean.TYPE) {
                    return false;
                }
                if (returnType == void.class) {
                    return null;
                }
                return null;
            }
        };

        DatabaseMetaData metaProxy = (DatabaseMetaData) Proxy.newProxyInstance(
                FlywayDbTypeProbe.class.getClassLoader(),
                new Class[]{DatabaseMetaData.class},
                metaHandler
        );

        // Quick sanity check: call a few methods directly on the meta proxy
        try {
            System.out.println("[probe-check] getDatabaseProductName -> " + metaProxy.getDatabaseProductName());
            System.out.println("[probe-check] getDatabaseProductVersion -> " + metaProxy.getDatabaseProductVersion());
            System.out.println("[probe-check] getDatabaseMajorVersion -> " + metaProxy.getDatabaseMajorVersion());
        } catch (Throwable t) {
            System.out.println("[probe-check] direct call threw: " + t);
            t.printStackTrace(System.out);
        }

        InvocationHandler connHandler = new InvocationHandler() {
            @Override
            public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                String name = method.getName();
                if ("getMetaData".equals(name)) {
                    return metaProxy;
                }
                if ("close".equals(name)) {
                    return null;
                }
                if ("isClosed".equals(name)) {
                    return false;
                }
                throw new UnsupportedOperationException("Connection method not implemented in probe: " + name);
            }
        };

        Connection connProxy = (Connection) Proxy.newProxyInstance(
                FlywayDbTypeProbe.class.getClassLoader(),
                new Class[]{Connection.class},
                connHandler
        );

        try {
            Object dbType = DatabaseTypeRegister.getDatabaseTypeForConnection(connProxy, cfg);
            System.out.println("DatabaseTypeRegister returned: " + dbType);
        } catch (Throwable t) {
            System.out.println("DatabaseTypeRegister threw: " + t.getClass().getName() + ": " + t.getMessage());
            t.printStackTrace(System.out);
        }
    }
}
