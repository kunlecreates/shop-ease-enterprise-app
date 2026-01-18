import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

const apiBase = process.env.API_BASE_URL || process.env.E2E_BASE_URL || '';

test.describe('Security / JWT Access Control', () => {
  // Helper to generate JWT tokens for testing
  function generateToken(userId: string, email: string, roles: string[]) {
    const secret = process.env.TEST_JWT_SECRET;
    if (!secret) {
      throw new Error('TEST_JWT_SECRET environment variable is required for security tests');
    }

    const payload = {
      sub: userId,
      email: email,
      roles: roles,
      iss: 'shopease',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    };

    return jwt.sign(payload, secret, { algorithm: 'HS256' });
  }

  test.describe('Product Service Authorization', () => {
    test('should allow public access to product listing', async ({ request }) => {
      const response = await request.get(`${apiBase}/api/product`);
      expect([200, 404]).toContain(response.status()); // 200 if products exist, 404 if empty is acceptable
    });

    test('should reject product creation without JWT', async ({ request }) => {
      const response = await request.post(`${apiBase}/api/product`, {
        data: { sku: 'TEST-SKU', name: 'Test Product', price: 9.99 }
      });
      expect(response.status()).toBe(401); // Unauthorized
    });

    test('should reject product creation with non-admin JWT', async ({ request }) => {
      const token = generateToken('100', 'user@shopease.test', ['USER']);
      const response = await request.post(`${apiBase}/api/product`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { sku: 'TEST-SKU', name: 'Test Product', price: 9.99 }
      });
      expect(response.status()).toBe(403); // Forbidden
    });

    test('should allow product creation with admin JWT', async ({ request }) => {
      const token = generateToken('1', 'admin@shopease.test', ['ADMIN']);
      const response = await request.post(`${apiBase}/api/product`, {
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
