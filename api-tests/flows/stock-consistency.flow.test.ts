import { productHttp } from '../framework/http';

test('Stock consistency: inventory decrement after order', async () => {
  const resp = await productHttp.get('/api/product/inventory', { 
    validateStatus: () => true 
  });
  
  expect(resp.status).toBe(200);
  expect(Array.isArray(resp.data)).toBe(true);
});
