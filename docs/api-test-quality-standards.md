# API Contract Test Quality Standards

## Overview

This document outlines the quality standards applied to all API contract tests in this project. These standards ensure tests are realistic, maintainable, and actually validate business logic rather than just accepting any response.

## Core Principles

### 1. **No Silent Failures**
❌ **Bad:**
```typescript
if (!orderId) {
  console.warn('Skipping: no order created');
  return;
}
```

✅ **Good:**
```typescript
if (!orderId) {
  throw new Error('Order not created in setup');
}
```

**Rationale:** Tests that skip execution hide problems. If setup fails, the test should fail loudly.

### 2. **No HTTP 500 Acceptance**
❌ **Bad:**
```typescript
const resp = await http.get('/api/endpoint', { 
  validateStatus: () => true 
}).catch(() => ({ status: 500 }));
expect([200, 500]).toContain(resp.status);
```

✅ **Good:**
```typescript
const resp = await http.get('/api/endpoint', { 
  validateStatus: () => true 
});
expect(resp.status).toBe(200);
expect(resp.data).toHaveProperty('id');
```

**Rationale:** HTTP 500 means server error. Tests accepting 500 as valid hide actual bugs.

### 3. **Specific Status Code Expectations**
❌ **Bad:**
```typescript
expect([200, 404]).toContain(resp.status);
```

✅ **Good:**
```typescript
expect(resp.status).toBe(200);
```

**Rationale:** A resource should either exist (200) or not exist (404), but not both. Tests accepting multiple success statuses can't validate actual behavior.

**Exception:** Use arrays only for legitimate alternatives:
```typescript
// Both 200 and 204 are valid for successful deletion
expect([200, 204]).toContain(resp.status);

// Validation errors can be 400 or 422 depending on implementation
expect([400, 422]).toContain(resp.status);
```

### 4. **Always Validate Response Data**
❌ **Bad:**
```typescript
expect(resp.status).toBe(200);
```

✅ **Good:**
```typescript
expect(resp.status).toBe(200);
expect(resp.data).toHaveProperty('id');
expect(resp.data.email).toBe(expectedEmail);
expect(Array.isArray(resp.data.items)).toBe(true);
```

**Rationale:** Status code alone doesn't validate business logic. Always verify the response contains expected data.

### 5. **Remove Permissive 404 from Admin Operations**
❌ **Bad:**
```typescript
const resp = await adminHttp.post('/api/category', newCategory, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
expect([201, 404]).toContain(resp.status);
```

✅ **Good:**
```typescript
const resp = await adminHttp.post('/api/category', newCategory, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
expect(resp.status).toBe(201);
expect(resp.data).toHaveProperty('id');
expect(resp.data.name).toBe(newCategory.name);
```

**Rationale:** Admin operations with proper authentication should succeed. Accepting 404 hides authorization or routing issues.

### 6. **Validate Business Logic, Not Just HTTP**
❌ **Bad:**
```typescript
const cancelResp = await orderHttp.post(`/api/order/${orderId}/cancel`);
expect([200, 400, 404, 409]).toContain(cancelResp.status);
```

✅ **Good:**
```typescript
const cancelResp = await orderHttp.post(`/api/order/${orderId}/cancel`);
expect([200, 204]).toContain(cancelResp.status);
if (cancelResp.data) {
  expect(cancelResp.data.status).toMatch(/cancel/i);
}
```

**Rationale:** Tests should validate that cancellation actually worked, not accept any status code.

## Test Type Specific Standards

### Flow Tests
Flow tests validate complete user journeys. They should:
- **Create clean test data** with unique identifiers
- **Validate each step** in the flow with specific assertions
- **Clean up test data** after execution (where applicable)
- **Fail fast** if any step fails unexpectedly

Example:
```typescript
test('Complete checkout flow', async () => {
  // Step 1: Create cart
  const cartResp = await orderHttp.post('/api/carts', {}, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  expect(cartResp.status).toBe(201);
  expect(cartResp.data).toHaveProperty('id');
  const cartId = cartResp.data.id;

  // Step 2: Add items
  const itemResp = await orderHttp.post(`/api/carts/${cartId}/items`, {
    product_ref: 'test-product',
    quantity: 2
  }, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  expect(itemResp.status).toBe(201);

  // Step 3: Checkout
  const checkoutResp = await orderHttp.post(`/api/carts/${cartId}/checkout`, {}, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  expect([200, 202]).toContain(checkoutResp.status);
  expect(checkoutResp.data).toHaveProperty('orderId');
});
```

