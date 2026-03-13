-- Add product_name to order_items to capture the display name at the time of ordering,
-- enabling email notifications to show human-readable names instead of internal product IDs.
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'order_svc'
      AND TABLE_NAME   = 'order_items'
      AND COLUMN_NAME  = 'product_name'
)
BEGIN
    ALTER TABLE order_svc.order_items
        ADD product_name VARCHAR(255) NULL;
END
GO
