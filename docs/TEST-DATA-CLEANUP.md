# Test Data Cleanup Strategy

## Overview

This document explains how test data is managed and cleaned up across different test environments to prevent test data from polluting live databases.

## Test Environment Types

### 1. Integration Tests (Testcontainers)
**Location:** Inside each service (`services/*/test/integration/`)  
**Database:** Ephemeral Docker containers (automatically destroyed)  
**Cleanup:** ❌ **NOT NEEDED** - Containers are destroyed after tests

### 2. API Contract Tests
**Location:** `/api-tests/`  
**Database:** Live staging/dev database  
**Cleanup:** ✅ **AUTOMATED** - Uses cleanup framework

### 3. E2E Tests (Playwright)
**Location:** `/e2e/`  
**Database:** Live staging/dev database  
**Cleanup:** ✅ **AUTOMATED** - Global teardown after suite

---

## The Challenge: Test Data vs. Seed Data

### Seed Data (MUST NEVER DELETE)
These are intentional records needed for the application to function:

**Products:**
- `APPLE001`, `BANANA001`, `MILK001`, etc. (from V2__seed_products.sql)

**Users:**
- `admin@shopease.com` - Production admin
- `alice@example.com`, `bob@example.com` - Test customer accounts

**Roles:**
- `admin`, `customer` (from V1__init.sql)

### Test Data (SHOULD BE DELETED)
Temporary records created during test execution:

**Pattern Markers:**
- **Emails:** `test-*@`, `checkout*@`, `api-test*@`, `e2e-*@`, `temp-*@`
- **SKUs:** `int-*`, `test-*`, `temp-*`, `api-*`, `e2e-*`
- **Usernames:** `test-*`, `checkout*`, `api-test*`, `e2e-*`, `temp-*`

**Examples:**
- `checkout1738531200@example.com` (created by customer-checkout test)
- `int-product` with SKU `int-1738531200` (created by admin-product test)

---

## Cleanup Implementation

### API Tests (`/api-tests`)

#### Cleanup Framework
- **File:** [`api-tests/framework/cleanup.ts`](../api-tests/framework/cleanup.ts)
- **Setup:** [`api-tests/framework/setup.ts`](../api-tests/framework/setup.ts) (loaded via jest.config.ts)

#### How It Works
1. Tests create resources (users, products, orders)
2. Tests register cleanup using `registerDelete()`
3. Jest's `afterAll()` calls `teardownAll()`
4. Cleanup runs in reverse order (LIFO)

#### Example Usage
```typescript
// Create a test product
const resp = await productHttp.post('/api/product', {
  name: 'Test Product',
  sku: `test-${Date.now()}`,  // ← Follows naming pattern
  priceCents: 1000
}, { headers: { Authorization: `Bearer ${adminToken}` } });

const sku = resp.data.sku;

// Register cleanup (MANDATORY - no try/catch!)
const { registerDelete } = await import('../framework/cleanup');
registerDelete(productHttp, (s: any) => `/api/product/${s}`, sku, adminToken);
```

#### Key Features
- ✅ Cleanup runs automatically after all tests
- ✅ Errors logged but don't fail the test suite
- ✅ Cleanup order is LIFO (last created, first deleted)
- ✅ Console logging shows cleanup progress

---

### E2E Tests (`/e2e`)

#### Global Teardown
- **File:** [`e2e/global-teardown.ts`](../e2e/global-teardown.ts)
- **Helper:** [`e2e/helpers/cleanup.ts`](../e2e/helpers/cleanup.ts)
- **Config:** Registered in [`playwright.config.ts`](../e2e/playwright.config.ts)

#### How It Works
1. All Playwright tests run (across all workers)
2. After ALL tests complete, `globalTeardown()` runs ONCE
3. Fetches admin token from environment or defaults
4. Queries all users/products from live database
5. Deletes ONLY items matching test data patterns
6. Logs cleanup progress to console

