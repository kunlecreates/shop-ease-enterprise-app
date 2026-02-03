# Database Cleanup Scripts

This directory contains utility scripts for maintaining clean test and production databases.

## Order Cleanup Script

### `cleanup-test-orders.sh`

Removes test orders from the order database to prevent accumulation during development and testing.

**What it removes:**
- Orders with no shipping information (incomplete test orders)
- Orders created by test users (userRef matching `testuser%` or `test%`)
- Old pending orders (PENDING status older than 24 hours)

**Usage:**
```bash
./scripts/cleanup-test-orders.sh [namespace]
```

**Examples:**
```bash
# Clean orders in default namespace (mssql-system)
./scripts/cleanup-test-orders.sh

# Clean orders in specific namespace
./scripts/cleanup-test-orders.sh mssql-system
```

**Safety:**
- Preserves legitimate customer orders with complete shipping data
- Handles foreign key constraints (deletes order_events first)
- Shows before/after counts

**Output:**
```
🧹 Cleaning up test orders from database...
Using pod: mssql-0 in namespace: mssql-system
Before Cleanup After Cleanup Deleted Orders
-------------- ------------- --------------
           155             6            149
✅ Test orders cleanup complete!
```

## When to Run

- **After E2E test runs** - E2E tests create many test orders
- **After API contract tests** - API tests may leave incomplete orders
- **Before production deployment** - Ensure clean database state
- **Weekly maintenance** - Prevent database bloat

## Related Cleanup

For complete test data cleanup, also see:
- `e2e/helpers/cleanup.ts` - Application-level cleanup (users, products, orders)
- User-service cleanup scripts (if any)
- Product-service cleanup scripts (if any)

## Future Improvements

- [ ] Add automated scheduling (cron job)
- [ ] Implement DELETE endpoint in order-service API
- [ ] Add dry-run mode to preview deletions
- [ ] Support cleanup by date range
- [ ] Add metrics/logging integration
