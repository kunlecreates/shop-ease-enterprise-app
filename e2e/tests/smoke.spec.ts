import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('application should be accessible', async ({ page }) => {
    // Just verify the app loads without crashing
    const response = await page.goto('/');
    expect(response).toBeTruthy();
    expect(response?.status()).toBeLessThan(500);
    
    // Wait for page to be somewhat loaded
    await page.waitForLoadState('domcontentloaded');
    
    // Verify we get some HTML content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('html');
  });

  test('application should respond to health check if available', async ({ request }) => {
    const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
    
    // Try common health check endpoints
    const healthEndpoints = ['/health', '/api/health', '/healthz'];
    const timeoutMs = Number(process.env.E2E_HEALTH_TIMEOUT_MS || 3000);

    async function getWithTimeout(url: string) {
      return Promise.race([
        request.get(url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
      ]);
    }
    
    for (const endpoint of healthEndpoints) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await getWithTimeout(`${baseUrl}${endpoint}`) as any;
        if (response && typeof response.status === 'function' && response.status() === 200) {
          expect(response.status()).toBe(200);
          return; // Exit early on first successful health check
        }
      } catch (e) {
        // ignore timeouts and continue to next endpoint
      }
    }
    
    // If no health endpoints found, just verify base URL is accessible
    try {
      const response = await getWithTimeout(baseUrl) as any;
      expect(response.status()).toBeLessThan(500);
    } catch (e) {
      throw new Error('Health check failed: base URL did not respond in time');
    }
  });
});
