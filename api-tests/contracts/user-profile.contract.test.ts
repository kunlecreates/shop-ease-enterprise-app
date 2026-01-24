import { userHttp } from '../framework/http';

describe('User Profile CRUD Contract', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    const user = {
      email: `profile${timestamp}@example.com`,
      username: `profile${timestamp}`,
      password: 'ProfileTest123!',
      firstName: 'Profile',
      lastName: 'Test'
    };

    const registerResp = await userHttp.post('/api/user/register', user);
    userId = registerResp.data.id;

    const loginResp = await userHttp.post('/api/user/login', {
      email: user.email,
      password: user.password
    });
    authToken = loginResp.data.token;
  });

  test('GET /api/user/:id - retrieve user profile', async () => {
    const resp = await userHttp.get(`/api/user/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      validateStatus: () => true
    });

    expect(resp.status).toBe(200);
    expect(resp.data).toHaveProperty('id');
    expect(resp.data.id).toBe(userId);
    expect(resp.data).toHaveProperty('email');
  });

  test('PATCH /api/user/profile - update user profile', async () => {
    const updates = {
      firstName: 'Updated',
      lastName: 'Name',
      phoneNumber: '+1234567890'
    };

    const resp = await userHttp.patch('/api/user/profile', updates, {
      headers: { Authorization: `Bearer ${authToken}` },
      validateStatus: () => true
    });

    expect(resp.status).toBe(200);
    expect(resp.data.firstName).toBe(updates.firstName);
    expect(resp.data.lastName).toBe(updates.lastName);
  });

  test('PATCH /api/user/profile - reject unauthenticated update', async () => {
    const resp = await userHttp.patch('/api/user/profile', {
      firstName: 'Hacker'
    }, { validateStatus: () => true });

    expect([401, 403]).toContain(resp.status);
  });

  test('DELETE /api/user/:id - delete user account', async () => {
    const timestamp = Date.now();
    const tempUser = {
      email: `deleteme${timestamp}@example.com`,
      username: `deleteme${timestamp}`,
      password: 'DeleteMe123!',
      firstName: 'Delete',
      lastName: 'Me'
    };

    const registerResp = await userHttp.post('/api/user/register', tempUser);
    const tempUserId = registerResp.data.id;

    const loginResp = await userHttp.post('/api/user/login', {
      email: tempUser.email,
      password: tempUser.password
    });
    const tempToken = loginResp.data.token;

    const resp = await userHttp.delete(`/api/user/${tempUserId}`, {
      headers: { Authorization: `Bearer ${tempToken}` },
      validateStatus: () => true
    });

    expect([200, 204]).toContain(resp.status);
  });
});
