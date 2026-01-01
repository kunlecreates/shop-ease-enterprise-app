import { test, expect } from '@playwright/test';

test.describe('Order API', () => {
  test.skip(true, 'Order API tests will be enabled when the API and cross-service links are stable');

  test('create order referencing user and product (API)', async ({ request }) => {
    // TODO: implement when services are ready
  });
});
