import { productHttp } from '../framework/http';
import { adminLogin } from '../framework/auth';

// API Contract Test: Tests product-service admin API directly
const maybe = process.env.PRODUCT_SERVICE_URL ? test : test.skip;

maybe('Admin product flow: create product', async () => {
  const { token } = await adminLogin();
  const headers = { 'Authorization': `Bearer ${token}` };

  // Direct call to product-service admin endpoint
  const resp = await productHttp.post('/api/product', 
    { name: 'int-product', sku: `int-${Date.now()}`, priceCents: 1000, currency: 'USD' }, 
    { headers }
  );

  expect(resp.status).toBe(201);
  expect(resp.data).toHaveProperty('id');
  expect(resp.data).toHaveProperty('sku');
  expect(resp.data.name).toBe('int-product');
  expect(resp.data.priceCents).toBe(1000);

  const sku = resp.data.sku;
  try {
    const { registerDelete } = await import('../framework/cleanup');
    registerDelete(productHttp, (s: any) => `/api/product/${s}`, sku);
  } catch (e) {}
});
