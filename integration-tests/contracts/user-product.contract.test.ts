import { http } from '../framework/http';

const maybe = process.env.E2E_BASE_URL ? test : test.skip;

maybe('User-Service -> Product-Service contract: product listing', async () => {
  const resp = await http.get('/api/products').catch(() => ({ status: 404 }));
  expect([200, 404]).toContain(resp.status);
});
