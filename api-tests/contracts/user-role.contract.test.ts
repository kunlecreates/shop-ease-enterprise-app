import { userHttp } from '../framework/http';
import { adminLogin } from '../framework/auth';

describe('User Role Contract', () => {
  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const { token } = await adminLogin();
    adminToken = token;

    const timestamp = Date.now();
    const testUser = {
      email: `roletest${timestamp}@example.com`,
      username: `roletest${timestamp}`,
      password: 'RoleTest123!',
      firstName: 'Role',
      lastName: 'Test'
    };

    const resp = await userHttp.post('/api/user/register', testUser);
    testUserId = resp.data.id;
  });

  test('GET /api/user/:id/role - verify user role', async () => {
    const resp = await userHttp.get(`/api/user/${testUserId}/role`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect(resp.status).toBe(200);
    expect(resp.data).toHaveProperty('role');
    expect(['CUSTOMER', 'ADMIN']).toContain(resp.data.role);
  });

  test('PATCH /api/user/:id/role - update user role (admin only)', async () => {
    const resp = await userHttp.patch(`/api/user/${testUserId}/role`, {
      role: 'ADMIN'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect(resp.status).toBe(200);
    expect(resp.data).toHaveProperty('roles');
    expect(resp.data.roles).toContain('ADMIN');
  });

  test('PATCH /api/user/:id/role - reject non-admin role change', async () => {
    const timestamp = Date.now();
    const regularUser = {
      email: `regular${timestamp}@example.com`,
      username: `regular${timestamp}`,
      password: 'Regular123!',
      firstName: 'Regular',
      lastName: 'User'
    };

    await userHttp.post('/api/user/register', regularUser);
    const loginResp = await userHttp.post('/api/user/login', {
      email: regularUser.email,
      password: regularUser.password
    });

    const userToken = loginResp.data.token;

    const resp = await userHttp.patch(`/api/user/${testUserId}/role`, {
      role: 'ADMIN'
    }, {
      headers: { Authorization: `Bearer ${userToken}` },
      validateStatus: () => true
    });

    expect([403, 401]).toContain(resp.status);
  });
});
