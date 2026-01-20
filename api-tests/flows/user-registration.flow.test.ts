import { userHttp } from '../framework/http';

describe('User Registration Flow', () => {
  test('Complete registration flow: register → login → get profile', async () => {
    const timestamp = Date.now();
    const newUser = {
      email: `fullflow${timestamp}@example.com`,
      username: `fullflow${timestamp}`,
      password: 'FullFlow123!',
      firstName: 'Full',
      lastName: 'Flow'
    };

    // Step 1: Register
    const registerResp = await userHttp.post('/api/user/register', newUser, {
      validateStatus: () => true
    });

    expect([200, 201]).toContain(registerResp.status);
    expect(registerResp.data).toHaveProperty('id');
    const userId = registerResp.data.id;

    // Step 2: Login
    const loginResp = await userHttp.post('/api/user/login', {
      email: newUser.email,
      password: newUser.password
    }, { validateStatus: () => true });

    expect(loginResp.status).toBe(200);
    expect(loginResp.data).toHaveProperty('token');
    const token = loginResp.data.token;

    // Step 3: Get current user profile
    const profileResp = await userHttp.get('/api/user/me', {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true
    });

    expect(profileResp.status).toBe(200);
    expect(profileResp.data.email).toBe(newUser.email);
    expect(profileResp.data.id).toBe(userId);
  });

  test('Registration validation: reject duplicate email', async () => {
    const timestamp = Date.now();
    const user = {
      email: `duplicate${timestamp}@example.com`,
      username: `duplicate${timestamp}`,
      password: 'Duplicate123!',
      firstName: 'Duplicate',
      lastName: 'Test'
    };

    await userHttp.post('/api/user/register', user);

    const duplicateResp = await userHttp.post('/api/user/register', user, {
      validateStatus: () => true
    });

    expect([400, 409]).toContain(duplicateResp.status);
  });
});
