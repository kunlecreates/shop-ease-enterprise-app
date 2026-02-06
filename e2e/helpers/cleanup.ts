import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// Test data markers matching ACTUAL patterns created by tests
// Updated to match real prefixes: test, testuser, profile, checkout, int-, BULK-, etc.
const TEST_DATA_MARKERS = {
  EMAIL_PATTERN: /^(test|testuser|profile|deleteme|logintest|metest|roletest|regular|ordertest|canceltest|admintest|disable|checkout|tracking|fullflow|duplicate|reset)\d+@example\.com$/i,
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
    console.log('[E2E Cleanup] Fetching admin token...');
    const token = config?.adminToken || await getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };

    console.log('[E2E Cleanup] Fetching users list from /api/user...');
    // Get all users
    const usersResponse = await axios.get(`${BASE_URL}/api/user`, { 
      headers,
      validateStatus: () => true 
    });

    console.log(`[E2E Cleanup] Users list response status: ${usersResponse.status}`);

    if (usersResponse.status !== 200) {
      console.log(`[E2E Cleanup] Could not fetch users list. Status: ${usersResponse.status}, Response:`, JSON.stringify(usersResponse.data));
      return;
    }

    const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
    console.log(`[E2E Cleanup] Found ${users.length} total user(s)`);
    
    // Log first few users to debug
    if (users.length > 0) {
      console.log(`[E2E Cleanup] Sample users:`, users.slice(0, 3).map((u: any) => ({ id: u.id, email: u.email })));
    }
    
    let deletedCount = 0;
    let testUserCount = 0;

    for (const user of users) {
      // Log each user to see what we're working with
      if (TEST_DATA_MARKERS.EMAIL_PATTERN.test(user.email)) {
        testUserCount++;
        console.log(`[E2E Cleanup] Found test user: ${user.email} (ID: ${user.id})`);
        try {
          const deleteResponse = await axios.delete(`${BASE_URL}/api/user/${user.id}`, { 
            headers,
            validateStatus: () => true 
          });
          if (deleteResponse.status === 204 || deleteResponse.status === 200) {
            console.log(`[E2E Cleanup] ✓ Deleted test user: ${user.email}`);
            deletedCount++;
          } else {
            console.log(`[E2E Cleanup] ✗ Failed to delete user ${user.email}. Status: ${deleteResponse.status}`);
          }
        } catch (e: any) {
          console.error(`[E2E Cleanup] ✗ Exception deleting user ${user.email}:`, e.message);
        }
      }
    }

    console.log(`[E2E Cleanup] Found ${testUserCount} test user(s), deleted ${deletedCount}`);
  } catch (error: any) {
    console.error('[E2E Cleanup] Error during test user cleanup:', error.message);
    if (error.response) {
      console.error('[E2E Cleanup] Error response:', JSON.stringify(error.response.data));
    }
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
    console.log('[E2E Cleanup] Fetching admin token for product cleanup...');
    const token = config?.adminToken || await getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };

    console.log('[E2E Cleanup] Fetching products list from /api/product...');
    // Get all products
    const productsResponse = await axios.get(`${BASE_URL}/api/product`, { 
      validateStatus: () => true 
    });

    console.log(`[E2E Cleanup] Products list response status: ${productsResponse.status}`);

    if (productsResponse.status !== 200) {
      console.log(`[E2E Cleanup] Could not fetch products list. Status: ${productsResponse.status}`);
      return;
    }

    const products = Array.isArray(productsResponse.data) ? productsResponse.data : [];
    console.log(`[E2E Cleanup] Found ${products.length} total product(s)`);
    
    let deletedCount = 0;
    let testProductCount = 0;

    for (const product of products) {
      // Only delete test products (skip seed data)
      if (TEST_DATA_MARKERS.SKU_PATTERN.test(product.sku)) {
        testProductCount++;
        console.log(`[E2E Cleanup] Found test product: ${product.sku} (Name: ${product.name})`);
        try {
          const deleteResponse = await axios.delete(`${BASE_URL}/api/product/${product.sku}`, { 
            headers,
            validateStatus: () => true 
          });
          if (deleteResponse.status === 204 || deleteResponse.status === 200) {
            console.log(`[E2E Cleanup] ✓ Deleted test product: ${product.sku}`);
            deletedCount++;
          } else {
            console.log(`[E2E Cleanup] ✗ Failed to delete product ${product.sku}. Status: ${deleteResponse.status}`);
          }
        } catch (e: any) {
          console.error(`[E2E Cleanup] ✗ Exception deleting product ${product.sku}:`, e.message);
        }
      }
    }

    console.log(`[E2E Cleanup] Found ${testProductCount} test product(s), deleted ${deletedCount}`);
  } catch (error: any) {
    console.error('[E2E Cleanup] Error during test product cleanup:', error.message);
    if (error.response) {
      console.error('[E2E Cleanup] Error response:', JSON.stringify(error.response.data));
    }
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
    console.log('[E2E Cleanup] Fetching admin token for order cleanup...');
    const token = config?.adminToken || await getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };

    console.log('[E2E Cleanup] Fetching orders list from /api/order...');
    // Get all orders (admin endpoint returns all orders)
    const ordersResponse = await axios.get(`${BASE_URL}/api/order`, { 
      headers,
      validateStatus: () => true 
    });

    console.log(`[E2E Cleanup] Orders list response status: ${ordersResponse.status}`);

    if (ordersResponse.status !== 200) {
      console.log(`[E2E Cleanup] Could not fetch orders list. Status: ${ordersResponse.status}`);
      return;
    }

    const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
    console.log(`[E2E Cleanup] Found ${orders.length} total order(s)`);
    
    let testOrderCount = 0;

    // Strategy: Identify test orders for potential cleanup
    // Note: Direct order deletion may require backend support
    for (const order of orders) {
      const isTestUser = order.userRef && /^(testuser|ordertest|checkout|test)/i.test(order.userRef);
      const isPending = order.status === 'PENDING';
      const isCancelled = order.status === 'CANCELLED';
      
      // Log test orders found
      if ((isTestUser || isPending || isCancelled)) {
        console.log(`[E2E Cleanup] Found test order: Order #${order.id} (Status: ${order.status}, User: ${order.userRef})`);
        testOrderCount++;
      }
    }

    console.log(`[E2E Cleanup] Identified ${testOrderCount} test order(s) for cleanup`);
    if (testOrderCount > 0) {
      console.log('[E2E Cleanup] Note: Order deletion requires database-level cleanup script or backend DELETE endpoint');
    }
  } catch (error: any) {
    console.error('[E2E Cleanup] Error during test order cleanup:', error.message);
    if (error.response) {
      console.error('[E2E Cleanup] Error response:', JSON.stringify(error.response.data));
    }
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