### Contract Tests
Contract tests validate API contracts between services. They should:
- **Validate request/response schemas** using JSON schema validation
- **Test error cases** with appropriate status codes
- **Verify authentication/authorization** boundaries
- **Document expected behavior** for service consumers

Example:
```typescript
test('GET /api/user/:id - retrieve user profile', async () => {
  const resp = await userHttp.get(`/api/user/${userId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  expect(resp.status).toBe(200);
  expect(resp.data).toMatchObject({
    id: userId,
    email: expect.any(String),
    firstName: expect.any(String),
    lastName: expect.any(String),
    createdAt: expect.any(String)
  });
});
```

## Common Patterns

### Authentication Tests
```typescript
test('Endpoint requires authentication', async () => {
  const resp = await http.get('/api/protected', {
    validateStatus: () => true
  });
  expect([401, 403]).toContain(resp.status);
});

test('Endpoint rejects invalid token', async () => {
  const resp = await http.get('/api/protected', {
    headers: { Authorization: 'Bearer invalid-token' },
    validateStatus: () => true
  });
  expect([401, 403]).toContain(resp.status);
});
```

### Validation Error Tests
```typescript
test('Reject invalid email format', async () => {
  const resp = await userHttp.post('/api/user/register', {
    email: 'not-an-email',
    password: 'ValidPass123!'
  }, {
    validateStatus: () => true
  });
  
  expect([400, 422]).toContain(resp.status);
  expect(resp.data).toHaveProperty('error');
  expect(resp.data.error).toMatch(/email/i);
});
```

### List/Collection Tests
```typescript
test('List all products', async () => {
  const resp = await productHttp.get('/api/product');
  
  expect(resp.status).toBe(200);
  expect(Array.isArray(resp.data)).toBe(true);
  
  if (resp.data.length > 0) {
    const product = resp.data[0];
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('price');
  }
});
```

### Admin Operation Tests
```typescript
test('Admin creates category', async () => {
  const newCategory = {
    name: `Test Category ${Date.now()}`,
    slug: `test-${Date.now()}`
  };

  const resp = await productHttp.post('/api/category', newCategory, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  expect(resp.status).toBe(201);
  expect(resp.data.name).toBe(newCategory.name);
  expect(resp.data.slug).toBe(newCategory.slug);
  expect(resp.data).toHaveProperty('id');
});

test('Non-admin cannot create category', async () => {
  const resp = await productHttp.post('/api/category', {
    name: 'Unauthorized'
  }, {
    validateStatus: () => true
  });

  expect([401, 403]).toContain(resp.status);
});
```

## Refactoring Checklist

When reviewing or refactoring tests, check:

- [ ] No tests accept HTTP 500 as valid
- [ ] No silent failures (console.warn + return)
- [ ] Status codes are specific to the test scenario
- [ ] All successful responses validate response data
- [ ] Admin operations don't accept 404 unnecessarily
- [ ] Authentication tests properly validate 401/403
- [ ] Validation error tests check error messages
- [ ] List endpoints validate array responses
- [ ] Business logic is validated, not just HTTP status

## Migration Examples

### Before Refactoring
```typescript
test('Customer cancels order', async () => {
  if (!orderId) {
    console.warn('Skipping: no order');
    return;
  }

  const resp = await orderHttp.post(`/api/order/${orderId}/cancel`, {}, {
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true
  });

  expect([200, 204, 400, 404, 500]).toContain(resp.status);
});
```

### After Refactoring
```typescript
test('Customer cancels order', async () => {
  if (!orderId) {
    throw new Error('Order not created in setup');
  }

  const resp = await orderHttp.post(`/api/order/${orderId}/cancel`, {}, {
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true
  });

  expect([200, 204]).toContain(resp.status);
  if (resp.data) {
    expect(resp.data).toHaveProperty('status');
    expect(resp.data.status).toMatch(/cancel/i);
  }
});
```

## Summary

These standards transform tests from "does the endpoint return something" to "does the endpoint return the correct thing". The goal is to catch bugs early, not to make tests pass at any cost.

**Key Takeaway:** Tests should fail when the application doesn't work as expected. Permissive tests that accept any response are worse than no tests at all.

---

*Last Updated: $(date)*
*Applies to: All tests in `/api-tests/**/*.test.ts`*
Sat Jan 24 12:23:44 AM MST 2026
Sat Jan 24 12:25:03 AM MST 2026
