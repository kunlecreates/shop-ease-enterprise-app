-- V3__add_customer_info_to_orders.sql
-- Store customer email and display name at time of order creation
-- Required to send correct notification emails on status changes (e.g. by admin)
-- without needing to call user-service for each notification

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'customer_email')
    ALTER TABLE order_svc.orders ADD customer_email VARCHAR(255);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_svc.orders') AND name = 'customer_name')
    ALTER TABLE order_svc.orders ADD customer_name VARCHAR(255);
