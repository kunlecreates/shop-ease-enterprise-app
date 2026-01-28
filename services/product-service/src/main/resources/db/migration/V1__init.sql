-- V1__init.sql
-- Flyway baseline for product-service (BIGSERIAL ids, canonical schema)

-- Create product_svc schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS product_svc AUTHORIZATION postgres;

-- Recommended: explicit schema
SET search_path TO product_svc, public;

-- ---- ID sequences (BIGSERIAL safety) -----------------------------

ALTER SEQUENCE IF EXISTS product_svc.categories_id_seq OWNED BY product_svc.categories.id;
ALTER SEQUENCE IF EXISTS product_svc.products_id_seq OWNED BY product_svc.products.id;
ALTER SEQUENCE IF EXISTS product_svc.stock_movements_id_seq OWNED BY product_svc.stock_movements.id;

-- ---- Defaults (safe if already present) ---------------------------

ALTER TABLE product_svc.categories
  ALTER COLUMN is_active SET DEFAULT TRUE,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE product_svc.products
  ALTER COLUMN currency SET DEFAULT 'USD',
  ALTER COLUMN is_active SET DEFAULT TRUE,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE product_svc.product_inventory
  ALTER COLUMN quantity SET DEFAULT 0,
  ALTER COLUMN reserved SET DEFAULT 0,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE product_svc.stock_movements
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- ---- Constraints (only add if missing) ----------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_price'
  ) THEN
    ALTER TABLE product_svc.products
      ADD CONSTRAINT chk_products_price CHECK (price_cents >= 0);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_inventory_qty'
  ) THEN
    ALTER TABLE product_svc.product_inventory
      ADD CONSTRAINT chk_inventory_qty CHECK (quantity >= 0);
  END IF;
END$$;

-- ---- Triggers (idempotent) ----------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_categories_updated'
  ) THEN
    CREATE TRIGGER trg_categories_updated
    BEFORE UPDATE ON product_svc.categories
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated'
  ) THEN
    CREATE TRIGGER trg_products_updated
    BEFORE UPDATE ON product_svc.products
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- ---- Full-text search ---------------------------------------------

CREATE OR REPLACE FUNCTION products_search_vector_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english',
      coalesce(NEW.name,'') || ' ' || coalesce(NEW.description,'')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_search_vector'
  ) THEN
    CREATE TRIGGER trg_products_search_vector
    BEFORE INSERT OR UPDATE ON product_svc.products
    FOR EACH ROW
    EXECUTE FUNCTION products_search_vector_trigger();
  END IF;
END$$;

-- ---- Indexes ------------------------------------------------------

CREATE INDEX IF NOT EXISTS ix_products_active ON product_svc.products(is_active);
CREATE INDEX IF NOT EXISTS ix_products_price ON product_svc.products(price_cents);
CREATE INDEX IF NOT EXISTS gin_products_search ON product_svc.products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_products_name ON product_svc.products USING btree (lower(name));
CREATE INDEX IF NOT EXISTS idx_products_sku ON product_svc.products USING btree (sku);
CREATE INDEX IF NOT EXISTS idx_categories_code ON product_svc.categories USING btree (code);
