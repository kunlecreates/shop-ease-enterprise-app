import { cleanupAllTestData } from './helpers/cleanup';

/**
 * Playwright Global Teardown
 * 
 * Runs once after all E2E tests complete (across all workers)
 * Cleans up test data from live database while preserving seed data
 */
export default async function globalTeardown() {
  console.log('[Global Teardown] Running E2E test cleanup...');
  
  try {
    await cleanupAllTestData();
    console.log('[Global Teardown] E2E cleanup completed successfully');
  } catch (error: any) {
    console.error('[Global Teardown] E2E cleanup failed:', error.message);
    // Don't fail the test run if cleanup fails
  }
}
