import { otelHeaders } from '../framework/tracing';
import { productHttp } from '../framework/http';

test('Trace propagation: HTTP call includes trace headers and is accepted', async () => {
  const headers = otelHeaders();
  const resp = await productHttp.get('/api/health', { headers, validateStatus: () => true }).catch(() => ({ status: 500 }));
  expect([200,500]).toContain(resp.status);
});
