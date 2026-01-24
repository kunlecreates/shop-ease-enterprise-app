import { orderHttp, userHttp } from '../framework/http';
import { products, users } from '../framework/testData';

test('Customer checkout flow: create cart, add item, place order, verify order exists', async () => {
  // Create and authenticate a customer
  const timestamp = Date.now();
  const customer = {
    email: `checkout${timestamp}@example.com`,
    username: `checkout${timestamp}`,
    password: 'Checkout123!',
    firstName: 'Checkout',
    lastName: 'Test'
  };

  await userHttp.post('/api/user/register', customer);
  const loginResp = await userHttp.post('/api/user/login', {
    email: customer.email,
    password: customer.password
  });
  const customerToken = loginResp.data.token;

  const cartResp = await orderHttp.post('/api/cart', {}, {
    headers: { Authorization: `Bearer ${customerToken}` },
    validateStatus: () => true
  });
  
  expect(cartResp.status).toBe(201);
  expect(cartResp.data).toHaveProperty('id');
  const cartId = cartResp.data.id;
  expect(cartId).toBeDefined();

  // register cleanup to delete the cart after test
  try {
    const { registerDelete } = await import('../framework/cleanup');
    registerDelete(orderHttp, (id: any) => `/carts/${id}`, cartId);
  } catch (e) {}

  const itemResp = await orderHttp.post(`/api/cart/${cartId}/items`, { product_ref: products[0].id, quantity: 1 }, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  
  expect(itemResp.status).toBe(201);

  const checkout = await orderHttp.post(`/api/cart/${cartId}/checkout`, {}, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  
  expect(checkout.status).toBe(202);
  expect(checkout.data).toHaveProperty('orderId');

  // Verify order appears in orders list
  const orders = await orderHttp.get('/api/order', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  
  expect(orders.status).toBe(200);
  expect(Array.isArray(orders.data)).toBe(true);
  expect(orders.data.length).toBeGreaterThan(0);
});
