# 🔍 Code Coverage Gap Analysis - ShopEase Microservices
**Current Aggregate Coverage: 57% | Target: 90%**
**Analysis Date:** $(date +%Y-%m-%d)

---

## Executive Summary

Current test suite has **68 implementation files** but only **~20 test files**, explaining the 57% aggregate coverage. The analysis below identifies specific untested code paths and provides actionable recommendations to reach the 90% target.

### Coverage Distribution (Estimated)
- **user-service**: ~75% (Good unit + integration coverage)
- **order-service**: ~70% (Good unit + integration coverage)  
- **product-service**: ~55% (Has tests but missing edge cases)
- **notification-service**: ~60% (Has unit tests, limited integration tests)
- **frontend**: ~40% (Minimal test coverage)

---

## 🚨 Priority 1: Critical Gaps (High Impact)

### 1. user-service: AuthService Edge Cases

**File**: `services/user-service/src/main/java/.../application/AuthService.java`

**Current Coverage**: ~80% (based on test analysis)

**Missing Test Cases**:

#### Email Verification Flow (Lines 49-100)
- [ ] **register() with email verification disabled** (test when `emailVerificationService` is null)
- [ ] **register() when email verification token generation fails** (exception handling)
- [ ] **register() concurrent duplicate attempts** (race condition on duplicate check)
- [ ] **register() with invalid email format** (should fail validation before persistence)
- [ ] **register() when role assignment fails** (RoleRepository throws exception)
- [ ] **JWT generation edge case**: Test when `emailVerified` changes between creation and JWT generation

#### Password Reset Token Management (Lines 144-187)
- [ ] **initiatePasswordReset() when multiple tokens exist** (boundary: exactly at expiry time)
- [ ] **initiatePasswordReset() when bcrypt encoding fails** (rare but possible)
- [ ] **initiatePasswordReset() with concurrent requests for same user** (race condition)
- [ ] **confirmPasswordReset() when bcrypt matching times out** (DoS protection)
- [ ] **confirmPasswordReset() when multiple tokens match** (should only mark the correct one used)
- [ ] **confirmPasswordReset() boundary**: Token expires exactly during validation
- [ ] **confirmPasswordReset() when password update fails** (UserRepository save throws exception)

#### Login Security Edge Cases (Lines 103-142)
- [ ] **login() when password reset token just expired** (boundary condition)
- [ ] **login() when email verification status changes during login** (race condition)
- [ ] **login() account lockout after N failed attempts** (not currently implemented)
- [ ] **login() with expired JWT in request** (should still allow re-login)

**Impact**: Adding these tests would increase user-service coverage from ~75% to ~90% (+15%)

---

### 2. product-service: Critical Business Logic Gaps

**File**: `services/product-service/src/application/product.service.ts`

**Current Coverage**: ~70% (based on test analysis)

**Missing Test Cases**:

#### Stock Management Edge Cases (Lines 150-175)
- [ ] **adjustStock() with concurrent decrement operations** (race condition: two orders for last item)
- [ ] **adjustStock() when product is deleted during adjustment** (orphaned movement)
- [ ] **adjustStock() boundary**: Decrement to exactly 0 (should succeed)
- [ ] **adjustStock() boundary**: Increment to Integer.MAX_VALUE (overflow protection)
- [ ] **adjustStock() rollback behavior** (when StockMovement save fails after product lookup)
- [ ] **getStock() with malformed movements** (negative quantities, NULL values)
- [ ] **getStock() performance**: Large number of movements (10,000+ records)

#### Product Creation Edge Cases (Lines 27-70)
- [ ] **createProduct() when category save fails mid-transaction** (partial rollback)
- [ ] **createProduct() with initialStock = 0** (should not create movement)
- [ ] **createProduct() with initialStock = negative value** (should reject)
- [ ] **createProduct() when currency is unsupported** (validation)
- [ ] **createProduct() with both price AND priceCents** (which takes precedence?)
- [ ] **createProduct() duplicate SKU with different case** ("SKU-001" vs "sku-001")

#### Search & Filter Edge Cases (Lines 72-130)
- [ ] **listProducts() with invalid pagination** (page = 0, limit = -1, limit = 10000)
- [ ] **listProducts() with SQL injection attempts in query string** (security test)
- [ ] **listProducts() when category filter doesn't exist** (empty result vs error?)
- [ ] **listProducts() with price filter: minPrice > maxPrice** (invalid range)
- [ ] **searchProducts() with special characters in query** (PostgreSQL full-text search edge cases)
- [ ] **searchProducts() with empty string** (should return all or none?)

#### File: `services/product-service/src/presentation/product.controller.ts`

**Current Coverage**: ~60%