#### Safety Mechanisms
- **Pattern Matching:** Only deletes items with test prefixes
- **Seed Data Protection:** Never touches `APPLE001`, `admin@shopease.com`, etc.
- **Error Handling:** Failed cleanups don't fail the test suite
- **Logging:** Shows exactly what was deleted

#### Functions Available

```typescript
// Clean up test users only (preserves seed users)
await cleanupTestUsers();

// Clean up test products only (preserves seed products)
await cleanupTestProducts();

// Clean up ALL test data (users, products, orders)
await cleanupAllTestData();
```

---

## Cleanup Logs

### API Test Cleanup
```bash
[Cleanup] Running 3 cleanup operations...
[Cleanup] Deleted /api/product/int-1738531200 - Status: 204
[Cleanup] Deleted /carts/cart-abc123 - Status: 204
[Cleanup] All cleanup operations completed
```

### E2E Test Cleanup
```bash
[Global Teardown] Running E2E test cleanup...
[E2E Cleanup] Starting comprehensive test data cleanup...
[E2E Cleanup] Deleted test user: checkout1738531200@example.com
[E2E Cleanup] Deleted test user: e2e-test-user@example.com
[E2E Cleanup] Deleted 2 test user(s)
[E2E Cleanup] Deleted test product: int-product
[E2E Cleanup] Deleted 1 test product(s)
[E2E Cleanup] All test data cleanup completed
[Global Teardown] E2E cleanup completed successfully
```

---

## Environment Variables

### Required for E2E Cleanup
```bash
# Admin credentials for cleanup operations
E2E_ADMIN_EMAIL=admin@shopease.com
E2E_ADMIN_PASSWORD=YourSecurePassword

# Base URL for API calls
E2E_BASE_URL=https://staging.acegrocer.io
```

---

## Best Practices for Test Data

### ✅ DO:
- Use test prefixes: `test-`, `e2e-`, `temp-`, `checkout`, `api-test`
- Register cleanup immediately after creating resources
- Use timestamp suffixes for uniqueness: `test-${Date.now()}`
- Test cleanup in local environment before CI

### ❌ DON'T:
- Use seed data email patterns (`alice@`, `bob@`, `admin@`)
- Use seed product SKUs (`APPLE001`, `BANANA001`, etc.)
- Wrap `registerDelete()` in try/catch (cleanup is mandatory)
- Create data without cleanup registration

---

## Troubleshooting

### "Test data still appears after tests"
1. Check if cleanup ran: Look for `[Cleanup]` logs
2. Verify test data naming: Does it match `TEST_DATA_MARKERS` patterns?
3. Check admin token: E2E cleanup needs valid admin credentials
4. Review API endpoints: Does DELETE endpoint exist and work?

### "Seed data was deleted!"
1. Check naming patterns: Seed data should NOT match test prefixes
2. Review cleanup patterns in `TEST_DATA_MARKERS`
3. Update seed script to use non-matching names

### "Cleanup failed but tests passed"
- This is intentional - cleanup errors don't fail tests
- Check logs for specific error messages
- Fix the underlying API or permission issue

---

## Migration Guide

If you have existing tests that create data without cleanup:

### Before (No Cleanup)
```typescript
const product = await createProduct({ sku: 'test-product' });
// ❌ No cleanup - data persists forever
```

### After (With Cleanup)
```typescript
const product = await createProduct({ sku: `test-${Date.now()}` });

// ✅ Register cleanup
const { registerDelete } = await import('../framework/cleanup');
registerDelete(productHttp, (s: any) => `/api/product/${s}`, product.sku, token);
```

---

## Summary

| Test Type | Database | Cleanup Method | When Runs |
|-----------|----------|----------------|-----------|
| Integration | Testcontainers | N/A (destroyed) | N/A |
| API Tests | Live DB | `teardownAll()` | After each test file |
| E2E Tests | Live DB | `globalTeardown()` | After ALL tests |

**Key Principle:** Test data is marked with specific patterns and cleaned up automatically, while seed data uses non-matching patterns and is never touched by cleanup operations.
