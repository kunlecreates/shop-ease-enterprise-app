-- Minimal test-only migration: create order_svc schema and orders table
-- This mirrors the production shape sufficiently for fast Testcontainers runs
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'order_svc')
BEGIN
  EXEC('CREATE SCHEMA order_svc');
END
GO

IF OBJECT_ID('order_svc.orders', 'U') IS NULL
BEGIN
  CREATE TABLE order_svc.orders (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_ref NVARCHAR(64) NOT NULL,
    status NVARCHAR(32) NOT NULL,
    total_cents BIGINT NOT NULL,
    currency NVARCHAR(3) NOT NULL DEFAULT 'USD',
    placed_at DATETIME2(6) NULL,
    created_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME()
  );
  ALTER TABLE order_svc.orders ADD CONSTRAINT chk_orders_status CHECK (status IN ('PENDING','PAID','SHIPPED','DELIVERED','CANCELLED','REFUNDED'));
END
GO

