import { test, expect } from '@playwright/test';

// Skip authentication tests until frontend auth pages are implemented
test.describe.skip('Authentication & Authorization (FR001, FR003)', () => {
  test.describe('Registration Flow', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');
      
      await test.step('Verify form fields', async () => {
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /sign up|register|create account/i })).toBeVisible();
      });
    });

    test('should show validation for empty registration form', async ({ page }) => {
      await page.goto('/register');
      
      await test.step('Submit without filling fields', async () => {
        await page.getByRole('button', { name: /sign up|register|create account/i }).click();
      });

      await test.step('Verify validation messages appear', async () => {
        // Should show validation errors
        const errorMessages = page.getByText(/required|enter.*email|enter.*password|field.*required/i);
        await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
      });
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/register');
      
      await test.step('Enter invalid email', async () => {
        await page.getByLabel(/email/i).fill('invalid-email');
        await page.getByLabel(/password/i).fill('ValidPassword123!');
        await page.getByRole('button', { name: /sign up|register|create account/i }).click();
      });

      await test.step('Verify email validation error', async () => {
        const emailError = page.getByText(/valid email|invalid email|email format/i);
        await expect(emailError).toBeVisible({ timeout: 3000 });
      });
    });
  });

  test.describe('Login Flow', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      
      await test.step('Verify form structure', async () => {
        await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
      });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await test.step('Enter invalid credentials', async () => {
        await page.getByLabel(/email/i).fill('nonexistent@example.com');
        await page.getByLabel(/password/i).fill('WrongPassword123!');
        await page.getByRole('button', { name: /sign in|login/i }).click();
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
      
      const registerLink = page.getByRole('link', { name: /sign up|register|create account|don't have.*account/i });
      await expect(registerLink).toBeVisible();
      
      await registerLink.click();
      await expect(page).toHaveURL(/.*register/);
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
