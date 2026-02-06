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
  
  // Global cleanup: Delete all test users matching pattern
  await cleanupTestUsers();
}

/**
 * Delete all test users from the database based on email patterns.
 * This catches any users created during tests that weren't explicitly registered for cleanup.
 */
async function cleanupTestUsers() {
  try {
    console.log('[Cleanup] Fetching all test users for cleanup...');
    
    // Get admin token for cleanup operations
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shopease.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    
    let adminToken: string;
    try {
      const loginResp = await userHttp.post('/api/user/login', {
        email: adminEmail,
        password: adminPassword
      }, { validateStatus: () => true });
      
      if (loginResp.status !== 200 || !loginResp.data.token) {
        console.warn('[Cleanup] Admin login failed - skipping test user cleanup');
        return;
      }
      adminToken = loginResp.data.token;
    } catch (e: any) {
      console.warn('[Cleanup] Admin login error - skipping test user cleanup:', e.message);
      return;
    }
    
    // Get all users
    const usersResp = await userHttp.get('/api/user', {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });
    
    if (usersResp.status !== 200 || !Array.isArray(usersResp.data)) {
      console.warn('[Cleanup] Failed to fetch users - skipping cleanup');
      return;
    }
    
    const testUsers = usersResp.data.filter((user: any) => 
      TEST_DATA_MARKERS.EMAIL_PATTERN.test(user.email)
    );
    
    console.log(`[Cleanup] Found ${testUsers.length} test users to delete`);
    
    // Delete each test user
    let deletedCount = 0;
    for (const user of testUsers) {
      try {
        const deleteResp = await userHttp.delete(`/api/user/${user.id}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true
        });
        
        if ([200, 204].includes(deleteResp.status)) {
          deletedCount++;
          console.log(`[Cleanup] Deleted test user: ${user.email}`);
        } else {
          console.warn(`[Cleanup] Failed to delete user ${user.email} - Status: ${deleteResp.status}`);
        }
      } catch (e: any) {
        console.error(`[Cleanup] Error deleting user ${user.email}:`, e.message);
      }
    }
    
    console.log(`[Cleanup] Test user cleanup complete: ${deletedCount}/${testUsers.length} users deleted`);
  } catch (e: any) {
    console.error('[Cleanup] Test user cleanup failed:', e.message);
    // Don't throw - cleanup should not fail tests
  }
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
