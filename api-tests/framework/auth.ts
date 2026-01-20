/**
 * Authentication helpers for API contract testing
 * 
 * Generates JWT tokens for testing authenticated endpoints.
 * No external auth services or Cloudflare Access - uses local JWT generation.
 */
import jwt from 'jsonwebtoken';

export async function adminLogin() {
  const secret = process.env.TEST_JWT_SECRET;
  if (!secret) {
    throw new Error('TEST_JWT_SECRET environment variable is required');
  }

  const payload = {
    sub: '1',
    email: 'admin@shopease.test',
    roles: ['admin', 'customer'],
    iss: 'shopease',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
  };

  const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
  return { token };
}

export async function customerLogin() {
  const secret = process.env.TEST_JWT_SECRET;
  if (!secret) {
    throw new Error('TEST_JWT_SECRET environment variable is required');
  }

  const payload = {
    sub: '2',
    email: 'customer@shopease.test',
    roles: ['customer'],
    iss: 'shopease',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
  };

  const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
  return { token };
}
