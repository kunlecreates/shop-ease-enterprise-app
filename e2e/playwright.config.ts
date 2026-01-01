import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Global setup injects a CF_Authorization cookie into a storage state
  // when `CF_AUTH_COOKIE` is provided by CI (workflow exposes it).
  globalSetup: './global-setup',
  testDir: './tests',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
  ],
  use: {
    headless: true,
    actionTimeout: 0,
    // E2E tests must run against the deployed environment; set E2E_BASE_URL in CI
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    // If global-setup wrote an auth storage file, Playwright will reuse it.
    storageState: process.env.CF_AUTH_COOKIE ? './.auth.json' : undefined,
    // If CF_ACCESS_TOKEN is provided by the workflow, add it as an extra header
    extraHTTPHeaders: process.env.CF_ACCESS_TOKEN ? { 'cf-access-token': process.env.CF_ACCESS_TOKEN } : undefined,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