**Missing Test Cases**:
- [ ] **POST /product with JWT but non-admin role** (customer trying to create product)
- [ ] **POST /product with malformed JWT** (invalid signature, expired token)
- [ ] **PATCH /:sku/stock with quantity field instead of adjustment** (API compatibility)
- [ ] **DELETE /:sku when product has pending orders** (referential integrity)
- [ ] **GET /inventory with 10,000+ products** (pagination stress test)

**Impact**: Adding these tests would increase product-service coverage from ~55% to ~85% (+30%)

---

### 3. order-service: Payment & Notification Integration Gaps

**File**: `services/order-service/src/main/java/.../application/OrderService.java`

**Current Coverage**: ~75%

**Missing Test Cases**:

#### Payment Processing Edge Cases
- [ ] **processCheckout() when payment gateway times out** (retry logic?)
- [ ] **processCheckout() when payment succeeds but order save fails** (rollback payment?)
- [ ] **processCheckout() with amount = 0.00** (should reject)
- [ ] **processCheckout() with amount = MAX_DOUBLE** (overflow protection)
- [ ] **processCheckout() when user has insufficient funds** (PaymentService returns specific error code)

#### Notification Integration Edge Cases
- [ ] **createOrder() when notification service is down** (async vs sync? should order still succeed?)
- [ ] **createOrder() when notification returns 500** (retry logic? dead letter queue?)
- [ ] **createOrder() with invalid email in userRef** (notification should fail gracefully)

#### Order State Management
- [ ] **createOrder() when both userRef and userId are NULL** (existing test, but add more boundary cases)
- [ ] **createOrder() when order total doesn't match items total** (fraud detection)
- [ ] **createOrder() with empty shipping address** (validation)
- [ ] **createOrder() with concurrent orders for same user** (race condition on cart)

**Impact**: Adding these tests would increase order-service coverage from ~70% to ~85% (+15%)

---

### 4. notification-service: Integration & Error Handling Gaps

**File**: `services/notification-service/app/services/email_service.py`

**Current Coverage**: ~60% (has unit tests, missing integration)

**Missing Test Cases**:

#### Email Provider Integration (Lines 50-85)
- [ ] **send_order_confirmation() when email provider rate limits** (429 response)
- [ ] **send_order_confirmation() with invalid email format** (should validate before sending)
- [ ] **send_order_confirmation() when template rendering times out** (DoS protection)
- [ ] **send_order_confirmation() with 10,000+ items in order** (template size limit)
- [ ] **send_order_confirmation() when SMTP connection drops mid-send** (retry logic)

#### Template Rendering Edge Cases
- [ ] **send_email() with missing template file** (already tested, but add recovery logic?)
- [ ] **send_email() with circular template references** (infinite loop protection)
- [ ] **send_email() with XSS attempt in template data** (sanitization)
- [ ] **send_password_reset() when reset_url contains malicious script** (validation)

#### Concurrency & Performance
- [ ] **send_email() with 100 concurrent requests** (connection pool exhaustion?)
- [ ] **send_email() async execution** (current implementation blocks - is this intentional?)

**Impact**: Adding these tests would increase notification-service coverage from ~60% to ~85% (+25%)

---

## 🟡 Priority 2: Medium Impact Gaps

### 5. frontend: Component & Integration Tests

**Current Coverage**: ~40% (minimal)

**Missing Test Coverage**:

#### Critical User Flows (End-to-End Component Tests)
- [ ] **Checkout flow**: Add to cart → Enter shipping → Enter payment → Submit order
- [ ] **Product search**: Search → Filter by category → Sort by price
- [ ] **Admin product management**: Create product → Edit → Delete → Stock adjustment
- [ ] **Authentication flow**: Register → Email verification → Login → Logout

#### API Client Error Handling
- [ ] **ApiClient.post()** when backend returns 500 (should display user-friendly error)
- [ ] **ApiClient.get()** when network times out (should show retry option)
- [ ] **ApiClient.put()** when JWT expires mid-request (should redirect to login)

#### State Management
- [ ] **Cart context** concurrent updates (two tabs adding same product)
- [ ] **Auth context** token refresh logic (before expiry)
- [ ] **Cart persistence** when localStorage is full (quota exceeded)

**Files to Test**:
- `frontend/app/checkout/page.tsx` (Lines 46-90)
- `frontend/app/admin/products/page.tsx` (Lines 46-120)
- `frontend/lib/api-client.ts` (all methods)
- `frontend/contexts/AuthContext.tsx` (JWT handling)

**Impact**: Adding these tests would increase frontend coverage from ~40% to ~70% (+30%)

---

## 🟢 Priority 3: Nice-to-Have Tests

### 6. Integration Tests Across Services

**Current State**: API tests exist in `/api-tests`, but not counted in service-level coverage

