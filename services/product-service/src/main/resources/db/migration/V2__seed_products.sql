-- V2__seed_products.sql
-- Idempotent seed for product-service (Postgres)
-- Inserts 10 grocery products, inventory, and stock movements

SET search_path TO product_svc, public;

-- Products (sku unique) — upsert so repeated runs reconcile seeded values
INSERT INTO products (sku, name, description, attributes, price_cents, currency, is_active)
VALUES
  ('APPLE001', 'Red Apple', 'Fresh red apples, single', '{"category":"fruit","unit":"each"}'::jsonb, 100, 'USD', true),
  ('BANANA001', 'Banana', 'Ripe yellow bananas, per bunch', '{"category":"fruit","unit":"bunch"}'::jsonb, 150, 'USD', true),
  ('MILK001', 'Whole Milk 1L', '1 litre whole milk', '{"category":"dairy","unit":"l"}'::jsonb, 249, 'USD', true),
  ('BREAD001', 'Sourdough Loaf', 'Fresh sourdough bread loaf', '{"category":"bakery","unit":"each"}'::jsonb, 399, 'USD', true),
  ('EGGS001', 'Eggs (12)', 'Free-range eggs, dozen', '{"category":"dairy","unit":"dozen"}'::jsonb, 299, 'USD', true),
  ('CHEESE001', 'Cheddar 200g', 'Mature cheddar cheese 200g', '{"category":"dairy","unit":"pack"}'::jsonb, 499, 'USD', true),
  ('ORANGE001', 'Orange', 'Juicy oranges, single', '{"category":"fruit","unit":"each"}'::jsonb, 120, 'USD', true),
  ('CEREAL001', 'Oats Cereal 500g', 'Wholegrain oats cereal', '{"category":"grocery","unit":"pack"}'::jsonb, 599, 'USD', true),
  ('YOGURT001', 'Greek Yogurt 150g', 'Plain Greek yogurt 150g', '{"category":"dairy","unit":"cup"}'::jsonb, 199, 'USD', true),
  ('BUTTER001', 'Salted Butter 250g', 'Creamy salted butter 250g', '{"category":"dairy","unit":"pack"}'::jsonb, 349, 'USD', true)
ON CONFLICT (sku) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      attributes = EXCLUDED.attributes,
      price_cents = EXCLUDED.price_cents,
      currency = EXCLUDED.currency,
      is_active = EXCLUDED.is_active,
      updated_at = CURRENT_TIMESTAMP;

-- Initial inventory for products (id resolved by sku). Includes location and reserved.
INSERT INTO product_inventory (product_id, location, quantity, reserved)
SELECT p.id, q.location, q.qty, q.reserved FROM (VALUES
  ('APPLE001', 'warehouse-A', 200, 0),
  ('BANANA001', 'warehouse-A', 150, 0),
  ('MILK001', 'cold-storage', 120, 0),
  ('BREAD001', 'bakery', 80, 0),
  ('EGGS001', 'cold-storage', 140, 0),
  ('CHEESE001', 'cold-storage', 60, 0),
  ('ORANGE001', 'warehouse-A', 180, 0),
  ('CEREAL001', 'warehouse-B', 70, 0),
  ('YOGURT001', 'cold-storage', 200, 0),
  ('BUTTER001', 'cold-storage', 90, 0)
) AS q(sku, location, qty, reserved)
JOIN products p ON p.sku = q.sku
ON CONFLICT (product_id) DO UPDATE
  SET quantity = EXCLUDED.quantity,
      reserved = EXCLUDED.reserved,
      location = EXCLUDED.location,
      updated_at = CURRENT_TIMESTAMP;

-- Stock movements (for API stock calculation)
-- The API uses stock_movements.change_qty to calculate available stock
-- This creates initial stock movements matching the inventory quantities
INSERT INTO stock_movements (product_id, change_qty, reason, context, created_at)
SELECT 
  p.id, 
  pi.quantity, 
  'Initial seed stock', 
  jsonb_build_object('location', pi.location, 'seed_date', CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP
FROM product_inventory pi
JOIN products p ON p.id = pi.product_id
WHERE NOT EXISTS (
  SELECT 1 FROM stock_movements sm 
  WHERE sm.product_id = p.id 
    AND sm.reason = 'Initial seed stock'
);
