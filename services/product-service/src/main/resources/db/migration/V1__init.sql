-- V1__init.sql
-- Flyway baseline for product-service (UUID-based schema matching TypeORM entities)
-- Creates pgcrypto extension, product/category/stock tables, inventory, audit timestamps, and search index

-- Create product_svc schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS product_svc;

-- Set search path to product_svc schema
SET search_path TO product_svc, public;

-- Extension required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku varchar(64) NOT NULL UNIQUE,
  name varchar(200) NOT NULL,
  description text,
  price_cents bigint NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  is_active boolean NOT NULL DEFAULT true,
  attributes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  search_vector tsvector
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(64) NOT NULL UNIQUE,
  name varchar(200) NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Join table for many-to-many products <-> categories
CREATE TABLE IF NOT EXISTS product_categories (
  productsid uuid NOT NULL,
  categoriesid uuid NOT NULL,
  PRIMARY KEY (productsid, categoriesid)
);

ALTER TABLE IF EXISTS product_categories
  ADD CONSTRAINT fk_product_categories_products FOREIGN KEY (productsid)
    REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS product_categories
  ADD CONSTRAINT fk_product_categories_categories FOREIGN KEY (categoriesid)
    REFERENCES categories(id) ON DELETE CASCADE;

-- Inventory table to track stock per product (separate from movements)
CREATE TABLE IF NOT EXISTS product_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  productid uuid NOT NULL,
  location text,
  quantity bigint NOT NULL DEFAULT 0,
  reserved bigint NOT NULL DEFAULT 0,
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventory_product FOREIGN KEY (productid) REFERENCES products(id) ON DELETE CASCADE
);

-- Stock movements (audit log)
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  productid uuid NOT NULL,
  quantity integer NOT NULL,
  reason varchar(64) NOT NULL,
  context JSONB NULL,
  occurredat timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS stock_movements
  ADD CONSTRAINT fk_stock_movements_product FOREIGN KEY (productid)
    REFERENCES products(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING btree (lower(name));
CREATE INDEX IF NOT EXISTS idx_products_sku ON products USING btree (sku);
CREATE INDEX IF NOT EXISTS idx_products_price_cents ON products USING btree (price_cents);
CREATE INDEX IF NOT EXISTS idx_categories_code ON categories USING btree (code);

-- Full-text search index
UPDATE products SET search_vector = to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''));
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin (search_vector);

-- Triggers to maintain updated_at and search_vector
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION products_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.name,'') || ' ' || coalesce(NEW.description,''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_categories_updated_at
BEFORE INSERT OR UPDATE ON categories
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_products_search_vector
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE products_search_vector_trigger();

CREATE TRIGGER trg_inventory_updated_at
BEFORE INSERT OR UPDATE ON product_inventory
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
