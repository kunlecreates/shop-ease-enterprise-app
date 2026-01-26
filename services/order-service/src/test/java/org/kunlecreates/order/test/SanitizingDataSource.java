package org.kunlecreates.order.test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

public final class SanitizingDataSource implements DataSource {
    private final DataSource delegate;

    public SanitizingDataSource(DataSource delegate) {
        this.delegate = delegate;
    }

    @Override
    public Connection getConnection() throws SQLException {
        Connection c = delegate.getConnection();
        // Could wrap connection to sanitize SQL logging in tests; noop for now
        return c;
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return delegate.getConnection(username, password);
    }

    @Override public <T> T unwrap(Class<T> iface) throws SQLException { return delegate.unwrap(iface); }
    @Override public boolean isWrapperFor(Class<?> iface) throws SQLException { return delegate.isWrapperFor(iface); }
    @Override public java.io.PrintWriter getLogWriter() throws SQLException { return delegate.getLogWriter(); }
    @Override public void setLogWriter(java.io.PrintWriter out) throws SQLException { delegate.setLogWriter(out); }
    @Override public void setLoginTimeout(int seconds) throws SQLException { delegate.setLoginTimeout(seconds); }
    @Override public int getLoginTimeout() throws SQLException { return delegate.getLoginTimeout(); }
    @Override public java.util.logging.Logger getParentLogger() { try { return delegate.getParentLogger(); } catch (Exception e) { return java.util.logging.Logger.getGlobal(); } }
}
