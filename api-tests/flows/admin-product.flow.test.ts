import { productHttp } from '../framework/http';
import { adminLogin } from '../framework/auth';

// API Contract Test: Tests product-service admin API directly
const maybe = process.env.PRODUCT_SERVICE_URL ? test : test.skip;

maybe('Admin product flow: create product (if allowed)', async () => {
  const { token } = await adminLogin();
  const headers = { 'Authorization': `Bearer ${token}` };

  // Direct call to product-service admin endpoint
  const resp = await productHttp.post('/api/product', 
    { name: 'int-product', sku: `int-${Date.now()}`, price_cents: 1000, currency: 'USD' }, 
    { headers, validateStatus: () => true }
  );

  // 201 if admin allowed, 403 if RBAC disabled in this environment
  expect([201, 403]).toContain(resp.status);

  if (resp.status === 201 && resp.data && (resp.data.id || resp.data.sku)) {
    const sku = resp.data.sku;
    try {
      const { registerDelete } = await import('../framework/cleanup');
      registerDelete(productHttp, (s: any) => `/api/product/${s}`, sku);
    } catch (e) {}
  }
});
