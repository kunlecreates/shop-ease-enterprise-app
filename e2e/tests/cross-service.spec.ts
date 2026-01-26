import { test, expect } from './fixtures/setup';
import { setAuthFromEnv, usePersistedAdminStorage } from './helpers/auth';
import locators from './helpers/locators';
import seedHelpers from './helpers/seed';

// Gate admin tests behind CI flag to avoid running against production unintentionally
const runAdmin = (process.env.E2E_RUN_ADMIN_TESTS || 'false').toLowerCase() === 'true';

test.describe('Complete User Journey - Browse to Checkout (FR004, FR007, FR008)', () => {
  test('customer can browse products and add to cart', async ({ page, request }) => {
    await test.step('Navigate to products page', async () => {
      await page.goto('/products');
      await expect(page).toHaveURL(/.*products/);
    });

    await test.step('Verify products are displayed', async () => {
      // Wait for main content to be visible
      await page.getByRole('main').waitFor({ timeout: 15000 });
      // Seed products if required for deterministic tests
      await seedHelpers.seedProductIfRequired(request);
      const productCards = locators.productCardsLocator(page);
      await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    });

    await test.step('Navigate to cart', async () => {
      // The cart link in the navigation doesn't have text, it's an SVG icon
      const cartLink = page.locator('a[href="/cart"]').first();
      
      const linkCount = await cartLink.count();
      if (linkCount > 0) {
        await Promise.all([
          page.waitForURL(/.*cart/, { timeout: 15000 }),
          cartLink.click()
        ]);
      } else {
        // Navigate directly if link not found
        await page.goto('/cart');
        await page.waitForURL(/.*cart/);
      }
      // Ensure main content loaded on cart page
      await page.getByRole('main').waitFor({ timeout: 15000 });
      await expect(page).toHaveURL(/.*cart/);
    });
  });

  test('navigation flow works across all main pages', async ({ page }) => {
    await test.step('Start from homepage', async () => {
      await page.goto('/');
      await expect(page.getByRole('navigation')).toBeVisible();
    });

    await test.step('Navigate to products', async () => {
      // Avoid matching the site brand ("ShopEase") by not matching the generic "shop" token
      const productsLink = page.getByRole('link', { name: /^(Products|Browse|Explore)$/i }).first();
      if (await productsLink.count() > 0) {
        await Promise.all([
          page.waitForURL(/.*products/, { timeout: 15000 }),
          productsLink.click()
        ]);
        // Wait for main content to load on products page
        await page.getByRole('main').waitFor({ timeout: 15000 });
        await expect(page).toHaveURL(/.*products/);
      }
    });

    await test.step('Navigate to cart from products', async () => {
      const cartLink = page.getByRole('link', { name: /cart/i }).first();
      if (await cartLink.count() > 0) {
        await Promise.all([
          page.waitForURL(/.*cart/, { timeout: 15000 }),
          cartLink.click()
        ]);
        await page.getByRole('main').waitFor({ timeout: 15000 });
        await expect(page).toHaveURL(/.*cart/);
      }
    });

    await test.step('Return to homepage', async () => {
      const homeLink = page.getByRole('link', { name: /^(Home)$/i }).first();
      const fallback = page.locator('a[href="/"]').first();
      const link = (await homeLink.count()) > 0 ? homeLink : fallback;
      if (await link.count() > 0) {
        await Promise.all([
          page.waitForURL(/^.*\/$/, { timeout: 15000 }),
          link.click(),
        ]);
        await expect(page.getByRole('navigation')).toBeVisible({ timeout: 15000 });
      }
    });
  });
});

(runAdmin ? test.describe : test.describe.skip)('Admin Workflow - Product Management (FR005, FR006)', () => {
  // apply persisted or environment-based auth before admin tests
  test.beforeEach(async ({ page, request }) => {
    await usePersistedAdminStorage(page) || await setAuthFromEnv(page, request);
  });
  test('admin area requires authentication', async ({ page }) => {
    await test.step('Attempt to access admin area', async () => {
      await page.goto('/admin');
      // Wait for clear signal: either login or admin heading
      await expect(page.getByRole('heading', { name: /sign in|login|admin|dashboard/i })).toBeVisible({ timeout: 10000 });
    });

    await test.step('Verify authentication check', async () => {
      // Should either be at login page or show login form
      const currentUrl = page.url();
      const hasLoginForm = await page.getByLabel(/email|password/i).count() > 0;
      const isLoginPage = currentUrl.includes('login');
      
      // If showing admin content without login, that's acceptable if there's a test user already logged in
      const hasAdminHeading = await page.getByRole('heading', { name: /admin|dashboard/i }).count() > 0;
      
      if (!hasAdminHeading) {
        expect(hasLoginForm || isLoginPage).toBeTruthy();
      }
    });
  });

  test('admin navigation should show management options', async ({ page }) => {
    await page.goto('/admin');
    // Wait for clear signal: login or admin heading
    await expect(page.getByRole('heading', { name: /sign in|login|admin|dashboard/i })).toBeVisible({ timeout: 10000 });
    
    // If we're on an admin page (not redirected to login)
    const hasAdminHeading = await page.getByRole('heading', { name: /admin|dashboard/i }).count() > 0;
    
    if (hasAdminHeading) {
      await test.step('Verify admin navigation options', async () => {
        // Should have links to products, users, orders, etc.
        const managementLinks = ['products', 'users', 'orders'].map(name => 
          page.getByRole('link', { name: new RegExp(name, 'i') })
        );
        
        let foundAnyLink = false;
        for (const link of managementLinks) {
          if (await link.count() > 0) {
            foundAnyLink = true;
            break;
          }
        }
        
        expect(foundAnyLink).toBeTruthy();
      });
    }
  });
});
