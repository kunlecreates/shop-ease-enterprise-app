# Phase 2 Acceptance — Order Service

This file documents the Phase 2 acceptance criteria for the Order Service (shopping cart + mock checkout) and how to run the verification steps locally.

Acceptance checklist

- [x] Shopping cart domain object implemented (`Cart`, `Order`).
- [x] Checkout flow implemented in `OrderService.processCheckout`.
- [x] Mock payment adapter present (`MockPaymentService`).
- [x] Unit tests for checkout success and payment-failure added.
- [x] Flyway test migration for `ORDERS` table added to `services/test-utils` so integration tests have the schema.
- [x] Minimal OpenAPI skeleton for cart/checkout added (`openapi.yaml`).

How to run verification locally

1. Run unit tests for order-service:

```bash
./services/order-service/mvnw -f services/order-service/pom.xml test
```

2. Run integration tests (requires a Postgres instance or Testcontainers):

```bash
# Using Testcontainers via mvn verify (integration tests named *IT)
./services/order-service/mvnw -f services/order-service/pom.xml verify
```

3. Playwright E2E (frontend) — not yet implemented. See repo `frontend/` for TODO.

Notes

- The `MockPaymentService` is intentionally simple — replace with a real payment adapter when moving beyond MVP.
- CI should run the `integration-tests.yml` umbrella workflow which builds `test-utils` and installs migrations used by the integration suite.
