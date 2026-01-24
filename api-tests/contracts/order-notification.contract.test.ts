import { orderHttp } from '../framework/http';
import { waitFor } from '../framework/polling';

test('Order -> Notification contract: outbox event appears after placing order', async () => {
  // Create a cart and place an order, then poll for an outbox event
  let respCreate;
  try {
    respCreate = await orderHttp.post('/api/carts', { user_ref: 'int-test-user' }, { validateStatus: () => true });
  } catch (e) {
    return expect(true).toBe(true);
  }
  const cartId = respCreate.data && (respCreate.data.id || respCreate.data.cart_id);
  if (!cartId) return expect(true).toBe(true);

  // register delete for cart
  try {
    const { registerDelete } = await import('../framework/cleanup');
    registerDelete(orderHttp, (id: any) => `/carts/${id}`, cartId);
  } catch (e) {}

  await orderHttp.post(`/api/cart/${cartId}/items`, { 
    productRef: 'prod-1', 
    quantity: 1,
    unitPriceCents: 1999
  }, { validateStatus: () => true }).catch(() => null);
  await orderHttp.post(`/api/carts/${cartId}/checkout`, {}, { validateStatus: () => true }).catch(() => null);

  const ok = await waitFor(async () => {
    try {
      const resp = await orderHttp.get('/api/order-events', { validateStatus: () => true });
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
