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
    
    for (const endpoint of healthEndpoints) {
      const response = await request.get(`${baseUrl}${endpoint}`);
      // If any health endpoint responds with 200, that's good
      if (response.status() === 200) {
        expect(response.status()).toBe(200);
        return; // Exit early on first successful health check
      }
    }
    
    // If no health endpoints found, just verify base URL is accessible
    const response = await request.get(baseUrl);
    expect(response.status()).toBeLessThan(500);
  });
});
