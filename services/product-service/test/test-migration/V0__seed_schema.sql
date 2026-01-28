-- Test-only seed: create product_svc schema and core tables for integration tests
-- This file is applied only in test environments by global-setup.js

CREATE SCHEMA IF NOT EXISTS product_svc AUTHORIZATION postgres;
SET search_path TO product_svc, public;

-- Helper: generic trigger function to maintain updated_at columns
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Categories ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_svc.categories (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(64) UNIQUE,
  name VARCHAR(200) NOT NULL UNIQUE,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_categories_updated') THEN
    CREATE TRIGGER trg_categories_updated
    BEFORE UPDATE ON product_svc.categories
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Products -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_svc.products (
  id BIGSERIAL PRIMARY KEY,
  sku VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  attributes JSONB NULL,
  price_cents BIGINT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_products_price CHECK (price_cents >= 0),
  search_vector TSVECTOR
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated') THEN
    CREATE TRIGGER trg_products_updated
    BEFORE UPDATE ON product_svc.products
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Full-text search trigger
CREATE OR REPLACE FUNCTION products_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.name,'') || ' ' || coalesce(NEW.description,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_search_vector') THEN
    CREATE TRIGGER trg_products_search_vector
    BEFORE INSERT OR UPDATE ON product_svc.products
    FOR EACH ROW
    EXECUTE PROCEDURE products_search_vector_trigger();
  END IF;
END$$;

-- Product-Category many-to-many -------------------------------------------
CREATE TABLE IF NOT EXISTS product_svc.product_categories (
  product_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  PRIMARY KEY (product_id, category_id),
  CONSTRAINT fk_pc_product FOREIGN KEY (product_id) REFERENCES product_svc.products(id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_category FOREIGN KEY (category_id) REFERENCES product_svc.categories(id) ON DELETE CASCADE
);

-- Inventory ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_svc.product_inventory (
  product_id BIGINT PRIMARY KEY,
  location TEXT,
  quantity BIGINT NOT NULL DEFAULT 0,
  reserved BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pi_product FOREIGN KEY (product_id) REFERENCES product_svc.products(id) ON DELETE CASCADE,
  CONSTRAINT chk_inventory_qty CHECK (quantity >= 0)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_product_inventory_updated') THEN
    CREATE TRIGGER trg_product_inventory_updated
    BEFORE UPDATE ON product_svc.product_inventory
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Stock movement audit (increments/decrements) ----------------------------
CREATE TABLE IF NOT EXISTS product_svc.stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL,
  change_qty INT NOT NULL,
  reason VARCHAR(64) NOT NULL,
  context JSONB NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sm_product FOREIGN KEY (product_id) REFERENCES product_svc.products(id) ON DELETE CASCADE
);

-- Indexes ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS ix_products_active ON product_svc.products(is_active);
CREATE INDEX IF NOT EXISTS ix_products_price ON product_svc.products(price_cents);
CREATE INDEX IF NOT EXISTS gin_products_search ON product_svc.products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_products_name ON product_svc.products USING btree (lower(name));
CREATE INDEX IF NOT EXISTS idx_products_sku ON product_svc.products USING btree (sku);
CREATE INDEX IF NOT EXISTS idx_categories_code ON product_svc.categories USING btree (code);
