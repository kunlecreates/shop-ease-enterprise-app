-- V2__migrate_to_product_svc_schema.sql
-- Move tables from public schema to product_svc schema

-- Ensure product_svc schema exists
CREATE SCHEMA IF NOT EXISTS product_svc;

-- Move tables if they exist in public schema
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    ALTER TABLE public.products SET SCHEMA product_svc;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
    ALTER TABLE public.categories SET SCHEMA product_svc;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_categories') THEN
    ALTER TABLE public.product_categories SET SCHEMA product_svc;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_inventory') THEN
    ALTER TABLE public.product_inventory SET SCHEMA product_svc;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock_movements') THEN
    ALTER TABLE public.stock_movements SET SCHEMA product_svc;
  END IF;
END
$$;
