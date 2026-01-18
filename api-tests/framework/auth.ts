import { http, authHeaders } from './http';
import jwt from 'jsonwebtoken';

export async function serviceToken() {
  // If CF service creds exist, return a header set to use for requests.
  if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
    return authHeaders();
  }
  return {};
}

export async function adminLogin() {
  // Generate a local JWT for testing
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

export async function loginAs(userRef: string) {
  // Placeholder login; replace with the actual auth call if available
  return { token: '' };
}
