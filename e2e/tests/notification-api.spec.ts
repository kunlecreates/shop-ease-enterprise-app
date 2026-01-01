import { test, expect } from '@playwright/test';

test.describe('Notification Service', () => {
  test.skip(true, 'Notification tests are placeholders until notification wiring is implemented');

  test('send notification (API)', async ({ request }) => {
    // TODO: POST /api/notification/test and assert response
  });
});
