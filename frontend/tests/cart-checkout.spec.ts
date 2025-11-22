import { test, expect } from '@playwright/test';

test.describe('Cart -> Checkout (Phase 2 smoke)', () => {
  test('can place a mock order', async ({ page }) => {
    // Navigate to the cart stub page
    await page.goto('http://localhost:3000/cart');
    await page.getByRole('button', { name: 'Checkout (mock)' }).click();
    await expect(page.locator('text=Order placed')).toBeVisible({ timeout: 5000 });
  });
});
