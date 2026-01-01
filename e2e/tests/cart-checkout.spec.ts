import { test, expect } from '@playwright/test';

test.describe('Cart -> Checkout (Phase 2 smoke)', () => {
  test('can place a mock order', async ({ page }) => {
    // Allow the API backend URL to be injected via env for CI
    const apiBase = process.env.API_BASE_URL || process.env.E2E_BASE_URL || '';

    // Proxy any frontend-origin API calls to the real backend (useful when frontend runs on 3000)
    await page.route('**/api/**', async route => {
      const req = route.request();
      // build target URL by replacing origin with API base
      const target = req.url().replace(/^https?:\/\/[^/]+/, apiBase);
      const headers = req.headers();
      const method = req.method();
      const postData = req.postData();

      const response = await page.request.fetch(target, {
        method,
        headers,
        data: postData
      });

      const body = await response.body();
      const resHeaders = {} as Record<string,string>;
      for (const [k,v] of Object.entries(response.headers())) resHeaders[k] = String(v);

      await route.fulfill({
        status: response.status(),
        headers: resHeaders,
        body
      });
    });

    // Navigate to the cart page; rely on Playwright baseURL in config.
    await page.goto('/cart');
    await page.getByRole('button', { name: 'Checkout (mock)' }).click();
    await expect(page.locator('text=Order placed')).toBeVisible({ timeout: 5000 });
  });
});
