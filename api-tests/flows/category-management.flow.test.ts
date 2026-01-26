import { productHttp } from '../framework/http';
import { adminLogin } from '../framework/auth';

describe('Product Category Management Flow', () => {
  let adminToken: string;
  let categoryId: string;

  beforeAll(async () => {
    const { token } = await adminLogin();
    adminToken = token;
  });

  test('Admin creates, updates, and deletes category', async () => {
    // Step 1: Create category
    const timestamp = Date.now();
    const newCategory = {
      name: `Test Category ${timestamp}`,
      description: 'Test category for API tests',
      slug: `test-category-${timestamp}`
    };

    const createResp = await productHttp.post('/api/category', newCategory, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect(createResp.status).toBe(201);
    expect(createResp.data).toHaveProperty('id');
    expect(createResp.data.name).toBe(newCategory.name);
    // Note: Backend may not return slug field
    categoryId = createResp.data.id;

    // Step 2: Update category
    const updateResp = await productHttp.patch(`/api/category/${categoryId}`, {
      description: 'Updated description'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect(updateResp.status).toBe(200);
    expect(updateResp.data.description).toBe('Updated description');

    // Step 3: Delete category
    const deleteResp = await productHttp.delete(`/api/category/${categoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect([200, 204]).toContain(deleteResp.status);
  });

  test('List all categories', async () => {
    const resp = await productHttp.get('/api/category', {
      validateStatus: () => true
    });

    expect(resp.status).toBe(200);
    expect(Array.isArray(resp.data)).toBe(true);
  });

  test('Non-admin cannot create categories', async () => {
    const resp = await productHttp.post('/api/category', {
      name: 'Unauthorized Category',
      slug: 'unauthorized'
    }, {
      validateStatus: () => true
    });

    expect([401, 403]).toContain(resp.status);
  });
});
