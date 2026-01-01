import { test, expect } from '@playwright/test';

test.describe('Product API', () => {
  test.skip(true, 'Product API tests will be enabled when deployment exposes a stable API');

  test('create & list product (API)', async ({ request }) => {
    // TODO: implement create/list/assert shape
  });
});
