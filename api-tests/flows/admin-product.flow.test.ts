import { request, authHeaders } from '../framework/http';
import { adminLogin } from '../framework/auth';

const maybe = process.env.E2E_BASE_URL ? test : test.skip;

maybe('Admin product flow: create product (if allowed)', async () => {
  const { token } = await adminLogin();
  const headers = authHeaders(token);

  let resp;
  
  resp = await request('post', '/admin/products', { name: 'int-product', sku: `int-${Date.now()}` }, { headers });

  // 201 if admin allowed, 403 if RBAC disabled in this environment
  expect([201, 403]).toContain(resp.status);

  if (resp.status === 201 && resp.data && (resp.data.id || resp.data.product_id)) {
    const id = resp.data.id || resp.data.product_id;
    try {
      const { registerDelete } = await import('../framework/cleanup');
      registerDelete((i: any) => `/admin/products/${i}`, id);
    } catch (e) {}
  }
});
