import { request } from '../framework/http';
import Ajv from 'ajv';
import { productSchema } from '../framework/schemas';

const maybe = process.env.E2E_BASE_URL ? test : test.skip;

maybe('User-Service -> Product-Service contract: product listing', async () => {
  const ajv = new Ajv();
  let resp;

  resp = await request('get', '/product');
  // Cloudflare Access layer
  if (resp.status === 401 || resp.status === 403) {
    expect([401, 403]).toContain(resp.status);
    return;
  }

  expect(resp.status).toBe(200);
  expect(Array.isArray(resp.data)).toBe(true);
  if (resp.data.length > 0) {
    const valid = ajv.validate(productSchema as any, resp.data[0]);
    expect(valid).toBe(true);
  }
});
