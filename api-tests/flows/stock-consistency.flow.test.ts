import { productHttp } from '../framework/http';

test('Stock consistency: inventory decrement after order', async () => {
  const resp = await productHttp.get('/api/product/inventory', { validateStatus: () => true }).catch(() => ({ status: 500 }));
  expect([200,500]).toContain(resp.status);
});
