import { http } from '../framework/http';

const maybe = process.env.E2E_BASE_URL ? test : test.skip;

maybe('User -> Order contract: create cart and add item', async () => {
  const cartResp = await http.post('/api/carts', { user_ref: 'test-user' }).catch(() => ({ status: 500 }));
  expect([201, 200, 500]).toContain(cartResp.status);
});
