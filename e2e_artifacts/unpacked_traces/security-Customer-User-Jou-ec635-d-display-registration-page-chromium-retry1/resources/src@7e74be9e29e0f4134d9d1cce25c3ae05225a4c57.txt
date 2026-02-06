import fs from 'fs';
import path from 'path';
import { test as base, expect } from '@playwright/test';
import { setAuthFromEnv } from '../helpers/auth';

const STORAGE_PATH = path.resolve(process.cwd(), 'storage', 'admin.storage.json');

export const test = base.extend<{}>({});

// Before each test that imports this setup, attempt to apply persisted admin storage
test.beforeEach(async ({ page, request }) => {
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const storage = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
      if (storage.cookies && storage.cookies.length) {
        await page.context().addCookies(storage.cookies as any);
        return;
      }
    }
  } catch (err) {
    // ignore and try API login fallback
  }

  // Fallback: attempt to login via API or env-based cookie
  try {
    await setAuthFromEnv(page, request as any);
  } catch (err) {
    // Do not fail tests if login is not possible
  }
});

export { expect };

export default test;
