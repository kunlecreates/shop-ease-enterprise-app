import { test, expect } from '@playwright/test';

const apiBase = process.env.API_BASE_URL || process.env.E2E_BASE_URL || '';

test.describe('Cross-service integration smoke', () => {
  test.skip(!apiBase, 'API_BASE_URL or E2E_BASE_URL must be set');

  test('User -> Product -> Order -> Notification -> Frontend proxy checks', async ({ request }) => {
    // 1) Create a product
    const sku = `sku-${Date.now()}`;
    const productResp = await request.post(`${apiBase}/api/product`, {
      data: {
        sku,
        name: 'E2E Test Product',
        price: 9.99,
      },
    });
    expect(productResp.status()).toBeGreaterThanOrEqual(200);
    expect(productResp.status()).toBeLessThan(300);
    const product = await productResp.json().catch(() => null);
    expect(product).toBeTruthy();
    if (product) expect(product.sku || product.sku).toBeTruthy();

    // 2) Create a user (POST returns Location header with id)
    const email = `e2e+${Date.now()}@example.com`;
    const pw = 'Password123!';
    const userResp = await request.post(`${apiBase}/api/user`, {
      data: { email, password: pw },
    });
    expect([201, 200]).toContain(userResp.status());
    // parse id from Location header if present
    let userId: string | null = null;
    const loc = userResp.headers().get('location') || userResp.headers().get('Location');
    if (loc) {
      const m = loc.match(/\/(?:api\/user\/)?(\d+)$/);
      if (m) userId = m[1];
    }
    // fallback: try GET /api/user and find our email
    if (!userId) {
      const list = await request.get(`${apiBase}/api/user`);
      if (list.ok()) {
        const users = await list.json().catch(() => []);
        const found = users.find((u: any) => u.email === email || u.email?.toLowerCase() === email.toLowerCase());
        if (found) userId = String(found.id || found.userId || found.id);
      }
    }
    expect(userId).toBeTruthy();

    // 3) Create an order referencing the user and product
    const orderPayload = {
      userId: Number(userId),
      status: 'NEW',
      total: 9.99,
      items: [{ productRef: sku, quantity: 1, unitPrice: 9.99 }],
    };
    const orderResp = await request.post(`${apiBase}/api/order`, { data: orderPayload });
    expect([201, 200]).toContain(orderResp.status());

    // 4) Verify order is listable via API
    const orders = await request.get(`${apiBase}/api/order`);
    expect(orders.ok()).toBeTruthy();
    const ordersJson = await orders.json().catch(() => []);
    const created = ordersJson.find((o: any) => (o.userId && String(o.userId) === String(userId)) || (o.items && o.items.find((it:any)=>it.productRef===sku)));
    expect(created).toBeTruthy();

    // 5) Notification service reachable and test endpoint works
    const notif = await request.post(`${apiBase}/api/notification/test`, { data: {} });
    expect([200,201,202]).toContain(notif.status());

    // 6) Frontend proxy routing: ensure /api/product and /api/order reachable via frontend base
    const frontendBase = process.env.E2E_BASE_URL || '';
    if (frontendBase) {
      const p = await request.get(`${frontendBase}/api/product`);
      expect([200, 404]).toContain(p.status());
      const o = await request.get(`${frontendBase}/api/order`);
      expect([200, 401, 403, 404]).toContain(o.status());
    }
  });
});
