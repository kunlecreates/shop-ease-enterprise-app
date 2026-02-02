import { productHttp, userHttp, orderHttp, notificationHttp } from './http';
import { AxiosInstance } from 'axios';

type CleanupFn = () => Promise<void>;

let cleanupFns: CleanupFn[] = [];

// Test data markers - used to identify test data vs seed data
export const TEST_DATA_MARKERS = {
  EMAIL_PATTERN: /^(test-|checkout|api-test|e2e-|temp-).*@/i,
  SKU_PATTERN: /^(int-|test-|temp-|api-)/i,
  USERNAME_PATTERN: /^(test-|checkout|api-test|e2e-|temp-)/i,
};

export function registerCleanup(fn: CleanupFn) {
  cleanupFns.push(fn);
}

export async function teardownAll() {
  console.log(`[Cleanup] Running ${cleanupFns.length} cleanup operations...`);
  // run in reverse order
  for (const fn of cleanupFns.reverse()) {
    try {
      await fn();
    } catch (e: any) {
      console.error('[Cleanup] Error during cleanup:', e.message);
      // continue with other cleanups even if one fails
    }
  }
  console.log('[Cleanup] All cleanup operations completed');
  cleanupFns = [];
}

// Helper shortcuts for common resources
export function registerDelete(
  httpClient: AxiosInstance,
  pathTemplate: (id: any) => string,
  id: any,
  token?: string
) {
  registerCleanup(async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await httpClient.delete(pathTemplate(id), { 
        headers, 
        validateStatus: () => true 
      });
      console.log(`[Cleanup] Deleted ${pathTemplate(id)} - Status: ${response.status}`);
    } catch (e: any) {
      console.error(`[Cleanup] Failed to delete ${pathTemplate(id)}:`, e.message);
    }
  });
}
