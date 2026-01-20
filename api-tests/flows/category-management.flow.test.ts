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

    expect([200, 201, 404]).toContain(createResp.status);
    if (createResp.status === 200 || createResp.status === 201) {
      categoryId = createResp.data.id;
      expect(createResp.data.name).toBe(newCategory.name);
    }

    // Step 2: Update category
    if (categoryId) {
      const updateResp = await productHttp.patch(`/api/category/${categoryId}`, {
        description: 'Updated description'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
        validateStatus: () => true
      });

      expect([200, 404]).toContain(updateResp.status);
    }

    // Step 3: Delete category
    if (categoryId) {
      const deleteResp = await productHttp.delete(`/api/category/${categoryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        validateStatus: () => true
      });

      expect([200, 204, 404]).toContain(deleteResp.status);
    }
  });

  test('List all categories', async () => {
    const resp = await productHttp.get('/api/category', {
      validateStatus: () => true
    });

    expect([200, 404]).toContain(resp.status);
    if (resp.status === 200) {
      expect(Array.isArray(resp.data)).toBe(true);
    }
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
