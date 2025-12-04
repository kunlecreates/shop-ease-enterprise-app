import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // `working-directory` in the CI job is `frontend`, so make paths relative to that
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
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
    baseURL: process.env.API_BASE_URL || 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
