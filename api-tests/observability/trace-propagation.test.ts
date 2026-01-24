import { otelHeaders } from '../framework/tracing';
import { productHttp } from '../framework/http';

test('Trace propagation: HTTP call includes trace headers and is accepted', async () => {
  const headers = otelHeaders();
  const resp = await productHttp.get('/api/health', { 
    headers, 
    validateStatus: () => true 
  });
  
  expect(resp.status).toBe(200);
  expect(resp.data).toHaveProperty('status');
});
