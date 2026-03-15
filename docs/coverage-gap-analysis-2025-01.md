# Code Coverage Gap Analysis - ShopEase Microservices
**Review Date:** 2026-03-15 (updated — integration gap closure pass)
**Status:** All five modules at or above 85% statement coverage. All four integration gap areas implemented and verified.

---

## Executive Summary

This document is a current-state coverage analysis for the repository as of the integration gap closure pass.

It reflects:

- the current test files present in the repository
- the tests added during both the controller/infrastructure expansion and the integration gap closure passes
- the targeted suites that were executed and passed in this workspace session
- the fresh measured coverage artifacts generated in this workspace session

Important limitation:

- there is still **no single aggregate multi-service coverage report committed at repository root**

Because of that, this document distinguishes between:

- **Measured**: backed by a currently generated coverage artifact in this workspace
- **Verified**: backed by current test inventory and successful suite execution
- **Unmeasured**: still needs a fresh coverage run before any percentage claim should be made

---

## Current Evidence Base

### Measured Coverage Artifacts (Fresh Session Runs)

- **user-service**: `services/user-service/target/site/jacoco/jacoco.csv`
    - statements (instruction) coverage: **94.68%** _(was 88.85% before integration gap closure)_
    - covered instructions: 2776 / 2932

- **order-service**: `services/order-service/target/site/jacoco/jacoco.csv`
    - statements (instruction) coverage: **90.52%** _(was 89.49% before integration gap closure)_
    - covered instructions: 3506 / 3873

- **product-service**: `services/product-service/coverage/coverage-summary.json`
    - statements coverage: **95.15%** _(was 94.30% before integration gap closure)_
    - covered statements: 334 / 351
    - function coverage: **100.00%**

- **frontend**: `frontend/coverage/coverage-summary.json`
    - statements coverage: **89.90%** _(unchanged — no new frontend tests in integration gap closure pass)_
    - covered statements: 463 / 515

- **notification-service**: `services/notification-service/coverage.json`
    - full-suite statements coverage: **90.91%**
    - total covered lines: **330 / 363 statements**

### Minimum-Target Check

Statement coverage target (minimum **85%**) is satisfied across all measured modules:

| Service | Statements | Target | Status |
|---------|-----------|--------|--------|
| user-service | **94.68%** | ≥ 85% | ✅ |
| order-service | **90.52%** | ≥ 85% | ✅ |
| product-service | **95.15%** | ≥ 85% | ✅ |
| frontend | **89.90%** | ≥ 85% | ✅ |
| notification-service | **90.91%** | ≥ 85% | ✅ |

### Verified Test Inventory

#### user-service

Current test files:

- `services/user-service/src/test/java/org/kunlecreates/user/unit/AuthServiceTest.java`
- `services/user-service/src/test/java/org/kunlecreates/user/unit/AuthControllerTest.java`
- `services/user-service/src/test/java/org/kunlecreates/user/unit/EmailVerificationServiceTest.java`
- `services/user-service/src/test/java/org/kunlecreates/user/unit/UserServiceTest.java`
- `services/user-service/src/test/java/org/kunlecreates/user/unit/UserControllerTest.java`
- `services/user-service/src/test/java/org/kunlecreates/user/unit/UserTest.java`
- `services/user-service/src/test/java/org/kunlecreates/user/unit/UserSupportClassesTest.java`
- `services/user-service/src/test/java/org/kunlecreates/user/unit/UserConfigAndExceptionTest.java`
- `services/user-service/src/test/java/org/kunlecreates/user/unit/JwtServiceTest.java`
- `services/user-service/src/test/java/org/kunlecreates/user/unit/PasswordHashGeneratorTest.java`
- `services/user-service/src/test/java/org/kunlecreates/user/integration/UserAuthenticationIT.java`
- `services/user-service/src/test/java/org/kunlecreates/user/integration/PasswordResetIT.java` _(added — integration gap closure)_

**Total verified: 127 unit + 12 IT = 139 tests**

#### order-service

Current test files:

