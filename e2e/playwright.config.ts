import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Playwright will include Cloudflare Access client headers when provided by CI.
  testDir: './tests',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  globalTeardown: require.resolve('./global-teardown'),
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    headless: true,
    actionTimeout: 0,
    // E2E tests must run against the deployed environment; set E2E_BASE_URL in CI
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    /**
     * Cloudflare Access service token headers
     * Automatically applied to:
     * - page.goto()
     * - asset requests
     * - XHR / fetch
     */
    extraHTTPHeaders: (() => {
      const headers: Record<string, string> = {};
      if (process.env.CF_ACCESS_CLIENT_ID) headers['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID;
      if (process.env.CF_ACCESS_CLIENT_SECRET) headers['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET;
      return Object.keys(headers).length ? headers : undefined;
    })(),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Mobile project for responsive/navigation checks
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
});
