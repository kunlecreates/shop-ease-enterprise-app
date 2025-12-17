import { test, expect } from '@playwright/test';

const base = process.env.E2E_BASE_URL || process.env.BASE_URL;

test.describe('Frontend proxy smoke', () => {
  test.skip(!base, 'BASE_URL not set');

  test('product proxy responds (200/404 acceptable)', async ({ request }) => {
    const res = await request.get(`${base}/api/product`);
    expect([200, 404]).toContain(res.status());
  });

  test('user proxy reachable (health or 404 acceptable)', async ({ request }) => {
    const res = await request.get(`${base}/api/user`);
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test('order proxy reachable (health or 404 acceptable)', async ({ request }) => {
    const res = await request.get(`${base}/api/order`);
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test('notification proxy health reachable', async ({ request }) => {
    const res = await request.get(`${base}/api/notification/health`);
    expect([200, 401, 403, 404]).toContain(res.status());
  });
});
