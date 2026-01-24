import { productHttp } from '../framework/http';
import { adminLogin } from '../framework/auth';

describe('Product Bulk Operations Flow', () => {
  let adminToken: string;

  beforeAll(async () => {
    const { token } = await adminLogin();
    adminToken = token;
  });

  test('Bulk import products', async () => {
    const products = [
      {
        sku: `BULK-001-${Date.now()}`,
        name: 'Bulk Product 1',
        price: 1999,
        stock: 100
      },
      {
        sku: `BULK-002-${Date.now()}`,
        name: 'Bulk Product 2',
        price: 2999,
        stock: 50
      }
    ];

    const resp = await productHttp.post('/api/product/bulk', {
      products
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect(resp.status).toBe(201);
    expect(resp.data).toHaveProperty('created');
    expect(resp.data.created).toBeGreaterThanOrEqual(products.length);
  });

  test('Bulk update product prices', async () => {
    const updates = [
      { sku: 'BULK-001', price: 1799 },
      { sku: 'BULK-002', price: 2799 }
    ];

    const resp = await productHttp.patch('/api/product/bulk/price', {
      updates
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect(resp.status).toBe(200);
    expect(resp.data).toHaveProperty('updated');
  });

  test('Bulk stock adjustment', async () => {
    const adjustments = [
      { sku: 'BULK-001', quantityDelta: 10 },
      { sku: 'BULK-002', quantityDelta: -5 }
    ];

    const resp = await productHttp.post('/api/product/bulk/stock', {
      adjustments
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect(resp.status).toBe(200);
    expect(resp.data).toHaveProperty('adjusted');
  });

  test('Export products to CSV/JSON', async () => {
    const resp = await productHttp.get('/api/product/export', {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { format: 'json' },
      validateStatus: () => true
    });

    expect(resp.status).toBe(200);
    expect(Array.isArray(resp.data) || typeof resp.data === 'string').toBe(true);
  });
});
