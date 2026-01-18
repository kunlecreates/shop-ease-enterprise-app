# ShopEase API Contract Tests

This directory contains **cross-service API contract tests** that validate service-to-service communication via HTTP against a deployed environment (staging/preview).

> **Important**: These are **API tests**, not integration tests. They run **AFTER** Kubernetes deployment. For integration tests with real databases that run **BEFORE** deployment, see each service's test directory (e.g., `UserControllerIT.java`).

Structure:
- `framework/` — test helpers and infra.
- `contracts/` — service-to-service contract tests.
- `flows/` — business workflow tests (customer checkout, admin flows).
- `observability/` — trace/metrics propagation checks.
- `env/` — sample environment files for local/CI/staging.

Run locally:

1. Copy an env file: `cp env/local.env .env`
2. Install dependencies: `npm ci` (run from this folder)
3. Run tests: `npm test`

Tests are written with Jest + TypeScript. Tests will skip automatically if `E2E_BASE_URL` is not set.