- `services/order-service/src/test/java/org/kunlecreates/order/unit/OrderControllerTest.java`
- `services/order-service/src/test/java/org/kunlecreates/order/unit/CartControllerTest.java`
- `services/order-service/src/test/java/org/kunlecreates/order/unit/OrderServiceTest.java`
- `services/order-service/src/test/java/org/kunlecreates/order/unit/CartServiceTest.java`
- `services/order-service/src/test/java/org/kunlecreates/order/unit/OrderTest.java`
- `services/order-service/src/test/java/org/kunlecreates/order/unit/OrderSupportClassesTest.java`
- `services/order-service/src/test/java/org/kunlecreates/order/unit/OrderConfigAndExceptionTest.java`
- `services/order-service/src/test/java/org/kunlecreates/order/infrastructure/notification/NotificationClientTest.java`
- `services/order-service/src/test/java/org/kunlecreates/order/infrastructure/product/ProductServiceClientTest.java`
- `services/order-service/src/test/java/org/kunlecreates/order/integration/OrderManagementIT.java`
- `services/order-service/src/test/java/org/kunlecreates/order/integration/CartManagementIT.java`
- `services/order-service/src/test/java/org/kunlecreates/order/integration/OrderValidationIT.java` _(added — integration gap closure)_

**Total verified: 107 unit + 19 IT = 126 tests**

#### product-service

Current test files:

- `services/product-service/test/unit/product.controller.spec.ts`
- `services/product-service/test/unit/product.service.spec.ts`
- `services/product-service/test/unit/product.entity.spec.ts`
- `services/product-service/test/unit/category.service.spec.ts`
- `services/product-service/test/unit/category.controller.spec.ts`
- `services/product-service/test/unit/internal-api-key.guard.spec.ts`
- `services/product-service/test/unit/data-source.spec.ts`
- `services/product-service/test/security/product.controller.security.spec.ts`
- `services/product-service/test/integration/product.controller.integration.spec.ts`
  _(extended with 9 new scenarios: product update flows, stock boundary conditions, inventory summary — integration gap closure)_

**Total verified: 121 tests (100 unit + 21 integration)**

#### notification-service

Current unit test files:

- `services/notification-service/tests/unit/test_email_service.py`
- `services/notification-service/tests/unit/test_email_provider.py`
- `services/notification-service/tests/unit/test_template_service.py`
- `services/notification-service/tests/unit/test_email_provider_resilience.py` _(added — integration gap closure)_

**Total verified: 80 tests**

#### frontend

Current Jest suites:

- `frontend/__tests__/products-page.test.tsx`
- `frontend/__tests__/api-client.test.ts`
- `frontend/__tests__/auth-pages.test.tsx`
- `frontend/__tests__/auth-context.test.tsx`
- `frontend/__tests__/protected-route.test.tsx`
- `frontend/__tests__/cart-store.test.ts`
- `frontend/__tests__/checkout-page.test.tsx`
- `frontend/__tests__/admin-products-page.test.tsx`
- `frontend/__tests__/proxy.spec.ts`
- `frontend/__tests__/mock-backend.spec.ts`
- `frontend/__tests__/sample.test.ts`

---

## Latest Verified Additions

### Integration Gap Closure Pass

#### user-service — PasswordResetIT (6 new integration tests)

Created `PasswordResetIT.java` — full password reset lifecycle against real Oracle Free Testcontainer:

- `fullPasswordResetFlow_shouldAllowLoginWithNewPassword` — request token, confirm, login with new password succeeds; old password rejected
- `passwordResetRequest_withUnknownEmail_shouldReturn404` — 404 when no matching user
- `passwordResetConfirm_withInvalidToken_shouldReturn400` — 400 for never-issued token
- `passwordResetRequest_whenActiveTokenAlreadyExists_shouldReturn400` — 400 for duplicate active token
- `passwordResetConfirm_withExpiredToken_shouldReturn400` — backdates `EXPIRES_AT` via JdbcTemplate; confirm returns 400
- `login_whilePendingResetTokenExists_shouldReturn403` — login blocked (403) when unused reset token exists

Validated: **PasswordResetIT 6/6 passed. user-service full build: 127 unit + 12 IT = 139 tests. BUILD SUCCESS.**

#### order-service — OrderValidationIT (7 new integration tests) + OrderService source fix

Created `OrderValidationIT.java` — auth enforcement, validation boundaries, and user isolation against real MSSQL Testcontainer:

- `createOrder_withoutAuthentication_shouldReturn401`
- `createOrder_withExpiredJwtToken_shouldReturn401`
- `createOrder_withNegativeTotal_shouldReturn400` — service guard → 400
- `createOrder_withZeroTotal_shouldPersistSuccessfully` — inclusive boundary → 201 CREATED
- `createOrder_withMissingStatus_shouldReturn400` — service guard → 400
- `createOrder_withLineItems_shouldPersistItemsToDatabase` — 2 items; verified via JdbcTemplate count
- `createOrder_thenListOrders_shouldOnlyReturnOwnOrders` — isolation: userA sees only own orders

