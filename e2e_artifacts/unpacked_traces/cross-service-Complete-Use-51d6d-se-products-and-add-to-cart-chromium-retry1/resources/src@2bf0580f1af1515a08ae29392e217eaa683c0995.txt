import { APIRequestContext } from '@playwright/test';

export async function seedProductIfRequired(request: APIRequestContext) {
  const shouldSeed = process.env.E2E_REQUIRE_PRODUCTS === 'true' || process.env.E2E_SEED === 'true';
  if (!shouldSeed) return false;

  const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const endpoint = `${base.replace(/\/$/, '')}/api/product`;

  try {
    const product = {
      title: 'Playwright Test Product',
      description: 'Seeded by Playwright E2E for deterministic test',
      price: 1.23,
      sku: `pw-${Date.now()}`,
      stock: 10,
    };

    const resp = await request.post(endpoint, { data: product });
    if (resp.ok()) return true;
  } catch (err) {
    // Ignore errors — seeding is best-effort
    // eslint-disable-next-line no-console
    console.warn('seedProductIfRequired failed', err?.message || err);
  }
  return false;
}

export default { seedProductIfRequired };
