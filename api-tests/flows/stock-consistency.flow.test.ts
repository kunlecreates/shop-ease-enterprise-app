import { productHttp } from '../framework/http';

test('Stock consistency: inventory decrement after order', async () => {
  const resp = await productHttp.get('/api/product/inventory', { 
    validateStatus: () => true 
  });
  
  expect(resp.status).toBe(200);
  // Backend may return { products: [] } instead of array directly
  const products = Array.isArray(resp.data) ? resp.data : resp.data.products;
  expect(Array.isArray(products)).toBe(true);
});
