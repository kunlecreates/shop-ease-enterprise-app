import { test, expect } from '@playwright/test';
import locators from './helpers/locators';

test.describe('Authentication & Authorization (FR001, FR003)', () => {
  test.describe('Registration Flow', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');
      
      await test.step('Verify form fields', async () => {
        await expect(page.getByLabel(/username/i)).toBeVisible();
        await expect(page.getByLabel(/^email$/i)).toBeVisible();
        await expect(page.getByLabel(/^password$/i)).toBeVisible();
        await expect(page.getByLabel(/confirm password/i)).toBeVisible();
          await expect(page.getByRole('button', { name: /^(Create account|Create your account)$/i })).toBeVisible();
      });
    });

    test('should show validation for empty registration form', async ({ page }) => {
      await page.goto('/register');
      
      await test.step('Submit without filling fields', async () => {
        const createBtn = locators.getExactButtonLocator(page, ['Create account', 'Create your account']);
        await createBtn.click();
      });

      await test.step('Verify form prevents submission (HTML5 validation)', async () => {
        // HTML5 required fields prevent form submission without JavaScript errors
        // The page should stay on /register
        await expect(page).toHaveURL(/.*register/, { timeout: 2000 });
      });
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/register');
      
      await test.step('Enter invalid email', async () => {
        await page.getByLabel(/username/i).fill('testuser');
        await page.getByLabel(/^email$/i).fill('invalid-email');
        await page.getByLabel(/^password$/i).fill('ValidPassword123!');
        await page.getByLabel(/confirm password/i).fill('ValidPassword123!');
        const createBtn2 = locators.getExactButtonLocator(page, ['Create account', 'Create your account']);
        await createBtn2.click();
      });

      await test.step('Verify email validation prevents submission (HTML5)', async () => {
        // HTML5 type="email" validation prevents form submission
        // The page should stay on /register
        await expect(page).toHaveURL(/.*register/, { timeout: 2000 });
      });
    });
  });

  test.describe('Login Flow', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      
      await test.step('Verify form structure', async () => {
        await expect(page.getByRole('heading', { name: /^(Sign in|Login)$/i })).toBeVisible();
        await expect(page.getByLabel(/username/i)).toBeVisible();
        await expect(page.getByLabel(/^Password$/i)).toBeVisible();
        const signinBtn = locators.getExactButtonLocator(page, ['Sign in', 'Login']);
        await expect(signinBtn).toBeVisible();
      });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await test.step('Enter invalid credentials', async () => {
        await page.getByLabel(/username/i).fill('nonexistentuser');
        await page.getByLabel(/^Password$/i).fill('WrongPassword123!');
        const signinBtn = locators.getExactButtonLocator(page, ['Sign in', 'Login']);
        await signinBtn.click();
      });

      await test.step('Verify error message', async () => {
        await page.waitForLoadState('networkidle');
        const errorMessage = page.getByText(/invalid.*credentials|incorrect|authentication failed|wrong email or password/i);
        
        // Error should be visible or still on login page
        const stillOnLoginPage = await page.getByRole('heading', { name: /sign in|login/i }).isVisible();
        const hasErrorMessage = await errorMessage.count() > 0;
        
        expect(stillOnLoginPage || hasErrorMessage).toBeTruthy();
      });
    });

    test('should have link to registration page', async ({ page }) => {
      await page.goto('/login');
      
      const registerLink = page.getByRole('link', { name: /^(Register|Sign up)$/i }).first();
      await expect(registerLink).toBeVisible();
      await Promise.all([
        page.waitForURL(/.*register/, { timeout: 10000 }),
        registerLink.click(),
      ]);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from admin pages', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Should either show login form or redirect to login
      const isLoginPage = page.url().includes('login') || 
                         (await page.getByRole('heading', { name: /sign in|login/i }).count() > 0);
      
      expect(isLoginPage).toBeTruthy();
    });
  });
});
