-- Add image_url column to products table for product image support
ALTER TABLE product_svc.products
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

COMMENT ON COLUMN product_svc.products.image_url IS 'URL or path to product image';
