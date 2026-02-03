import { productHttp, userHttp, orderHttp, notificationHttp } from './http';
import { AxiosInstance } from 'axios';

type CleanupFn = () => Promise<void>;

let cleanupFns: CleanupFn[] = [];

// Test data markers - used to identify test data vs seed data
// Patterns match ACTUAL prefixes created by test files (testuser, profile, checkout, etc.)
export const TEST_DATA_MARKERS = {
  EMAIL_PATTERN: /^(testuser|profile|deleteme|logintest|metest|roletest|regular|ordertest|canceltest|admintest|disable|checkout|tracking|fullflow|duplicate|reset)\d+@example\.com$/i,
  SKU_PATTERN: /^(int-|BULK-)/i,
  USERNAME_PATTERN: /^(testuser|profile|deleteme|logintest|metest|roletest|regular|ordertest|canceltest|admintest|disable|checkout|tracking|fullflow|duplicate|reset)\d+$/i,
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
