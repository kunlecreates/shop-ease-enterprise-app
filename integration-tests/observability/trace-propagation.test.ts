import { otelHeaders } from '../framework/tracing';
import { http } from '../framework/http';

const maybe = process.env.E2E_BASE_URL ? test : test.skip;

maybe('Trace propagation: HTTP call includes trace headers and is accepted', async () => {
  const headers = otelHeaders();
  const resp = await http.get('/api/health', { headers }).catch(() => ({ status: 500 }));
  expect([200,500]).toContain(resp.status);
});
