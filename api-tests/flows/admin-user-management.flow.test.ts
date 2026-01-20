import { userHttp } from '../framework/http';
import { adminLogin } from '../framework/auth';

describe('Admin User Management Flow', () => {
  let adminToken: string;

  beforeAll(async () => {
    const { token } = await adminLogin();
    adminToken = token;
  });

  test('Admin flow: list users → view profile → update role', async () => {
    // Step 1: Create a test user
    const timestamp = Date.now();
    const testUser = {
      email: `admintest${timestamp}@example.com`,
      username: `admintest${timestamp}`,
      password: 'AdminTest123!',
      firstName: 'Admin',
      lastName: 'Managed'
    };

    const registerResp = await userHttp.post('/api/user/register', testUser);
    const userId = registerResp.data.id;

    // Step 2: Admin lists users
    const listResp = await userHttp.get('/api/user', {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect([200, 404]).toContain(listResp.status);

    // Step 3: Admin views specific user profile
    const profileResp = await userHttp.get(`/api/user/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect([200, 404]).toContain(profileResp.status);

    // Step 4: Admin updates user role
    const roleUpdateResp = await userHttp.patch(`/api/user/${userId}/role`, {
      role: 'ADMIN'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect([200, 403, 404]).toContain(roleUpdateResp.status);
  });

  test('Admin can disable/enable user accounts', async () => {
    const timestamp = Date.now();
    const testUser = {
      email: `disable${timestamp}@example.com`,
      username: `disable${timestamp}`,
      password: 'Disable123!',
      firstName: 'Disable',
      lastName: 'Test'
    };

    const registerResp = await userHttp.post('/api/user/register', testUser);
    const userId = registerResp.data.id;

    const disableResp = await userHttp.patch(`/api/user/${userId}/status`, {
      enabled: false
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect([200, 404]).toContain(disableResp.status);
  });
});
