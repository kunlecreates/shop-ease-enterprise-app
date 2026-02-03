-- V2__add_shipping_payment_to_orders.sql
-- Add shipping address and payment method fields to orders table
-- These fields capture the shipping and payment information at the time of order placement
-- This migration is idempotent - it only adds columns if they don't already exist

-- Shipping Address Fields (8 columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'shipping_recipient')
    ALTER TABLE order_svc.orders ADD shipping_recipient VARCHAR(255);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'shipping_street1')
    ALTER TABLE order_svc.orders ADD shipping_street1 VARCHAR(255);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'shipping_street2')
    ALTER TABLE order_svc.orders ADD shipping_street2 VARCHAR(255);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'shipping_city')
    ALTER TABLE order_svc.orders ADD shipping_city VARCHAR(100);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'shipping_state')
    ALTER TABLE order_svc.orders ADD shipping_state VARCHAR(100);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'shipping_postal_code')
    ALTER TABLE order_svc.orders ADD shipping_postal_code VARCHAR(20);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'shipping_country')
    ALTER TABLE order_svc.orders ADD shipping_country VARCHAR(100);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'shipping_phone')
    ALTER TABLE order_svc.orders ADD shipping_phone VARCHAR(20);

-- Payment Method Display Fields (3 columns)
-- These are for customer-facing display, NOT for payment processing
-- Actual payment transactions are recorded in the payments/payment_transactions tables
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'payment_method_type')
    ALTER TABLE order_svc.orders ADD payment_method_type VARCHAR(50);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'payment_last4')
    ALTER TABLE order_svc.orders ADD payment_last4 VARCHAR(4);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'payment_brand')
    ALTER TABLE order_svc.orders ADD payment_brand VARCHAR(50);
