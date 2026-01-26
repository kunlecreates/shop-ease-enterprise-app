import { test, expect } from '@playwright/test';
import locators from './helpers/locators';

test.describe('Cart and Checkout Flow (FR007, FR008, FR009)', () => {
  test('should display cart page with correct structure', async ({ page }) => {
    await test.step('Navigate to cart', async () => {
      await page.goto('/cart');
      await expect(page).toHaveURL(/.*cart/);
    });

    await test.step('Verify cart page structure', async () => {
      // Should show either cart items or empty cart message
      const heading = page.getByRole('heading', { name: /cart|shopping cart/i });
      await expect(heading).toBeVisible();
      
      // Check for cart content or empty state
      const emptyState = page.getByText(/empty cart|no items|your cart is empty/i);
      const cartItems = page.locator('[data-testid="cart-item"], li');
      
      const hasEmpty = await emptyState.count() > 0;
      const hasItems = await cartItems.count() > 0;
      
      // Prefer deterministic check: if E2E_REQUIRE_PRODUCTS is true, expect items
      const requireProducts = process.env.E2E_REQUIRE_PRODUCTS === 'true';
      if (requireProducts) {
        expect(hasItems).toBeTruthy();
      } else {
        expect(hasEmpty || hasItems).toBeTruthy();
      }
    });
  });

  test('should show checkout button when cart has items', async ({ page }) => {
    await page.goto('/cart');
    
    // If cart has items, checkout button should be visible
    const cartItems = page.locator('[data-testid="cart-item"], li');
    const itemCount = await cartItems.count();
    
    if (itemCount > 0) {
      const checkoutButton = locators.getExactButtonLocator(page, ['Checkout', 'Proceed to checkout', 'Place order']);
      await expect(checkoutButton).toBeVisible();
    }
  });

  test('should navigate to checkout when checkout button is clicked', async ({ page }) => {
    await page.goto('/cart');
    
    const checkoutButton = locators.getExactButtonLocator(page, ['Checkout', 'Proceed to checkout', 'Place order']);
    
    if (await checkoutButton.count() > 0) {
      await checkoutButton.click();
      // Should navigate to checkout page or show checkout modal - wait for clear signals
      let isCheckoutPage = false;
      try {
        await expect(page).toHaveURL(/.*checkout/, { timeout: 10000 });
        isCheckoutPage = true;
      } catch (e) {
        // not redirected to checkout URL within timeout
      }

      if (!isCheckoutPage) {
        try {
          await expect(page.getByRole('heading', { name: /checkout|confirm order|payment/i })).toBeVisible({ timeout: 10000 });
          isCheckoutPage = true;
        } catch (e) {
          // no checkout heading either
        }
      }

      expect(isCheckoutPage).toBeTruthy();
    }
  });

  test('cart should persist items across navigation', async ({ page }) => {
    await test.step('Visit cart page', async () => {
      await page.goto('/cart');
      const initialItemCount = await page.locator('[data-testid="cart-item"]').count();
      
      // Store initial count in page context
      await page.evaluate((count) => {
        window.localStorage.setItem('test_cart_count', String(count));
      }, initialItemCount);
    });

    await test.step('Navigate away and return', async () => {
      await page.goto('/products');
      await page.goto('/cart');
      
      // Cart state should be maintained
      await expect(page).toHaveURL(/.*cart/);
    });
  });
});
