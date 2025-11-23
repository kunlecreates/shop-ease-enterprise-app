# Playwright Smoke CI — Secrets and Usage

This document describes the repository secrets, example values, and how the Playwright smoke workflow behaves.

## What the workflow does
- Starts the frontend dev server (`frontend`) and runs Playwright smoke tests.
- On `develop` and `release/*` branches the workflow can run the application against real prebuilt containers (recommended for integration smoke runs).
- For other branches and PRs not targeting `develop`/`release/*`, the workflow uses the included mock backend (fast, isolated).

## Repository secrets (add these in GitHub → Settings → Secrets and variables → Actions)

- `API_IMAGE` (required to enable the real-container path on `develop`/`release/*`)
  - Example: `ghcr.io/your-org/order-service:ci-latest`
  - When set, the workflow will `docker pull` this image and run it at `http://localhost:8080` for Playwright tests.

- `API_DB_IMAGE` (optional)
  - Example: `postgres:15-alpine`
  - When provided, the workflow will pull and run this DB in a Docker network named `test-network` and run the API image attached to it.

- `API_DB_USER` (optional)
  - Example: `test` (default if unset)

- `API_DB_PASSWORD` (optional)
  - Example: `very-secret-password` (default `test` if unset)

- `API_DB_NAME` (optional)
  - Example: `shop_test` (default if unset)

## How the workflow chooses backend
- If `API_IMAGE` is present and the workflow is running on `develop` or `release/*`, the real-container path is used and `API_BASE_URL` is set to `http://localhost:8080`.
- Otherwise, the workflow runs the bundled mock backend at `http://localhost:4000` and `API_BASE_URL` is set to that URL.

## Recommended secret creation (GH CLI)
Replace example values before running.

```bash
gh secret set API_IMAGE --body "ghcr.io/your-org/order-service:ci-latest" --repo <owner>/<repo>
gh secret set API_DB_IMAGE --body "postgres:15-alpine" --repo <owner>/<repo>
gh secret set API_DB_USER --body "test" --repo <owner>/<repo>
gh secret set API_DB_PASSWORD --body "very-secret-password" --repo <owner>/<repo>
gh secret set API_DB_NAME --body "shop_test" --repo <owner>/<repo>
```

Or use the GitHub UI: Repository → Settings → Secrets and variables → Actions → New repository secret.

## Local reproduction (developer machine)
1. Start the mock backend (fast):

```bash
cd frontend/mock-backend
npm install
npm start
# mock should be available at http://localhost:4000/health
```

2. In a separate terminal, start the frontend dev server:

```bash
cd frontend
npm install
npm run dev
# frontend at http://localhost:3000
```

3. Run Playwright tests locally (it will default to `API_BASE_URL=http://localhost:4000`):

```bash
cd frontend
npx playwright test tests/cart-checkout.spec.ts --project=chromium
```

## Notes & troubleshooting
- Ensure your API image expects DB env vars named `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD` when run attached to the `test-network`.
- If the workflow can't reach `http://localhost:8080/health`, the job will fail waiting for health; check container logs.
- The Playwright reports (HTML) are uploaded as an artifact named `playwright-smoke-report` under Actions → Workflow run → Artifacts.

If you want changes to these defaults (different env var names, DB image, or branch policy), tell me and I will update the workflow and docs.
