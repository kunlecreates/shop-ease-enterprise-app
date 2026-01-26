-- order-service test schema (Microsoft SQL Server)
-- Complete schema for integration tests

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'order_svc')
BEGIN
  EXEC('CREATE SCHEMA order_svc');
END
GO

-- Carts --------------------------------------------------------------------
IF OBJECT_ID('order_svc.carts', 'U') IS NULL
BEGIN
  CREATE TABLE order_svc.carts (
    id             BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_ref       NVARCHAR(64) NOT NULL,
    status         NVARCHAR(32) NOT NULL CONSTRAINT chk_carts_status CHECK (status IN ('OPEN','CHECKED_OUT','ABANDONED')),
    created_at     DATETIME2(6) NOT NULL CONSTRAINT df_carts_created DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2(6) NOT NULL CONSTRAINT df_carts_updated DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX ix_carts_user_ref ON order_svc.carts(user_ref);
END
GO

-- Cart items ----------------------------------------------------------------
IF OBJECT_ID('order_svc.cart_items', 'U') IS NULL
BEGIN
  CREATE TABLE order_svc.cart_items (
    id                 BIGINT IDENTITY(1,1) PRIMARY KEY,
    cart_id            BIGINT NOT NULL,
    product_ref        NVARCHAR(64) NOT NULL,
    quantity           INT NOT NULL CONSTRAINT chk_ci_qty CHECK (quantity > 0),
    unit_price_cents   BIGINT NOT NULL CONSTRAINT chk_ci_price CHECK (unit_price_cents >= 0),
    currency           NCHAR(3) NOT NULL CONSTRAINT df_ci_currency DEFAULT N'USD',
    created_at         DATETIME2(6) NOT NULL CONSTRAINT df_ci_created DEFAULT SYSUTCDATETIME(),
    updated_at         DATETIME2(6) NOT NULL CONSTRAINT df_ci_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_ci_cart FOREIGN KEY (cart_id) REFERENCES order_svc.carts(id)
  );
END
GO

-- Orders -------------------------------------------------------------------
IF OBJECT_ID('order_svc.orders', 'U') IS NULL
BEGIN
  CREATE TABLE order_svc.orders (
    id             BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_ref       NVARCHAR(64) NOT NULL,
    status         NVARCHAR(32) NOT NULL CONSTRAINT chk_orders_status CHECK (status IN ('PENDING','PAID','SHIPPED','DELIVERED','CANCELLED','REFUNDED')),
    total_cents    BIGINT NOT NULL CONSTRAINT chk_orders_total CHECK (total_cents >= 0),
    currency       NCHAR(3) NOT NULL CONSTRAINT df_orders_currency DEFAULT N'USD',
    placed_at      DATETIME2(6) NULL,
    created_at     DATETIME2(6) NOT NULL CONSTRAINT df_orders_created DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2(6) NOT NULL CONSTRAINT df_orders_updated DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX ix_orders_user_ref ON order_svc.orders(user_ref);
END
GO

-- Order items ---------------------------------------------------------------
IF OBJECT_ID('order_svc.order_items', 'U') IS NULL
BEGIN
  CREATE TABLE order_svc.order_items (
    id                 BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_id           BIGINT NOT NULL,
    product_ref        NVARCHAR(64) NOT NULL,
    quantity           INT NOT NULL CONSTRAINT chk_oi_qty CHECK (quantity > 0),
    unit_price_cents   BIGINT NOT NULL CONSTRAINT chk_oi_price CHECK (unit_price_cents >= 0),
    currency           NCHAR(3) NOT NULL CONSTRAINT df_oi_currency DEFAULT N'USD',
    created_at         DATETIME2(6) NOT NULL CONSTRAINT df_oi_created DEFAULT SYSUTCDATETIME(),
    updated_at         DATETIME2(6) NOT NULL CONSTRAINT df_oi_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES order_svc.orders(id)
  );
END
GO

-- Payments -----------------------------------------------------------------
IF OBJECT_ID('order_svc.payments', 'U') IS NULL
BEGIN
  CREATE TABLE order_svc.payments (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_id        BIGINT NOT NULL,
    provider        NVARCHAR(32) NOT NULL,
    status          NVARCHAR(32) NOT NULL CONSTRAINT chk_pay_status CHECK (status IN ('PENDING','AUTHORIZED','CAPTURED','FAILED','REFUNDED','CANCELLED')),
    amount_cents    BIGINT NOT NULL CONSTRAINT chk_pay_amount CHECK (amount_cents >= 0),
    currency        NCHAR(3) NOT NULL CONSTRAINT df_pay_currency DEFAULT N'USD',
    external_ref    NVARCHAR(128) NULL,
    created_at      DATETIME2(6) NOT NULL CONSTRAINT df_pay_created DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2(6) NOT NULL CONSTRAINT df_pay_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES order_svc.orders(id)
  );
  CREATE INDEX ix_payments_order_id ON order_svc.payments(order_id);
END
GO

-- Payment transactions ------------------------------------------------------
IF OBJECT_ID('order_svc.payment_transactions', 'U') IS NULL
BEGIN
  CREATE TABLE order_svc.payment_transactions (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    payment_id      BIGINT NOT NULL,
    type            NVARCHAR(32) NOT NULL,
    status          NVARCHAR(32) NOT NULL,
    amount_cents    BIGINT NOT NULL CONSTRAINT chk_pt_amount CHECK (amount_cents >= 0),
    raw             NVARCHAR(MAX) NULL,
    created_at      DATETIME2(6) NOT NULL CONSTRAINT df_pt_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_pt_payment FOREIGN KEY (payment_id) REFERENCES order_svc.payments(id)
  );
  CREATE INDEX ix_payment_tx_payment_id ON order_svc.payment_transactions(payment_id);
END
GO

-- Order events (outbox style) ----------------------------------------------
IF OBJECT_ID('order_svc.order_events', 'U') IS NULL
BEGIN
  CREATE TABLE order_svc.order_events (
    id           BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_id     BIGINT NOT NULL,
    type         NVARCHAR(64) NOT NULL,
    payload      NVARCHAR(MAX) NULL,
    created_at   DATETIME2(6) NOT NULL CONSTRAINT df_oe_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_oe_order FOREIGN KEY (order_id) REFERENCES order_svc.orders(id)
  );
  CREATE INDEX ix_order_events_order_id ON order_svc.order_events(order_id);
END
GO
