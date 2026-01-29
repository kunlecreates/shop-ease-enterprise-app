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
    };
    // Retry on transient upstream failures (502/504/timeouts)
    const maxAttempts = 5;
    let attempt = 0;
    while (++attempt <= maxAttempts) {
      try {
        const resp = await request.post(endpoint, { data: product });
        if (resp.ok()) return true;
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
