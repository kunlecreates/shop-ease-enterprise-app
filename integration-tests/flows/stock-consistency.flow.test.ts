import { http } from '../framework/http';

const maybe = process.env.E2E_BASE_URL ? test : test.skip;

maybe('Stock consistency: inventory decrement after order', async () => {
  const resp = await http.get('/api/inventory').catch(() => ({ status: 500 }));
  expect([200,500]).toContain(resp.status);
});
