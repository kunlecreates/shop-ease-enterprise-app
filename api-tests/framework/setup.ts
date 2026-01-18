import { teardownAll } from './cleanup';

// Ensure teardown runs after all tests in the suite
afterAll(async () => {
  await teardownAll();
});
