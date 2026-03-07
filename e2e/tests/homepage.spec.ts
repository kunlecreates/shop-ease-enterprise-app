import { test, expect } from '@playwright/test';

test.describe('Homepage (/)  — ShopEase storefront', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test.describe('Hero section', () => {
    test('displays the main hero heading with brand copy', async ({ page }) => {
      await test.step('Verify hero heading is visible', async () => {
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Premium groceries',
        );
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'delivered fresh',
        );
      });
    });

    test('"Browse products" CTA link navigates to /products', async ({ page }) => {
      await test.step('Click the primary CTA link in the hero', async () => {
        // Use first() to target the hero-section copy specifically
        const link = page.getByRole('link', { name: 'Browse products' }).first();
        await expect(link).toBeVisible();
        await link.click();
        await expect(page).toHaveURL(/.*products/);
      });
    });

    test('"Create free account" link navigates to /register', async ({ page }) => {
      await test.step('Click the secondary CTA link in the hero', async () => {
        const link = page.getByRole('link', { name: 'Create free account' });
        await expect(link).toBeVisible();
        await link.click();
        await expect(page).toHaveURL(/.*register/);
      });
    });

    test('stats panel shows the four headline figures', async ({ page }) => {
      await test.step('Verify stat values are rendered', async () => {
        await expect(page.getByText('10,000+')).toBeVisible();
        await expect(page.getByText('50,000+')).toBeVisible();
        await expect(page.getByText('Same-day')).toBeVisible();
        await expect(page.getByText('24 / 7')).toBeVisible();
      });
    });

    test('stats panel shows the correct labels', async ({ page }) => {
      await test.step('Verify stat labels are rendered', async () => {
        await expect(page.getByText('Products in catalogue')).toBeVisible();
        await expect(page.getByText('Happy customers')).toBeVisible();
        await expect(page.getByText('Delivery available')).toBeVisible();
        await expect(page.getByText('Customer support')).toBeVisible();
      });
    });
  });

  test.describe('Trust strip', () => {
    test('displays all four trust badges', async ({ page }) => {
      await test.step('Verify trust strip items', async () => {
        await expect(page.getByText('Secure checkout')).toBeVisible();
        await expect(page.getByText('100% satisfaction guarantee')).toBeVisible();
        await expect(page.getByText('Free shipping on orders over $50')).toBeVisible();
        await expect(page.getByText('Sourced from local farms')).toBeVisible();
      });
    });
  });

  test.describe('Features section', () => {
    test('shows the "Why ShopEase" section heading', async ({ page }) => {
      await test.step('Verify features section heading is visible', async () => {
        await expect(
          page.getByRole('heading', {
            name: 'A smarter way to shop for groceries',
          }),
        ).toBeVisible();
      });
    });

    test('renders all six feature tiles by title', async ({ page }) => {
      const titles = [
        'Farm-fresh produce',
        'Same-day delivery',
        'Quality guaranteed',
        'In-store location finder',
        'Transparent pricing',
        '24/7 live support',
      ];

      await test.step('Verify each feature title is visible', async () => {
        for (const title of titles) {
          await expect(page.getByRole('heading', { name: title })).toBeVisible();
        }
      });
    });
  });

  test.describe('Testimonials section', () => {
    test('shows the testimonials heading', async ({ page }) => {
      await test.step('Verify testimonials section heading', async () => {
        await expect(
          page.getByRole('heading', { name: 'Trusted by thousands of households' }),
        ).toBeVisible();
      });
    });

    test('renders three customer testimonials', async ({ page }) => {
      await test.step('Verify customer names appear', async () => {
        await expect(page.getByText('Sarah M.')).toBeVisible();
        await expect(page.getByText('James O.')).toBeVisible();
        await expect(page.getByText('Priya L.')).toBeVisible();
      });
    });
  });

  test.describe('Final CTA section', () => {
    test('shows "Ready to shop smarter?" heading', async ({ page }) => {
      await test.step('Verify CTA heading is visible', async () => {
        await expect(
          page.getByRole('heading', { name: 'Ready to shop smarter?' }),
        ).toBeVisible();
      });
    });

    test('CTA "Browse products" link navigates to /products', async ({ page }) => {
      await test.step('Click CTA Browse products link', async () => {
        // The CTA section Browse products link is the last one on the page
        const links = page.getByRole('link', { name: 'Browse products' });
        // Use last() to target the CTA link at bottom
        await expect(links.last()).toBeVisible();
        await links.last().click();
        await expect(page).toHaveURL(/.*products/);
      });
    });

    test('CTA "Create an account" link navigates to /register', async ({ page }) => {
      await test.step('Click CTA Create an account link', async () => {
        const link = page.getByRole('link', { name: 'Create an account' });
        await expect(link).toBeVisible();
        await link.click();
        await expect(page).toHaveURL(/.*register/);
      });
    });
  });
});
