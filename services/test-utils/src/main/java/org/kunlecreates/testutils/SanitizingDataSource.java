package org.kunlecreates.testutils;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.lang.reflect.Proxy;
import java.lang.reflect.InvocationHandler;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.Objects;
import java.util.logging.Logger;

/**
 * Small DataSource wrapper that ensures connections return DatabaseMetaData
 * whose getDatabaseProductName() is normalized to a simple value (e.g. "PostgreSQL").
 */
public final class SanitizingDataSource implements DataSource {
    private final DataSource delegate;

    public SanitizingDataSource(DataSource delegate) {
        this.delegate = Objects.requireNonNull(delegate);
    }

    @Override
    public Connection getConnection() throws SQLException {
        Connection conn = delegate.getConnection();
        return createProxyConnection(conn);
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        Connection conn = delegate.getConnection(username, password);
        return createProxyConnection(conn);
    }

    private Connection createProxyConnection(Connection conn) {
        InvocationHandler handler = (proxy, method, args) -> {
            if ("getMetaData".equals(method.getName())) {
                DatabaseMetaData meta = (DatabaseMetaData) method.invoke(conn, args);
                InvocationHandler metaHandler = (m, mm, a) -> {
                    if ("getDatabaseProductName".equals(mm.getName())) {
                        String product = meta.getDatabaseProductName();
                        if (product != null && product.toLowerCase().startsWith("postgresql")) {
                            return "PostgreSQL";
                        }
                        return product;
                    }
                    if ("getDatabaseProductVersion".equals(mm.getName())) {
                        return meta.getDatabaseProductVersion();
                    }
                    return mm.invoke(meta, a);
                };
                return Proxy.newProxyInstance(
                        meta.getClass().getClassLoader(),
                        new Class[]{DatabaseMetaData.class},
                        metaHandler);
            }
            return method.invoke(conn, args);
        };
        return (Connection) Proxy.newProxyInstance(conn.getClass().getClassLoader(), new Class[]{Connection.class}, handler);
    }

    @Override
    public PrintWriter getLogWriter() throws SQLException {
        return delegate.getLogWriter();
    }

    @Override
    public void setLogWriter(PrintWriter out) throws SQLException {
        delegate.setLogWriter(out);
    }

    @Override
    public void setLoginTimeout(int seconds) throws SQLException {
        delegate.setLoginTimeout(seconds);
    }

    @Override
    public int getLoginTimeout() throws SQLException {
        return delegate.getLoginTimeout();
    }

    @Override
    public Logger getParentLogger() throws SQLFeatureNotSupportedException {
        return delegate.getParentLogger();
    }

    @Override
    public <T> T unwrap(Class<T> iface) throws SQLException {
        return delegate.unwrap(iface);
    }

    @Override
    public boolean isWrapperFor(Class<?> iface) throws SQLException {
        return delegate.isWrapperFor(iface);
    }
}
// We use dynamic proxies for DatabaseMetaData (created in createProxyConnection), so
// no concrete DatabaseMetaData implementation is required here.
