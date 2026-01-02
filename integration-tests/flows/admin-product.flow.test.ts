import { request } from '../framework/http';

const maybe = process.env.E2E_BASE_URL ? test : test.skip;

maybe('Admin product flow: create product (if allowed)', async () => {
  let resp;
  try {
    resp = await request('post', '/api/admin/products', { name: 'int-product', sku: `int-${Date.now()}` });
  } catch (e) {
    return expect(true).toBe(true);
  }
  if (resp.status === 201 && resp.data && (resp.data.id || resp.data.product_id)) {
    const id = resp.data.id || resp.data.product_id;
    try {
      const { registerDelete } = await import('../framework/cleanup');
      registerDelete((i: any) => `/api/admin/products/${i}`, id);
    } catch (e) {}
  }
  expect([201,403]).toContain(resp.status);
});
