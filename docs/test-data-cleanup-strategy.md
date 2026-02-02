# Test Data Cleanup Strategy

## Overview

This document describes how test data is managed and cleaned up across all services to prevent test data from leaking into production or dev databases.

## Current Strategy: Testcontainers + Explicit Cleanup Hooks

### Architecture

All integration tests use **Testcontainers** which provides:
- Ephemeral database containers that start fresh for each test suite
- Automatic container destruction after tests complete
- Isolation from production/dev databases

### Cleanup Hooks Implementation

Each service implements **dual cleanup hooks** for maximum safety:

1. **`beforeEach` / `@BeforeEach`**: Cleans database **before** each test starts
   - Ensures test starts with clean slate
   - Handles failed previous test cleanup
   - Makes tests order-independent

2. **`afterEach` / `@AfterEach`**: Cleans database **after** each test completes
   - Removes test data immediately
   - Prevents data accumulation during test run
   - Safety net for debugging sessions

## Service-Specific Implementation

### 1. Product Service (NestJS/TypeScript)

**Location:** `services/product-service/test/integration/product.controller.integration.spec.ts`

**Strategy:** TRUNCATE with CASCADE

```typescript
beforeEach(async () => {
  await dataSource.query(
    'TRUNCATE TABLE product_svc.stock_movements, product_svc.product_inventory, 
     product_svc.product_categories, product_svc.products, product_svc.categories 
     RESTART IDENTITY CASCADE'
  );
});

afterEach(async () => {
  await dataSource.query(
    'TRUNCATE TABLE product_svc.stock_movements, product_svc.product_inventory, 
     product_svc.product_categories, product_svc.products, product_svc.categories 
     RESTART IDENTITY CASCADE'
  );
});
```

**Benefits:**
- ✅ TRUNCATE is faster than DELETE (no row-by-row processing)
- ✅ RESTART IDENTITY resets auto-increment sequences
- ✅ CASCADE handles foreign key dependencies automatically
- ✅ Handles all related tables in correct order

---

### 2. Order Service (Java/Spring Boot + MSSQL)

**Location:** `services/order-service/src/test/java/org/kunlecreates/order/integration/OrderManagementIT.java`

**Strategy:** TRUNCATE with fallback to DELETE

```java
@BeforeEach
void cleanDatabase() {
    try {
        jdbcTemplate.execute("TRUNCATE TABLE order_svc.orders RESTART IDENTITY CASCADE");
    } catch (Exception e) {
        // Fallback to DELETE if TRUNCATE fails
        jdbcTemplate.execute("DELETE FROM order_svc.orders");
    }
}

@AfterEach
void cleanupAfterTest() {
    try {
        jdbcTemplate.execute("TRUNCATE TABLE order_svc.orders RESTART IDENTITY CASCADE");
    } catch (Exception e) {
        // Silently ignore - container might be stopping
    }
}
```

**Benefits:**
- ✅ TRUNCATE preferred for performance
- ✅ Graceful fallback to DELETE if TRUNCATE unavailable
- ✅ Silent failure in afterEach (container shutdown race condition)

---

### 3. User Service (Java/Spring Boot + Oracle DB)

**Location:** `services/user-service/src/test/java/org/kunlecreates/user/integration/UserAuthenticationIT.java`

**Strategy:** TRUNCATE with foreign key awareness

```java
@BeforeEach
void setUp() {
    cleanupDatabase();
}

@AfterEach
void tearDown() {
    cleanupDatabase();
}

private void cleanupDatabase() {
    try {
        // Clean in correct order: child tables first, then parent tables
        jdbcTemplate.execute("TRUNCATE TABLE user_roles, users, roles RESTART IDENTITY CASCADE");
    } catch (Exception e) {
        // Fallback to individual DELETE statements
        jdbcTemplate.execute("DELETE FROM user_roles");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM roles");
    }
}
```

**Benefits:**
- ✅ Respects foreign key constraints by cleaning child tables first
- ✅ Reusable cleanup method prevents code duplication
- ✅ Fallback DELETE handles cases where TRUNCATE is restricted

---

## When Test Data Can Leak

### ❌ Scenarios Where Cleanup Fails

1. **Running tests against shared dev/staging database**
   - Solution: Always use Testcontainers (configured correctly in all services)
   - Detection: Check `spring.datasource.url` or TypeORM config points to `localhost:random-port`

