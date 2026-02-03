/**
 * E2E Test Configuration
 * 
 * Provides configuration for E2E tests including feature flags,
 * test user credentials, and environment-specific settings.
 */

export const testConfig = {
  // Email verification is bypassed in test mode
  emailVerificationEnabled: process.env.EMAIL_VERIFICATION_TEST_MODE !== 'true',
  
  // Base API URL for backend services
  apiBaseUrl: process.env.E2E_API_BASE_URL || 'http://localhost',
  
  // Test users with pre-verified emails
  testUsers: {
    customer: {
      email: 'e2e-customer@test.local',
      password: 'E2ETestPassword123!',
      role: 'CUSTOMER'
    },
    admin: {
      email: 'e2e-admin@test.local',
      password: 'E2EAdminPassword123!',
      role: 'ADMIN'
    }
  },
  
  // Timeouts for various operations
  timeouts: {
    navigation: 30000,
    api: 10000,
    shortWait: 2000
  }
};

/**
 * Check if running in test mode with email verification disabled
 */
export function isTestMode(): boolean {
  return !testConfig.emailVerificationEnabled;
}

/**
 * Get test user credentials
 */
export function getTestUser(role: 'customer' | 'admin' = 'customer') {
  return testConfig.testUsers[role];
}
