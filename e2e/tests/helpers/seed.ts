import { APIRequestContext } from '@playwright/test';

export async function seedProductIfRequired(request: APIRequestContext) {
  const shouldSeed = process.env.E2E_REQUIRE_PRODUCTS === 'true' || process.env.E2E_SEED === 'true';
  if (!shouldSeed) return false;

  const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const endpoint = `${base.replace(/\/$/, '')}/api/product`;

  try {
    const product = {
      name: 'Playwright Test Product',
      description: 'Seeded by Playwright E2E for deterministic test',
      price: 1.23,
      sku: `pw-${Date.now()}`,
      stock: 10,
      initialStock: 10,
    };
    let adminJwt = process.env.E2E_ADMIN_JWT;
    // If no JWT provided, try to login using ADMIN_EMAIL / ADMIN_PASSWORD (safer than storing long-lived tokens)
    if (!adminJwt && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      try {
        const authEndpoint = `${base.replace(/\/$/, '')}/api/auth/login`;
        const loginResp = await request.post(authEndpoint, { data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
        if (loginResp.ok()) {
          const body = await loginResp.json();
          // Expecting response shape { token: '...' } or { accessToken: '...' }
          adminJwt = body.token || body.accessToken || body.access_token || adminJwt;
        } else {
          // eslint-disable-next-line no-console
          console.warn('admin login failed', await loginResp.text());
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('admin login error', err?.message || err);
      }
    }
    // Retry on transient upstream failures (502/504/timeouts)
    const maxAttempts = 5;
    let attempt = 0;
    while (++attempt <= maxAttempts) {
      try {
        const headers: Record<string, string> = {};
        if (adminJwt) headers['Authorization'] = `Bearer ${adminJwt}`;
        const resp = await request.post(endpoint, { data: product, headers });
        if (resp.ok()) {
          // If we have an admin JWT and an initial stock value, set stock via PATCH
          if (adminJwt && product.stock !== undefined && product.sku) {
            const stockEndpoint = `${endpoint}/${encodeURIComponent(product.sku)}/stock`;
            const maxPatchAttempts = 3;
            for (let pAttempt = 1; pAttempt <= maxPatchAttempts; pAttempt++) {
              try {
                const patchResp = await request.patch(stockEndpoint, { data: { quantity: product.stock }, headers });
                if (patchResp.ok()) break;
                // eslint-disable-next-line no-console
                console.warn(`stock patch attempt ${pAttempt} failed with status ${patchResp.status()}, retrying...`);
              } catch (err) {
                // eslint-disable-next-line no-console
                console.warn(`stock patch attempt ${pAttempt} error: ${err?.message || err}`);
              }
              if (pAttempt < maxPatchAttempts) await new Promise(res => setTimeout(res, 300 * pAttempt));
            }
          }
          return true;
        }
        const status = resp.status();
        // If it's a client error (4xx other than 429) don't retry
        if (status >= 400 && status < 500 && status !== 429) {
          // eslint-disable-next-line no-console
          console.warn(`seed attempt ${attempt} failed with status ${status} (not retrying)`);
          break;
        }
        // Otherwise treat as transient and retry
        // eslint-disable-next-line no-console
        console.warn(`seed attempt ${attempt} failed with status ${status}, retrying...`);
      } catch (err) {
        // Network / request error — retry
        // eslint-disable-next-line no-console
        console.warn(`seed attempt ${attempt} error: ${err?.message || err}`);
      }

      if (attempt < maxAttempts) {
        const backoffMs = 500 * Math.pow(2, attempt - 1); // 500, 1000, 2000, ...
        await new Promise(res => setTimeout(res, backoffMs));
      }
    }
  } catch (err) {
    // Ignore errors — seeding is best-effort
    // eslint-disable-next-line no-console
    console.warn('seedProductIfRequired failed', err?.message || err);
  }
  return false;
}

export default { seedProductIfRequired };