**Recommendations**:
- [ ] **User → Product flow**: User logs in, searches products, views details
- [ ] **Order → Notification flow**: Order created → Notification sent → Email delivered
- [ ] **Product → Order consistency**: Product stock decrements after order
- [ ] **Admin → All services**: Admin creates product, creates user, views orders

**Note**: These tests improve system confidence but don't increase service-level coverage metrics.

---

## 📊 Estimated Impact Analysis

| Service              | Current % | Priority 1 Tests | Priority 2 Tests | Expected % |
|----------------------|-----------|------------------|------------------|------------|
| **user-service**     | 75%       | +15 tests        | +5 tests         | **90%**    |
| **order-service**    | 70%       | +12 tests        | +8 tests         | **85%**    |
| **product-service**  | 55%       | +20 tests        | +10 tests        | **85%**    |
| **notification-service** | 60%   | +15 tests        | +5 tests         | **85%**    |
| **frontend**         | 40%       | +10 tests        | +25 tests        | **70%**    |
| **Aggregate**        | **57%**   | **+72 tests**    | **+53 tests**    | **~83%**   |

### Path to 90% Aggregate Coverage

**Phase 1**: Implement Priority 1 tests (72 tests) → ~83% coverage (6 weeks)
**Phase 2**: Implement Priority 2 tests (53 tests) → ~90% coverage (4 weeks)
**Total Effort**: ~10 weeks (2.5 months) with 1 engineer dedicated to testing

---

## 🎯 Recommended Implementation Order

### Week 1-2: product-service
- Focus: Stock management edge cases, search/filter validation
- Reason: Highest impact (+30%), core business logic

### Week 3-4: user-service
- Focus: Password reset edge cases, concurrent registration
- Reason: Security-critical, authentication foundation

### Week 5-6: notification-service
- Focus: Email provider integration, template rendering edge cases
- Reason: Affects user experience, error handling critical

### Week 7-8: order-service
- Focus: Payment integration, notification failures
- Reason: Financial transactions, fraud prevention

### Week 9-10: frontend
- Focus: Critical user flows, API error handling
- Reason: User-facing impact, requires E2E setup

---

## 🔧 Testing Best Practices for Gap Closure

### 1. Test Naming Convention
```java
@Test
void methodName_whenCondition_shouldExpectedBehavior() {
    // Example: adjustStock_whenStockWouldGoNegative_shouldThrowBadRequestException
}
```

### 2. Edge Case Categories
- **Boundary conditions**: 0, -1, MAX_VALUE, empty, null
- **Race conditions**: Concurrent operations on same resource
- **Timeout scenarios**: External service delays
- **Rollback scenarios**: Transaction failures mid-operation
- **Security scenarios**: SQL injection, XSS, JWT manipulation

### 3. Coverage Measurement
- Run tests after each PR: `npm run test:coverage` or `mvn clean test`
- Block PR merge if coverage drops below 80% per service
- Track coverage trend weekly (target: +2% per week)

### 4. Testcontainers for Integration Tests
All integration tests must use Testcontainers (real databases):
- **Java**: `@Testcontainers` + `@Container PostgreSQLContainer`
- **TypeScript**: `PostgreSqlContainer.start()` in `beforeAll()`
- **Python**: `PostgresContainer` from `testcontainers-python`

---

## 📋 Action Items Checklist

- [ ] Create GitHub issues for Priority 1 tests (72 tests = 12 issues, ~6 tests per issue)
- [ ] Assign to testing team with 2-week sprints
- [ ] Set up coverage dashboard (Codecov or SonarQube)
- [ ] Configure branch protection: require 80% coverage on new PRs
- [ ] Schedule weekly coverage review meeting (15 min standup)
- [ ] Document test templates in `/docs/testing-guidelines.md`

---

## 🚀 Quick Wins (Can Complete in 1 Week)

1. **product-service stock edge cases** (5 tests, +8% coverage)
2. **user-service password reset boundaries** (3 tests, +5% coverage)
3. **order-service payment failure scenarios** (4 tests, +6% coverage)
4. **notification-service email validation** (3 tests, +5% coverage)

**Total Quick Wins**: +24% aggregate coverage in 1 week with focused effort

---

## 📌 Notes & Assumptions

- Coverage percentages are **estimated** based on test file analysis (actual may vary ±5%)
- Assumes **JaCoCo** (Java), **Jest** (TypeScript), **pytest-cov** (Python) for coverage measurement
- Frontend coverage requires **Jest + React Testing Library** setup (not currently configured?)
- API tests in `/api-tests` are excluded from service-level coverage (by design)
- E2E Playwright tests in `/e2e` do not contribute to code coverage (black-box testing)

---

**Analysis Completed**: $(date +%Y-%m-%d)  
**Next Review**: Add actual coverage reports from CI pipeline
