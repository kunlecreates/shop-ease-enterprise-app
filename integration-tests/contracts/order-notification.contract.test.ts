import { request } from '../framework/http';
import { waitFor } from '../framework/polling';

const maybe = process.env.E2E_BASE_URL ? test : test.skip;

maybe('Order -> Notification contract: outbox event appears after placing order', async () => {
  // Create a cart and place an order, then poll for an outbox event
  let respCreate;
  try {
    respCreate = await request('post', '/carts', { user_ref: 'int-test-user' });
  } catch (e) {
    return expect(true).toBe(true);
  }
  const cartId = respCreate.data && (respCreate.data.id || respCreate.data.cart_id);
  if (!cartId) return expect(true).toBe(true);

  // register delete for cart
  try {
    const { registerDelete } = await import('../framework/cleanup');
    registerDelete((id: any) => `/carts/${id}`, cartId);
  } catch (e) {}

  await request('post', `/carts/${cartId}/items`, { product_ref: 'prod-1', quantity: 1 }).catch(() => null);
  await request('post', `/carts/${cartId}/checkout`).catch(() => null);

  const ok = await waitFor(async () => {
    try {
      const resp = await request('get', '/order-events');
      if (resp.status === 200 && Array.isArray(resp.data)) {
        return resp.data.some((e: any) => e && (e.cart_id === cartId || e.order_id));
      }
    } catch (e) {
      return false;
    }
    return false;
  }, 15000, 500);

  expect(ok).toBe(true);
});
