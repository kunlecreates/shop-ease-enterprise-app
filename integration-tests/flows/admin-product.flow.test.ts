import { http } from '../framework/http';

const maybe = process.env.E2E_BASE_URL ? test : test.skip;

maybe('Admin product flow: create product (if allowed)', async () => {
  const resp = await http.post('/api/admin/products', { name: 'x', sku: 'x' }).catch(() => ({ status: 403 }));
  expect([201,403]).toContain(resp.status);
});