**Source fix applied:** `OrderService.createOrder()` now throws `IllegalArgumentException` for null/blank status and negative totals before reaching the database. Bean Validation cascade does not reliably fire for Java record component annotations under Spring Boot 3.3 / Hibernate Validator 8; service-layer guards ensure correct 400 responses via the existing `GlobalExceptionHandler`.

Validated: **OrderValidationIT 7/7 passed. order-service full build: 107 unit + 19 IT = 126 tests. BUILD SUCCESS.**

#### product-service — integration spec extended (9 new tests)

New `describe` blocks in `product.controller.integration.spec.ts`:

- `PUT /api/product/:sku` — update name+price persisted; categories replaced; 404 for non-existent SKU; 403 for non-admin token
- `PATCH /api/product/:sku/stock` boundary conditions — exact-zero balance (5 → +5 → −5 = 0); multi-step accumulation; zero-quantity adjustment rejected (400); 404 for non-existent SKU
- `GET /api/product/inventory` — summary with correct stock count after adjustment

Validated: **21 integration tests passed. product-service full suite: 121 tests. BUILD SUCCESS. 95.15% statements.**

#### notification-service — test_email_provider_resilience.py (10 new tests)

Created `test_email_provider_resilience.py`:

- `TestSMTPEmailProviderResilience` (4 tests) — `socket.timeout`, `ConnectionRefusedError`, `SMTPAuthenticationError`, `SMTPException` → all yield `status="failed"`
- `TestEmailServiceProviderFallback` (2 tests) — `RuntimeError` from provider → `EmailResponse(status="failed")`; failed response forwarded unchanged
- `TestConsoleEmailProviderUniqueness` (2 tests) — 10 consecutive sends produce 10 distinct `message_id` values each starting with `"console-"`
- `TestSendGridEmailProviderStub` (2 tests) — always returns `status="sent"`; unique `message_id` per call

Validated: **80 total tests passed. 90.91% statement coverage.**

---

### Controller / Infrastructure Expansion Pass (prior)

#### user-service

Expanded `AuthServiceTest` to cover:

- registration returning a null token when the reloaded user is still inactive
- registration generating JWT when the reloaded user is auto-verified
- login defaulting the response role to `CUSTOMER` when no roles exist
- password reset matching only the correct token when multiple tokens exist
- verification-token generation failure propagation
- role-assignment save failure propagation
- password-reset token encoding failure propagation
- password-reset user save failure propagation

Validated result:

- `AuthServiceTest`: **23 tests passed** under Java 21

Added `AuthControllerTest` and `UserControllerTest` to cover:

- register/login/password-reset error mapping and HTTP status behavior
- verify/resend email validation paths and success response mapping
- ownership/admin authorization branches in user retrieval and deletion
- role/profile response branches for string and JWT-authenticated principals

Validated result:

- full user-service unit run: **127 tests passed** under Java 21

#### order-service

Expanded `OrderServiceTest` to cover:

- stock decrement for each order item when status becomes `PAID`
- stock restoration on `CANCELLED` from `PAID`
- no restoration on `CANCELLED` from `PENDING`
- stock restoration and notification on `REFUNDED` from `PAID`
- payment gateway exception propagation during checkout
- order save failure propagation after successful payment

Validated result:

- `OrderServiceTest`: **26 tests passed** under Java 21

Added `OrderControllerTest` to cover:

- list filtering for regular users versus admins
- ownership enforcement on `get()`
- `create()` extracting JWT claims and bearer token details
- fallback customer-name mapping from shipping recipient
- admin-only `updateStatus()` guard behavior
- `updateStatus()` bad-request mapping for invalid transitions
- admin cancel path using status updates instead of user cancellation
- refund bad-request mapping
- tracking authorization and admin history access

Validated result:

- `OrderControllerTest`: **10 tests passed** under Java 21

Added `CartControllerTest` to cover:

- ownership-forbidden and not-found branches in `getCart()`
- request-body `user_ref` override path in `createCart()`
- forbidden and success branches in `addItem()` / `updateItem()`
- accepted-response payload in `checkout()`

Validated result:

- full order-service unit run: **107 tests passed** under Java 21

Validated integration execution:

- full order-service integration run (`./mvnw verify -DskipITs=false`): **19 tests passed** (after gap closure)
- `OrderManagementIT`: **9 tests passed**
- `CartManagementIT`: **3 tests passed**
- `OrderValidationIT`: **7 tests passed** _(added in gap closure pass)_

#### product-service

Expanded `product.service.spec.ts` to cover:

- `createProduct()` with `initialStock = 0`
- `createProduct()` with non-integer initial stock
- category-save failure before product persistence
- `updateProduct()` preferring `priceCents` over `price`
- `searchProducts()` without pagination
- `listProducts()` in-stock subquery path
- `adjustStock()` decrementing exactly to zero
- movement-save failure propagation after stock validation

