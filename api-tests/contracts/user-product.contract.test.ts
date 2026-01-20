import { productHttp } from '../framework/http';
import Ajv from 'ajv';
import { productSchema } from '../framework/schemas';

// API Contract Test: Tests product-service API directly (not through frontend)
const maybe = process.env.PRODUCT_SERVICE_URL ? test : test.skip;

maybe('User-Service -> Product-Service contract: product listing', async () => {
  const ajv = new Ajv();

  // Direct call to product-service (no Cloudflare Access, no frontend proxy)
  const resp = await productHttp.get('/api/product', { validateStatus: () => true });

  expect(resp.status).toBe(200);
  expect(Array.isArray(resp.data)).toBe(true);
  if (resp.data.length > 0) {
    const valid = ajv.validate(productSchema as any, resp.data[0]);
    expect(valid).toBe(true);
  }
});