2. **Test crashes or hangs before cleanup**
   - Solution: Dual hooks (beforeEach + afterEach) provide redundancy
   - Manual fix: Run cleanup script manually

3. **Developer debugging with breakpoints**
   - Solution: afterEach still runs after manual test resumption
   - Manual fix: Run test suite again to trigger beforeEach cleanup

4. **CI pipeline failure mid-test**
   - Solution: Testcontainers auto-destroys on process exit
   - Detection: Monitor for orphaned Docker containers

---

## Best Practices

### ✅ DO

1. **Always use Testcontainers for integration tests**
   ```java
   @Testcontainers
   @SpringBootTest
   class MyIntegrationTest {
       @Container
       static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");
   }
   ```

2. **Implement both beforeEach AND afterEach cleanup**
   - Provides defense in depth
   - Handles edge cases gracefully

3. **Use TRUNCATE over DELETE when possible**
   - 10-100x faster for large datasets
   - Resets auto-increment IDs
   - Releases disk space immediately

4. **Clean in correct order for foreign keys**
   - Child tables (with FK) first
   - Parent tables last
   - Or use CASCADE option

5. **Use silent error handling in afterEach**
   - Container might be stopping
   - Prevents test failures due to cleanup race conditions

### ❌ DON'T

1. **Don't skip cleanup hooks**
   - Always implement both beforeEach and afterEach
   - Exception: Pure unit tests with mocks

2. **Don't use shared databases for integration tests**
   - Never point tests to dev/staging/prod databases
   - Always use Testcontainers or in-memory databases

3. **Don't rely only on afterAll cleanup**
   - Individual test failures would leave dirty state
   - Next test would see previous test's data

4. **Don't use transactions + rollback for cleanup**
   - Doesn't test real commit behavior
   - Hides transaction-related bugs
   - Incompatible with multiple test threads

---

## Manual Cleanup Commands

If test data leaks into a development database:

### PostgreSQL (Product Service)
```sql
TRUNCATE TABLE product_svc.stock_movements, 
               product_svc.product_inventory, 
               product_svc.product_categories, 
               product_svc.products, 
               product_svc.categories 
RESTART IDENTITY CASCADE;
```

### MSSQL (Order Service)
```sql
TRUNCATE TABLE order_svc.orders;
DBCC CHECKIDENT ('order_svc.orders', RESEED, 0);
```

### Oracle DB (User Service)
```sql
TRUNCATE TABLE user_roles;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;
```

---

## Verification

To verify test data cleanup is working:

1. **Before test run:**
   ```bash
   # Check no test data exists
   docker exec <db-container> psql -U postgres -c "SELECT COUNT(*) FROM product_svc.products;"
   ```

2. **During test run:**
   - Set breakpoint after test
   - Check database - data should exist

3. **After test run:**
   ```bash
   # Verify cleanup happened
   docker exec <db-container> psql -U postgres -c "SELECT COUNT(*) FROM product_svc.products;"
   # Should return 0
   ```

---

## CI/CD Integration

GitHub Actions automatically:
1. Starts Testcontainers for each test suite
2. Runs tests with cleanup hooks
3. Destroys containers after tests complete
4. No manual cleanup needed

**Container Lifecycle:**
```
Test Start → Testcontainers Up → beforeEach cleanup → Test Run → 
afterEach cleanup → Test End → Testcontainers Down (automatic)
```

---

## Future Enhancements

Potential improvements to consider:

1. **Database snapshots**: Take snapshot before test, restore after
2. **Parallel test isolation**: Separate schema per test thread
3. **Metrics**: Track cleanup execution time
4. **Alerts**: Notify if cleanup fails in CI

---

## Summary

| Service | Database | Cleanup Strategy | Tables Cleaned |
|---------|----------|------------------|----------------|
| Product | PostgreSQL | TRUNCATE CASCADE | 5 tables (products, categories, inventory, movements, join table) |
| Order | MSSQL | TRUNCATE with DELETE fallback | 1 table (orders) |
| User | Oracle DB | TRUNCATE CASCADE with DELETE fallback | 3 tables (users, roles, user_roles) |

**All services use Testcontainers + dual cleanup hooks (beforeEach + afterEach) for maximum data isolation.**

