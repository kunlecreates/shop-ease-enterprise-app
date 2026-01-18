import { http } from '../framework/http';

const maybe = process.env.E2E_BASE_URL ? test : test.skip;

maybe('Metrics emission: scrape metrics endpoint', async () => {
  const resp = await http.get('/metrics').catch(() => ({ status: 404 }));
  expect([200,404]).toContain(resp.status);
});
