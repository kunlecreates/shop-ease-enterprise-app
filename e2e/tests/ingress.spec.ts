import { test, expect } from '@playwright/test';

const base = process.env.E2E_BASE_URL || process.env.BASE_URL;

test.describe('Ingress & Routing', () => {
  test.skip(!base, 'E2E_BASE_URL not configured');

  test('ingress routes API to services', async ({ request }) => {
    const res = await request.get(`${base}/api/product`);
    expect([200, 404]).toContain(res.status());
  });
});