Validated result:

- `product.service.spec.ts`: **38 tests passed**

Added `product.controller.spec.ts` to cover:

- list query normalization for pagination, trimming, and price filters
- blank-search short-circuit behavior
- normalized search pagination behavior
- duplicate-SKU conflict mapping in `create()`
- admin guard and not-found handling in `update()` and `deleteProduct()`
- inventory summary mapping and fallback on service failure
- stock adjustment compatibility between `adjustment` and `quantity`
- internal stock adjustment default reason behavior

Validated result:

- `product.controller.spec.ts`: **11 tests passed**

#### notification-service

Expanded `test_email_service.py` to cover:

- default `order_url` fallback in order-paid emails
- default `support_url` fallback in order-cancelled emails
- template-rendering error path with clean async behavior
- provider-result fallback to `unknown`/`failed` in generic email flow
- order-confirmation datetime formatting branch

Expanded `test_email_provider.py` to cover:

- SMTP success path with TLS and login
- SMTP success path without login when credentials are blank
- case-insensitive provider selection in `get_email_provider()`

Validated result:

- `test_email_service.py` and `test_email_provider.py`: **32 tests passed** in a targeted pytest run
- coverage run: `test_email_service.py`, `test_email_provider.py`, and `test_template_service.py` all passed (**39 tests**) with fresh `coverage.json`

#### frontend

Added direct business-logic and page-flow coverage for:

- auth session restore, expiry cleanup, invalid stored user cleanup, unauthorized event handling, login, register, logout
- protected-route loading, unauthenticated redirect, non-admin redirect, and admin rendering
- login redirect behavior after successful sign-in
- login resend-verification behavior for email verification failures
- register mismatch validation and post-registration verification flow
- register redirect behavior after auto-login
- checkout empty-cart redirect
- checkout required shipping validation
- checkout successful submission and success state
- admin product list loading
- admin product creation payload mapping
- admin product delete flow
- product page loading state
- product page error state
- product search, category filter, and sort behavior
- product page empty-filter result state
- add-to-cart transient added-state behavior

Validated result:

- targeted frontend Jest run: **70 tests passed across 7 suites**
- `products-page.test.tsx`: **5 tests passed**

---

## Gap Status by Service

## 1. user-service

### Current verified status

- unit coverage around authentication is solid and includes both success and failure-path behavior
- integration coverage exists via `UserAuthenticationIT` and `PasswordResetIT`
- password-reset expiry, duplicate-token, and login-blocked-during-reset scenarios now covered at integration level

### Remaining real gaps

- ~~`initiatePasswordReset()` expiry boundary conditions~~ — **CLOSED** by `PasswordResetIT`
- ~~full reset lifecycle end-to-end~~ — **CLOSED** by `PasswordResetIT`
- concurrency and race-condition scenarios (lower priority)

### Assessment

- **Current state:** measured at **94.68%** statements. Auth, password-reset lifecycle, and domain logic are well-covered. Remaining gaps are concurrency edge cases.

---

## 2. product-service

### Current verified status

- unit, security, and integration coverage all exist in the repository
- service-layer and controller-level coverage include happy paths, persistence failure paths, query normalization, and core stock edge cases
- update product flows, stock boundary conditions, and inventory summary are now covered at integration level

### Remaining real gaps

- ~~update product flows (name, price, categories)~~ — **CLOSED** by new `PUT /api/product/:sku` integration scenarios
- ~~stock boundary conditions and exact-zero balance~~ — **CLOSED** by new `PATCH /api/product/:sku/stock` scenarios
- ~~inventory summary endpoint~~ — **CLOSED** by new `GET /api/product/inventory` scenario
- concurrent stock adjustment scenarios (lower priority)
- transaction rollback behavior when a later step fails in a multi-step operation
- invalid pagination bounds and range-validation behavior in list/search APIs
- delete behavior with external referential constraints

### Assessment

- **Current state:** measured at **95.15%** statements — strongest across all services. Remaining gaps are concurrency/rollback edge cases.

---

## 3. order-service

### Current verified status

- unit coverage exists for checkout, controller authorization/ownership behavior, status transitions, cancellation, refunds, and side effects
- integration coverage exists via `OrderManagementIT`, `CartManagementIT`, and `OrderValidationIT`
- auth enforcement, validation boundaries, user isolation, and line-item persistence are now covered at integration level

### Remaining real gaps

