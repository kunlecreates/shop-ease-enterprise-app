import { test, expect } from '@playwright/test';

const apiBase = process.env.API_BASE_URL || process.env.E2E_BASE_URL || '';

test.describe('Security / Access control (placeholder)', () => {
  test.skip(true, 'Security boundary tests require auth enforcement in services');

  test('unauthorized access should be denied', async ({ request }) => {
    // TODO: attempt protected endpoints and assert 401/403
  });
});
