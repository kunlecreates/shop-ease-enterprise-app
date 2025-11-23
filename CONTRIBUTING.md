# Contributing

Thanks for contributing to this repository. This file includes a short note about the Playwright smoke CI and how to run tests locally.

## Playwright smoke CI
- Playwright smoke tests are configured to run for `develop` and `release/*` branches.
- For PRs targeting `develop`/`release/*`, the workflow will run as well, but by default **PRs** use the included mock backend to keep CI fast and isolated.
- Repository admins can enable real-container integration smoke runs by adding the `API_IMAGE` secret (and optional DB secrets) — see `docs/CI-playwright.md` for full details.

## Running Playwright locally
1. Start the mock backend (fast):

```bash
cd frontend/mock-backend
npm install
npm start
# mock available at http://localhost:4000/health
```

2. Start the frontend dev server in another terminal:

```bash
cd frontend
npm install
npm run dev
# frontend at http://localhost:3000
```

3. Run Playwright tests:

```bash
cd frontend
npx playwright test tests/cart-checkout.spec.ts --project=chromium
```

See `docs/CI-playwright.md` for more CI-specific notes and secret names.