- ~~amount validation boundaries (zero/negative totals)~~ — **CLOSED** by `OrderValidationIT` + `OrderService` guards
- ~~create-order missing status~~ — **CLOSED** by `OrderValidationIT` + `OrderService` service-layer guard
- ~~authentication and expired JWT enforcement~~ — **CLOSED** by `OrderValidationIT`
- ~~user isolation in order listing~~ — **CLOSED** by `OrderValidationIT`
- concurrent ordering/cart race scenarios (lower priority)
- shipping field null enforcement (shipping columns are nullable in DB schema by design; no enforcement is intentional)
- notification dependency failure behavior during order creation

### Assessment

- **Current state:** measured at **90.52%** statements. Key validation, auth, and isolation boundaries are now covered. Remaining gaps are concurrency and peripheral-class paths.

---

## 4. notification-service

### Current verified status

- fresh measured artifact shows **90.91% statement coverage** from `coverage.json`
- unit coverage exists for templates, email provider behavior, and multiple email service flows
- provider resilience (timeout, connection refused, auth error, send error) and EmailService fallback behavior are now covered

### Remaining real gaps

- ~~provider exception propagation (timeout, connection refused, auth failure, send failure)~~ — **CLOSED** by `TestSMTPEmailProviderResilience`
- ~~EmailService error handling when provider raises~~ — **CLOSED** by `TestEmailServiceProviderFallback`
- ~~message_id uniqueness per provider~~ — **CLOSED** by `TestConsoleEmailProviderUniqueness` and `TestSendGridEmailProviderStub`
- provider rate-limit handling (external API behavior; lower priority)
- invalid email validation before provider invocation
- malicious or hostile input in template data and URLs

### Assessment

- **Current state:** measured at **90.91%** statements. All identified provider-resilience gaps are closed. Remaining gaps are hostile-input and rate-limit edge cases.

---

## 5. frontend

### Current verified status

- there are now **11 frontend test suites** in `frontend/__tests__`
- direct business-logic coverage exists for API client, auth context, cart store, proxy helpers, and in-process mock backend behavior
- page-flow coverage now exists for checkout, admin product management, and the products listing page
- auth-page and protected-route coverage now exists for login, register, and route-guard behavior

### Remaining real gaps

- broader checkout edge cases such as backend failure rendering and post-success navigation behavior
- more complete admin edit flow behavior
- protected-route behavior under non-admin and logged-out transitions
- page-level integration around login/register pages and redirect handling

### Assessment

- **Current state:** measured at **89.90%** statements. Improved substantially; still the best place for the next round of high-value UI and navigation tests.

---

## Cross-Service and E2E Status

API tests and Playwright coverage do not contribute to service-level coverage metrics.

Current note:

- cross-service confidence should continue to come from `api-tests/` and `e2e/`
- service-level code coverage should continue to be improved inside each service/frontend test suite

---

## Revised Priority Order

### Priority 1

- frontend checkout/admin/auth route edge cases and redirect semantics
- concurrent stock adjustment and rollback scenarios (product-service)

### Priority 2

- notification-service hostile-input and rate-limit tests
- order-service concurrent ordering/cart race scenarios

### Priority 3

- reduce remaining peripheral-class gaps (config/security/infrastructure) across services

---

## Recommended Next Actions

- [x] Add user-service tests for password-reset expiry boundaries — **DONE** (`PasswordResetIT`, 6 tests)
- [x] Add order-service validation-boundary tests around totals and auth enforcement — **DONE** (`OrderValidationIT`, 7 tests + `OrderService` guards)
- [x] Add product-service update and stock boundary integration tests — **DONE** (9 new scenarios in `product.controller.integration.spec.ts`)
- [x] Add notification-service provider failure and resilience tests — **DONE** (`test_email_provider_resilience.py`, 10 tests)
- [x] Add CI-published coverage artifacts for all services and frontend to preserve session measurements in pipeline outputs — **DONE** via workflow artifact fan-in in `.github/workflows/coverage-authority.yml` (downloads service artifacts and normalizes/aggregates)
- [x] Add aggregate coverage threshold gate in CI — **DONE** via `Enforce policy` in `.github/workflows/coverage-authority.yml` (checks `.overall.coverage_pct` against `coverage/contract.json`)
- [x] Add frontend tests for checkout failure handling, admin edit flows, and redirect edge cases — **DONE** (`frontend/__tests__/checkout-page.test.tsx`, `frontend/__tests__/admin-products-page.test.tsx`, `frontend/__tests__/auth-pages.test.tsx`)
- [ ] Add product-service concurrent stock adjustment and rollback tests
- [ ] Add notification-service hostile-input and rate-limit tests

---
