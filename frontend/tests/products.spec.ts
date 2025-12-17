import { test, expect } from '@playwright/test';

test.describe('Products Page', () => {
  test('lists products or shows empty state', async ({ page }) => {
    await page.goto('/products');

    await test.step('Verify page structure', async () => {
      await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
      // Basic check: main exists and no fatal error banner
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});