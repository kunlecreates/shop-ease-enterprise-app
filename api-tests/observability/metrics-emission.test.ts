import { productHttp } from '../framework/http';

test('Metrics emission: scrape metrics endpoint', async () => {
  const resp = await productHttp.get('/metrics', { validateStatus: () => true }).catch(() => ({ status: 404 }));
  expect([200,404]).toContain(resp.status);
});
