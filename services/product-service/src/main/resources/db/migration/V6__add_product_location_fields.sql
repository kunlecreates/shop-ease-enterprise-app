-- V6: Add in-store location fields for grocery store management
-- Supports finding products by aisle, section, and shelf location

ALTER TABLE product_svc.products
ADD COLUMN IF NOT EXISTS aisle VARCHAR(50),
ADD COLUMN IF NOT EXISTS section VARCHAR(100),
ADD COLUMN IF NOT EXISTS shelf_location VARCHAR(100);

COMMENT ON COLUMN product_svc.products.aisle IS 'Store aisle number or name (e.g., "A12", "Dairy")';
COMMENT ON COLUMN product_svc.products.section IS 'Section within aisle (e.g., "Refrigerated", "Organic")';
COMMENT ON COLUMN product_svc.products.shelf_location IS 'Specific shelf or bin location (e.g., "Top Shelf", "Bin 3")';

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_products_aisle ON product_svc.products(aisle);
CREATE INDEX IF NOT EXISTS idx_products_section ON product_svc.products(section);
