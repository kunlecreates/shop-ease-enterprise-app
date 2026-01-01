import { test, expect } from '@playwright/test';

test.describe('Auth (placeholder)', () => {
  test.skip(true, 'Auth UI / API not implemented yet — add tests when login/register are available');

  test('register and login flow (API)', async ({ request }) => {
    // TODO: Add API-level registration + login tests when endpoints exist
    // Example: POST /api/user -> POST /api/user/login -> assert JWT cookie / token
  });
});
