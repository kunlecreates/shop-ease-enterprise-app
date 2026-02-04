import { teardownAll } from './cleanup';

// Ensure teardown runs after all tests in the suite
// Set longer timeout for cleanup operations (DELETE operations can take time with many users)
afterAll(async () => {
  await teardownAll();
}, 30000); // 30 second timeout for cleanup
