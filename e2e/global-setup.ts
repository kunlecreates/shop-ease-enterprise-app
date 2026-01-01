import { chromium, FullConfig } from '@playwright/test';
import url from 'url';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  const cookieEnv = process.env.CF_AUTH_COOKIE || '';
  const base = process.env.E2E_BASE_URL || config.projects?.[0]?.use?.baseURL || 'http://localhost:3000';
  const authPath = path.resolve(__dirname, '.auth.json');

  if (!cookieEnv) {
    // Ensure no stale auth file remains
    try { if (fs.existsSync(authPath)) fs.unlinkSync(authPath); } catch (e) {}
    return;
  }

  // Normalize cookie value: accept raw Set-Cookie header or just the value
  let cookieValue = cookieEnv;
  // If cookie looks like 'CF_Authorization=val; Path=/; HttpOnly' extract value
  const maybePair = cookieValue.match(/CF_Authorization=([^;\s]+)/i);
  if (maybePair && maybePair[1]) cookieValue = maybePair[1];
  // If cookie contains a semicolon but no name, take part before semicolon
  if (cookieValue.includes(';')) cookieValue = cookieValue.split(';')[0];

  // Derive domain from base URL
  let domain = undefined;
  try {
    const parsed = new url.URL(base);
    domain = parsed.hostname;
  } catch (e) {
    domain = undefined;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();

  const cookie = {
    name: 'CF_Authorization',
    value: cookieValue,
    domain: domain || 'localhost',
    path: '/',
    httpOnly: false,
    secure: true,
  };

  try {
    await context.addCookies([cookie]);
    await context.storageState({ path: authPath });
    console.log('Wrote auth storage to', authPath);
  } catch (err) {
    console.error('Failed to write auth storage:', err);
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
