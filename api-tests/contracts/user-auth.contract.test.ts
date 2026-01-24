import { userHttp } from '../framework/http';
import { userSchema } from '../framework/schemas';

describe('User Authentication Contract', () => {
  let testUserId: string;
  let authToken: string;

  test('POST /api/user/register - create new user', async () => {
    const timestamp = Date.now();
    const newUser = {
      email: `testuser${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const resp = await userHttp.post('/api/user/register', newUser, { validateStatus: () => true });

    expect([200, 201]).toContain(resp.status);
    expect(resp.data).toHaveProperty('id');
    expect(resp.data.email).toBe(newUser.email);

    testUserId = resp.data.id;
  });

  test('POST /api/user/login - authenticate user and receive JWT', async () => {
    const timestamp = Date.now();
    const credentials = {
      email: `logintest${timestamp}@example.com`,
      username: `logintest${timestamp}`,
      password: 'LoginTest123!'
    };

    // Register first
    await userHttp.post('/api/user/register', { ...credentials, firstName: 'Login', lastName: 'Test' });

    // Then login
    const resp = await userHttp.post('/api/user/login', {
      email: credentials.email,
      password: credentials.password
    }, { validateStatus: () => true });

    expect(resp.status).toBe(200);
    expect(resp.data).toHaveProperty('token');
    expect(typeof resp.data.token).toBe('string');
    expect(resp.data.token.length).toBeGreaterThan(0);

    authToken = resp.data.token;
  });

  test('POST /api/user/login - reject invalid credentials', async () => {
    const resp = await userHttp.post('/api/user/login', {
      email: 'nonexistent@example.com',
      password: 'WrongPassword123!'
    }, { validateStatus: () => true });

    expect([401, 403]).toContain(resp.status);
  });

  test('POST /api/user/logout - invalidate JWT token', async () => {
    if (!authToken) {
      throw new Error('No auth token available for logout test');
    }

    const resp = await userHttp.post('/api/user/logout', {}, {
      headers: { Authorization: `Bearer ${authToken}` },
      validateStatus: () => true
    });

    expect([200, 204]).toContain(resp.status);
  });

  test('GET /api/user/me - get current authenticated user', async () => {
    // Register and login
    const timestamp = Date.now();
    const user = {
      email: `metest${timestamp}@example.com`,
      username: `metest${timestamp}`,
      password: 'MeTest123!',
      firstName: 'Me',
      lastName: 'Test'
    };

    await userHttp.post('/api/user/register', user);
    const loginResp = await userHttp.post('/api/user/login', {
      email: user.email,
      password: user.password
    });

    const token = loginResp.data.token;

    // Get current user
    const resp = await userHttp.get('/api/user/me', {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true
    });

    expect(resp.status).toBe(200);
    expect(resp.data.email).toBe(user.email);
  });

  test('GET /api/user/me - reject unauthenticated request', async () => {
    const resp = await userHttp.get('/api/user/me', { validateStatus: () => true });

    expect([401, 403]).toContain(resp.status);
  });
});
