-- V3__align_stock_movements_with_v1_schema.sql
-- Align stock_movements table columns with V1__init.sql schema
-- Current: product_id, change_qty, created_at, bigint id
-- Target: productid, quantity, occurredat, uuid id

SET search_path TO product_svc, public;

-- Step 1: Add new uuid column
ALTER TABLE stock_movements ADD COLUMN new_id uuid DEFAULT gen_random_uuid();

-- Step 2: Rename columns to match V1 schema
ALTER TABLE stock_movements RENAME COLUMN product_id TO productid;
ALTER TABLE stock_movements RENAME COLUMN change_qty TO quantity;
ALTER TABLE stock_movements RENAME COLUMN created_at TO occurredat;

-- Step 3: Drop old primary key constraint
ALTER TABLE stock_movements DROP CONSTRAINT stock_movements_pkey;

-- Step 4: Set new_id as primary key
ALTER TABLE stock_movements ALTER COLUMN new_id SET NOT NULL;
ALTER TABLE stock_movements ADD PRIMARY KEY (new_id);

-- Step 5: Drop old id column and rename new_id to id
ALTER TABLE stock_movements DROP COLUMN id;
ALTER TABLE stock_movements RENAME COLUMN new_id TO id;

-- Migration complete: stock_movements now matches V1 schema
