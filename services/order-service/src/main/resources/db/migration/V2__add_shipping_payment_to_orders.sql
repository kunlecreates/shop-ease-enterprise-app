-- V2__add_shipping_payment_to_orders.sql
-- Add shipping address and payment method fields to orders table
-- These fields capture the shipping and payment information at the time of order placement

-- Shipping Address Fields (8 columns)
ALTER TABLE orders ADD COLUMN shipping_recipient VARCHAR(255);
ALTER TABLE orders ADD COLUMN shipping_street1 VARCHAR(255);
ALTER TABLE orders ADD COLUMN shipping_street2 VARCHAR(255);
ALTER TABLE orders ADD COLUMN shipping_city VARCHAR(100);
ALTER TABLE orders ADD COLUMN shipping_state VARCHAR(100);
ALTER TABLE orders ADD COLUMN shipping_postal_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN shipping_country VARCHAR(100);
ALTER TABLE orders ADD COLUMN shipping_phone VARCHAR(20);

-- Payment Method Display Fields (3 columns)
-- These are for customer-facing display, NOT for payment processing
-- Actual payment transactions are recorded in the payments/payment_transactions tables
ALTER TABLE orders ADD COLUMN payment_method_type VARCHAR(50);  -- 'CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', etc.
ALTER TABLE orders ADD COLUMN payment_last4 VARCHAR(4);         -- Last 4 digits of card
ALTER TABLE orders ADD COLUMN payment_brand VARCHAR(50);        -- 'Visa', 'Mastercard', 'Amex', etc.
