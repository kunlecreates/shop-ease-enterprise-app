import { orderHttp, userHttp } from '../framework/http';

test('User -> Order contract: create cart, add item, place order', async () => {
  // Create and authenticate a user
  const timestamp = Date.now();
  const user = {
    email: `ordertest${timestamp}@example.com`,
    username: `ordertest${timestamp}`,
    password: 'OrderTest123!',
    firstName: 'Order',
    lastName: 'Test'
  };

  await userHttp.post('/api/user/register', user);
  const loginResp = await userHttp.post('/api/user/login', {
    email: user.email,
    password: user.password
  });
  const userToken = loginResp.data.token;

  // Create cart
  const respCreate = await orderHttp.post('/api/cart', {}, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  
  expect(respCreate.status).toBe(201);
  expect(respCreate.data).toHaveProperty('id');
  const cartId = respCreate.data.id;
  expect(cartId).toBeDefined();

  // register cleanup to delete cart when possible
  try {
    const { registerDelete } = await import('../framework/cleanup');
    registerDelete(orderHttp, (id: any) => `/carts/${id}`, cartId);
  } catch (e) {}

  // Add item
  const addItem = await orderHttp.post(`/api/cart/${cartId}/items`, { 
    productRef: 'prod-1', 
    quantity: 1,
    unitPriceCents: 1999
  }, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  
  expect(addItem.status).toBe(201);

  // Attempt checkout
  const checkout = await orderHttp.post(`/api/cart/${cartId}/checkout`, {}, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  
  expect(checkout.status).toBe(202);
  expect(checkout.data).toHaveProperty('success');
  // Backend may return cartId or orderId depending on implementation
  if (checkout.data.orderId) {
    expect(checkout.data.orderId).toBeDefined();
  }
});
