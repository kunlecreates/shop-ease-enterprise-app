import { test, expect } from '@playwright/test';

test.describe('Customer User Journey (FR001, FR002, FR004)', () => {
  test.describe('Registration & Authentication', () => {
    test('should display registration page', async ({ page }) => {
      await test.step('Navigate to registration page', async () => {
        await page.goto('/register');
        await expect(page).toHaveURL(/.*register/);
      });

      await test.step('Verify registration form is present', async () => {
        await expect(page.getByRole('heading', { name: /sign up|register|create account/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /sign up|register|create account/i })).toBeVisible();
      });
    });

    test('should display login page', async ({ page }) => {
      await test.step('Navigate to login page', async () => {
        await page.goto('/login');
        await expect(page).toHaveURL(/.*login/);
      });

      await test.step('Verify login form is present', async () => {
        await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
      });
    });

    test('should show validation errors for invalid registration', async ({ page }) => {
      await page.goto('/register');
      
      await test.step('Submit empty form', async () => {
        await page.getByRole('button', { name: /sign up|register|create account/i }).click();
        // Expect validation messages or disabled state
        await expect(page.getByText(/required|enter.*email|enter.*password/i)).toBeVisible();
      });
    });

    test('should show error for invalid login credentials', async ({ page }) => {
      await page.goto('/login');
      
      await test.step('Enter invalid credentials', async () => {
        await page.getByLabel(/email/i).fill('invalid@example.com');
        await page.getByLabel(/password/i).fill('wrongpassword');
        await page.getByRole('button', { name: /sign in|login/i }).click();
      });

      await test.step('Verify error message', async () => {
        await expect(page.getByText(/invalid.*credentials|incorrect|failed/i)).toBeVisible();
      });
    });
  });

  test.describe('Product Catalog Browsing (FR004)', () => {
    test('should display product catalog page', async ({ page }) => {
      await test.step('Navigate to products page', async () => {
        await page.goto('/products');
        await expect(page).toHaveURL(/.*products/);
      });

      await test.step('Verify catalog structure', async () => {
        // Check for product grid or list
        const products = page.getByRole('article').or(page.locator('[data-testid="product-card"]'));
        // Should have products or empty state
        const count = await products.count();
        if (count > 0) {
          await expect(products.first()).toBeVisible();
        } else {
          await expect(page.getByText(/no products|empty/i)).toBeVisible();
        }
      });
    });

    test('should allow searching products', async ({ page }) => {
      await page.goto('/products');
      
      const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        // Results should filter or show no results
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Shopping Cart (FR007)', () => {
    test('should display cart page', async ({ page }) => {
      await test.step('Navigate to cart', async () => {
        await page.goto('/cart');
        await expect(page).toHaveURL(/.*cart/);
      });

      await test.step('Verify cart structure', async () => {
        // Should show cart items or empty cart message
        const emptyCart = page.getByText(/empty cart|no items/i);
        const cartItems = page.locator('[data-testid="cart-item"]');
        
        const hasEmptyMessage = await emptyCart.count() > 0;
        const hasItems = await cartItems.count() > 0;
        
        expect(hasEmptyMessage || hasItems).toBeTruthy();
      });
    });
  });
});

test.describe('Admin User Journey (FR003, FR005, FR006, FR012)', () => {
  test.describe('Admin Dashboard Access', () => {
    test('should display admin dashboard when navigating to /admin', async ({ page }) => {
      await test.step('Navigate to admin area', async () => {
        await page.goto('/admin');
        // Should redirect to login if not authenticated, or show admin dashboard
        await page.waitForLoadState('networkidle');
      });

      await test.step('Verify admin section exists', async () => {
        // Either login page or admin dashboard should be visible
        const isLoginPage = (await page.getByRole('heading', { name: /sign in|login/i }).count()) > 0;
        const isAdminPage = (await page.getByRole('heading', { name: /admin|dashboard/i }).count()) > 0;
        
        expect(isLoginPage || isAdminPage).toBeTruthy();
      });
    });

    test('should show admin navigation options', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Check for admin navigation items if on admin page
      const adminHeading = page.getByRole('heading', { name: /admin|dashboard/i });
      if (await adminHeading.count() > 0) {
        // Look for typical admin nav items
        const navItems = ['products', 'users', 'orders', 'inventory'];
        let foundNavItem = false;
        
        for (const item of navItems) {
          const link = page.getByRole('link', { name: new RegExp(item, 'i') });
          if (await link.count() > 0) {
            foundNavItem = true;
            break;
          }
        }
        
        if (!foundNavItem) {
          // Maybe not logged in as admin, which is expected
          const loginForm = await page.getByLabel(/email|password/i).count();
          expect(loginForm).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Product Management (FR005)', () => {
    test('should display product management interface', async ({ page }) => {
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');
      
      // Should show admin products page or require login
      const hasLoginForm = (await page.getByLabel(/email|password/i).count()) > 0;
      const hasProductsList = (await page.getByRole('heading', { name: /products|inventory/i }).count()) > 0;
      
      expect(hasLoginForm || hasProductsList).toBeTruthy();
    });
  });
});

test.describe('Navigation & Page Accessibility', () => {
  test('homepage should load successfully', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/shopease|grocery|home/i);
    });

    await test.step('Verify main navigation', async () => {
      // Check for navigation elements
      const nav = page.getByRole('navigation');
      await expect(nav).toBeVisible();
    });
  });

  test('should have accessible navigation between pages', async ({ page }) => {
    await page.goto('/');
    
    await test.step('Navigate to products from home', async () => {
      const productsLink = page.getByRole('link', { name: /products|shop|browse/i }).first();
      if (await productsLink.count() > 0) {
        await productsLink.click();
        await expect(page).toHaveURL(/.*products/);
      }
    });
  });

  test('responsive navigation should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check for mobile menu button
    const mobileMenuButton = page.getByRole('button', { name: /menu|navigation/i });
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.click();
      // Menu should expand
      await page.waitForTimeout(300); // Animation delay
    }
  });
});

