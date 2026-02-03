import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// Test data markers matching ACTUAL patterns created by tests
// Updated to match real prefixes: testuser, profile, checkout, int-, BULK-, etc.
const TEST_DATA_MARKERS = {
  EMAIL_PATTERN: /^(testuser|profile|deleteme|logintest|metest|roletest|regular|ordertest|canceltest|admintest|disable|checkout|tracking|fullflow|duplicate|reset)\d+@example\.com$/i,
  SKU_PATTERN: /^(int-|BULK-)/i,
};

/**
 * E2E Test Cleanup Helper
 * 
 * Purpose: Clean up test data created during E2E tests while preserving seed data
 * 
 * Usage:
 * - Call cleanupTestUsers() after E2E suite completes
 * - Call cleanupTestOrders() after order-related tests
 * - Call cleanupTestProducts() after product creation tests
 * 
 * Safety:
 * - Only deletes items matching TEST_DATA_MARKERS patterns
 * - Never touches seed data (APPLE001, admin@shopease.com, etc.)
 */

interface CleanupConfig {
  adminToken?: string;
}

export async function getAdminToken(): Promise<string> {
  const email = process.env.E2E_ADMIN_EMAIL || 'admin@shopease.com';
  const password = process.env.E2E_ADMIN_PASSWORD || 'AdminPass123!';
  
  try {
    const response = await axios.post(`${BASE_URL}/api/user/login`, {
      email,
      password,
    });
    return response.data.token;
  } catch (error) {
    console.error('[E2E Cleanup] Failed to get admin token:', error);
    throw error;
  }
}

/**
 * Clean up test users created during E2E tests
 * 
 * Deletes users whose emails match TEST_DATA_MARKERS.EMAIL_PATTERN
 * Safe: Will NOT delete seed users (alice@example.com, admin@shopease.com, etc.)
 */
export async function cleanupTestUsers(config?: CleanupConfig) {
  try {
    const token = config?.adminToken || await getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };

    // Get all users
    const usersResponse = await axios.get(`${BASE_URL}/api/user`, { 
      headers,
      validateStatus: () => true 
    });

    if (usersResponse.status !== 200) {
      console.log('[E2E Cleanup] Could not fetch users list');
      return;
    }

    const users = usersResponse.data;
    let deletedCount = 0;

    for (const user of users) {
      // Only delete test users (skip seed data)
      if (TEST_DATA_MARKERS.EMAIL_PATTERN.test(user.email)) {
        try {
          await axios.delete(`${BASE_URL}/api/user/${user.id}`, { 
            headers,
            validateStatus: () => true 
          });
          console.log(`[E2E Cleanup] Deleted test user: ${user.email}`);
          deletedCount++;
        } catch (e: any) {
          console.error(`[E2E Cleanup] Failed to delete user ${user.email}:`, e.message);
        }
      }
    }

    console.log(`[E2E Cleanup] Deleted ${deletedCount} test user(s)`);
  } catch (error: any) {
    console.error('[E2E Cleanup] Error during test user cleanup:', error.message);
  }
}

/**
 * Clean up test products created during E2E/API tests
 * 
 * Deletes products whose SKUs match TEST_DATA_MARKERS.SKU_PATTERN
 * Safe: Will NOT delete seed products (APPLE001, BANANA001, etc.)
 */
export async function cleanupTestProducts(config?: CleanupConfig) {
  try {
    const token = config?.adminToken || await getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };

    // Get all products
    const productsResponse = await axios.get(`${BASE_URL}/api/product`, { 
      validateStatus: () => true 
    });

    if (productsResponse.status !== 200) {
      console.log('[E2E Cleanup] Could not fetch products list');
      return;
    }

    const products = productsResponse.data;
    let deletedCount = 0;

    for (const product of products) {
      // Only delete test products (skip seed data)
      if (TEST_DATA_MARKERS.SKU_PATTERN.test(product.sku)) {
        try {
          await axios.delete(`${BASE_URL}/api/product/${product.sku}`, { 
            headers,
            validateStatus: () => true 
          });
          console.log(`[E2E Cleanup] Deleted test product: ${product.sku}`);
          deletedCount++;
        } catch (e: any) {
          console.error(`[E2E Cleanup] Failed to delete product ${product.sku}:`, e.message);
        }
      }
    }

    console.log(`[E2E Cleanup] Deleted ${deletedCount} test product(s)`);
  } catch (error: any) {
    console.error('[E2E Cleanup] Error during test product cleanup:', error.message);
  }
}

/**
 * Clean up test orders created during E2E/API tests
 * 
 * Orders are identified by test patterns or recent creation time
 * This prevents accumulation of test orders in the database
 */
export async function cleanupTestOrders(config?: CleanupConfig) {
  try {
    const token = config?.adminToken || await getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };

    // Get all orders (admin endpoint returns all orders)
    const ordersResponse = await axios.get(`${BASE_URL}/api/order`, { 
      headers,
      validateStatus: () => true 
    });

    if (ordersResponse.status !== 200) {
      console.log('[E2E Cleanup] Could not fetch orders list');
      return;
    }

    const orders = ordersResponse.data;
    let deletedCount = 0;

    // Strategy: Delete orders that are:
    // 1. In PENDING or CANCELLED status (likely test orders)
    // 2. Created by test users (userRef matches test patterns)
    // Note: We can't directly delete orders via API, so we mark them for cleanup
    // In production, you'd implement a DELETE endpoint or database cleanup script

    for (const order of orders) {
      const isTestUser = order.userRef && /^(testuser|ordertest|checkout|test)/i.test(order.userRef);
      const isPending = order.status === 'PENDING';
      const isCancelled = order.status === 'CANCELLED';
      
      // Only log test orders found (actual deletion requires backend support)
      if ((isTestUser || isPending || isCancelled)) {
        console.log(`[E2E Cleanup] Found test order: Order #${order.id} (${order.status}, user: ${order.userRef})`);
        deletedCount++;
      }
    }

    console.log(`[E2E Cleanup] Identified ${deletedCount} test order(s) for cleanup`);
    console.log('[E2E Cleanup] Note: Order deletion requires database-level cleanup script');
  } catch (error: any) {
    console.error('[E2E Cleanup] Error during test order cleanup:', error.message);
  }
}

/**
 * Clean up all test data (users, products, orders)
 * 
 * Call this in Playwright's globalTeardown or after E2E suite completes
 */
export async function cleanupAllTestData() {
  console.log('[E2E Cleanup] Starting comprehensive test data cleanup...');
  const token = await getAdminToken();
  
  await cleanupTestUsers({ adminToken: token });
  await cleanupTestProducts({ adminToken: token });
  await cleanupTestOrders({ adminToken: token });
  
  console.log('[E2E Cleanup] All test data cleanup completed');
}
