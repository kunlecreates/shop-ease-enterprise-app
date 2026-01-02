# Integration Tests

This directory contains cross-service integration tests (API + events) that run against a deployed environment.

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