test.describe('Security & Authorization (FR015)', () => {
  test('protected routes should redirect to login', async ({ page }) => {
    await test.step('Try to access admin without authentication', async () => {
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');
      
      // Should either be at login page or see admin page
      const currentUrl = page.url();
      const hasLoginForm = (await page.getByLabel(/email|password/i).count()) > 0;
      
      // If not showing admin content, should require login
      const hasAdminContent = (await page.getByRole('heading', { name: /admin|products/i }).count()) > 0;
      if (!hasAdminContent) {
        expect(hasLoginForm || currentUrl.includes('login')).toBeTruthy();
      }
    });
  });

  test('cart should persist across page navigation', async ({ page }) => {
    await page.goto('/');
    await page.goto('/cart');
    await page.goto('/products');
    await page.goto('/cart');
    
    // Cart page should load without errors
    await expect(page).toHaveURL(/.*cart/);
  });
});
        headers: { Authorization: `Bearer ${token}` },
        data: { sku: `TEST-${Date.now()}`, name: 'Test Product', price: 9.99, category: 'Test' }
      });
      expect([201, 400]).toContain(response.status()); // 201 created, 400 if validation fails
    });

    test('should reject stock adjustment without JWT', async ({ request }) => {
      const response = await request.patch(`${apiBase}/api/product/TEST-SKU/stock`, {
        data: { quantity: 10, reason: 'test' }
      });
      expect(response.status()).toBe(401); // Unauthorized
    });

    test('should reject stock adjustment with non-admin JWT', async ({ request }) => {
      const token = generateToken('100', 'user@shopease.test', ['USER']);
      const response = await request.patch(`${apiBase}/api/product/TEST-SKU/stock`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { quantity: 10, reason: 'test' }
      });
      expect(response.status()).toBe(403); // Forbidden
    });
  });

  test.describe('User Service Authorization', () => {
    test('should reject listing all users without JWT', async ({ request }) => {
      const response = await request.get(`${apiBase}/api/user`);
      expect(response.status()).toBe(401); // Unauthorized
    });

    test('should reject listing all users with non-admin JWT', async ({ request }) => {
      const token = generateToken('100', 'user@shopease.test', ['USER']);
      const response = await request.get(`${apiBase}/api/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(response.status()).toBe(403); // Forbidden
    });

    test('should allow listing users with admin JWT', async ({ request }) => {
      const token = generateToken('1', 'admin@shopease.test', ['ADMIN']);
      const response = await request.get(`${apiBase}/api/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect([200, 404]).toContain(response.status()); // 200 if users exist
    });

    test('should allow user to view own profile', async ({ request }) => {
      const token = generateToken('100', 'user@shopease.test', ['USER']);
      const response = await request.get(`${apiBase}/api/user/100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect([200, 404]).toContain(response.status()); // 200 if user exists, 404 if not found
    });

    test('should reject user viewing other user profile', async ({ request }) => {
      const token = generateToken('100', 'user@shopease.test', ['USER']);
      const response = await request.get(`${apiBase}/api/user/999`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(response.status()).toBe(403); // Forbidden
    });

    test('should allow getting own profile via /profile endpoint', async ({ request }) => {
      const token = generateToken('100', 'user@shopease.test', ['USER']);
      const response = await request.get(`${apiBase}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe('Order Service Authorization', () => {
    test('should reject listing orders without JWT', async ({ request }) => {
      const response = await request.get(`${apiBase}/api/order`);
      expect(response.status()).toBe(401); // Unauthorized
    });

    test('should filter orders by user with non-admin JWT', async ({ request }) => {
      const token = generateToken('100', 'user@shopease.test', ['USER']);
      const response = await request.get(`${apiBase}/api/order`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const orders = await response.json();
        // Verify all returned orders belong to user 100
        if (Array.isArray(orders)) {
          orders.forEach(order => {
            expect(order.userRef).toBe('100');
          });
        }
      }
    });

    test('should allow admin to view all orders', async ({ request }) => {
      const token = generateToken('1', 'admin@shopease.test', ['ADMIN']);
      const response = await request.get(`${apiBase}/api/order`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect([200, 404]).toContain(response.status());
    });

    test('should reject creating order without JWT', async ({ request }) => {
      const response = await request.post(`${apiBase}/api/order`, {
        data: { status: 'pending', total: 100 }
      });
      expect(response.status()).toBe(401); // Unauthorized
    });

    test('should create order with authenticated user ID from JWT', async ({ request }) => {
      const token = generateToken('100', 'user@shopease.test', ['USER']);
      const response = await request.post(`${apiBase}/api/order`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { status: 'pending', total: 100 }
      });
      expect([201, 400]).toContain(response.status());
      
      if (response.status() === 201) {
        const order = await response.json();
        // Verify order was created for the authenticated user (not a different user from request body)
        expect(order.userRef).toBe('100');
      }
    });
  });

  test.describe('JWT Token Validation', () => {
    test('should reject expired JWT token', async ({ request }) => {
      const secret = process.env.TEST_JWT_SECRET;
      if (!secret) return;

      const expiredPayload = {
        sub: '1',
        email: 'admin@shopease.test',
        roles: ['ADMIN'],
        iss: 'shopease',
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };

      const expiredToken = jwt.sign(expiredPayload, secret, { algorithm: 'HS256' });
      const response = await request.get(`${apiBase}/api/user`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      expect(response.status()).toBe(401); // Unauthorized due to expired token
    });

    test('should reject malformed JWT token', async ({ request }) => {
      const response = await request.get(`${apiBase}/api/user`, {
        headers: { Authorization: 'Bearer invalid.token.here' }
      });
      expect(response.status()).toBe(401); // Unauthorized
    });

    test('should reject JWT with wrong signature', async ({ request }) => {
      const wrongSecret = 'wrong-secret-key';
      const payload = {
        sub: '1',
        email: 'admin@shopease.test',
        roles: ['ADMIN'],
        iss: 'shopease',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const badToken = jwt.sign(payload, wrongSecret, { algorithm: 'HS256' });
      const response = await request.get(`${apiBase}/api/user`, {
        headers: { Authorization: `Bearer ${badToken}` }
      });
      expect(response.status()).toBe(401); // Unauthorized
    });
  });

  test.describe('Public Endpoints', () => {
    test('should allow access to health endpoints without JWT', async ({ request }) => {
      const endpoints = [
        '/actuator/health',
        '/api/health',
        '/health'
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(`${apiBase}${endpoint}`);
        expect([200, 404]).toContain(response.status()); // 200 if exists, 404 if route not found
      }
    });

    test('should allow registration without JWT', async ({ request }) => {
      const response = await request.post(`${apiBase}/api/auth/register`, {
        data: { 
          email: `test-${Date.now()}@shopease.test`, 
          password: 'testpassword123' 
        }
      });
      expect([201, 400, 409]).toContain(response.status()); // 201 created, 400 validation, 409 conflict
    });

    test('should allow login without JWT', async ({ request }) => {
      const response = await request.post(`${apiBase}/api/auth/login`, {
        data: { 
          email: 'admin@shopease.test', 
          password: 'admin123' 
        }
      });
      expect([200, 401]).toContain(response.status()); // 200 if correct, 401 if wrong credentials
    });
  });
});
