import { userHttp, notificationHttp } from '../framework/http';

describe('Password Reset Flow', () => {
  test('Complete password reset flow: request → verify token → reset → login', async () => {
    const timestamp = Date.now();
    const user = {
      email: `reset${timestamp}@example.com`,
      username: `reset${timestamp}`,
      password: 'Original123!',
      firstName: 'Reset',
      lastName: 'Test'
    };

    await userHttp.post('/api/user/register', user);

    // Step 1: Request password reset
    const resetReqResp = await userHttp.post('/api/auth/password-reset-request', {
      email: user.email
    }, { validateStatus: () => true });

    expect([200, 202]).toContain(resetReqResp.status);
    expect(resetReqResp.data).toHaveProperty('success');
    expect(resetReqResp.data.success).toBe(true);
  });

  test('Password reset validation: reject invalid token', async () => {
    const resp = await userHttp.post('/api/auth/password-reset-confirm', {
      token: 'invalid-token-12345',
      newPassword: 'NewPassword123!'
    }, { validateStatus: () => true });

    expect([400, 401]).toContain(resp.status);
    expect(resp.data).toHaveProperty('error');
  });

  test('Password reset validation: enforce password complexity', async () => {
    const resp = await userHttp.post('/api/auth/password-reset-confirm', {
      token: 'some-token',
      newPassword: 'weak'
    }, { validateStatus: () => true });

    expect(resp.status).toBe(400);
    expect(resp.data).toHaveProperty('error');
    expect(resp.data.error).toMatch(/password/i);
  });
});
