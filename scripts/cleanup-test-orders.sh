#!/bin/bash
# Script to clean up test orders from the database
# Removes orders created by test users or in test statuses

set -e

NAMESPACE="${1:-mssql-system}"
POD=$(kubectl -n "$NAMESPACE" get pods -l app=mssql -o jsonpath='{.items[0].metadata.name}')

echo "🧹 Cleaning up test orders from database..."
echo "Using pod: $POD in namespace: $NAMESPACE"

kubectl -n "$NAMESPACE" exec -it "$POD" -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U order_app_login -P 'cmhjlnWJMwQQgCUClsM1sQ==' -d order_svc -C -Q "
SET NOCOUNT ON;

-- Count orders before cleanup
DECLARE @before_count INT;
SELECT @before_count = COUNT(*) FROM order_svc.orders;

-- First, delete related order_events for test orders
DELETE FROM order_svc.order_events 
WHERE order_id IN (
    SELECT id FROM order_svc.orders
    WHERE shipping_recipient IS NULL 
       OR user_ref LIKE 'testuser%'
       OR user_ref LIKE 'test%'
       OR (status = 'PENDING' AND DATEDIFF(hour, created_at, GETDATE()) > 24)
);

-- Then delete the test orders themselves
DELETE FROM order_svc.orders 
WHERE shipping_recipient IS NULL 
   OR user_ref LIKE 'testuser%'
   OR user_ref LIKE 'test%'
   OR (status = 'PENDING' AND DATEDIFF(hour, created_at, GETDATE()) > 24);

-- Count orders after cleanup
DECLARE @after_count INT;
SELECT @after_count = COUNT(*) FROM order_svc.orders;

-- Show results
SELECT 
    @before_count AS 'Before Cleanup',
    @after_count AS 'After Cleanup',
    (@before_count - @after_count) AS 'Deleted Orders';
"

echo "✅ Test orders cleanup complete!"
