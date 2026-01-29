import { Page, APIRequestContext } from '@playwright/test';
import fs from 'fs';
import { URL } from 'url';

/**
 * Authentication helper used by tests.
 * Priority:
 * 1. Use Cloudflare Access client credentials (`CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET`) by
 *    setting `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers on the browser context.
 * 2. Fall back to API login using `ADMIN_EMAIL` and `ADMIN_PASSWORD` (best-effort).
 * This helper is defensive and will not throw if authentication is not possible.
 */
export async function setAuthFromEnv(page: Page, request?: APIRequestContext) {
  // Priority 1: Cloudflare Access client credentials (preferred in CI)
  const cfClientId = process.env.CF_ACCESS_CLIENT_ID;
  const cfClientSecret = process.env.CF_ACCESS_CLIENT_SECRET;
  if (cfClientId && cfClientSecret) {
    // Set CF Access headers for the browser context so navigations include them
    try {
      await page.context().setExtraHTTPHeaders({
        'CF-Access-Client-Id': cfClientId,
        'CF-Access-Client-Secret': cfClientSecret,
      });
      return true;
    } catch (err) {
      // proceed to other auth methods if setting headers fails
    }
  }

  const base = process.env.E2E_BASE_URL || page.context()._options.baseURL || 'http://localhost:3000';
  const baseHost = new URL(base).hostname;

  // Priority 2: API login using ADMIN_EMAIL + ADMIN_PASSWORD
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword && request) {
    try {
      const loginEndpoint = `${base.replace(/\/$/, '')}/api/auth/login`;
      const resp = await request.post(loginEndpoint, { data: { email: adminEmail, password: adminPassword } });
      if (resp.ok()) {
        const body = await resp.json();
        // If API returns token, set it as cookie (best-effort)
        const token = body?.token || body?.accessToken || body?.jwt;
        if (token) {
          await page.context().addCookies([
            { name: 'auth', value: token, domain: baseHost, path: '/', httpOnly: true, secure: true, sameSite: 'Lax' } as any,
          ]);

          // Persist storage for reuse if requested
          try {
            const storage = await page.context().storageState();
            fs.mkdirSync('storage', { recursive: true });
            fs.writeFileSync('storage/admin.storage.json', JSON.stringify(storage));
          } catch (err) {
            // ignore write errors
          }
          return true;
        }
      }
    } catch (err) {
      // Do not fail tests if auth helper can't login
      // eslint-disable-next-line no-console
      console.warn('Auth helper: login attempt failed', err?.message || err);
    }
  }

  return false;
}

export async function usePersistedAdminStorage(page: Page) {
  const path = 'storage/admin.storage.json';
  if (fs.existsSync(path)) {
    const storage = JSON.parse(fs.readFileSync(path, 'utf8'));
    // restore cookies if present
    if (storage.cookies) {
      await page.context().addCookies(storage.cookies as any);
      return true;
    }
  }
  return false;
}

export default { setAuthFromEnv, usePersistedAdminStorage };
