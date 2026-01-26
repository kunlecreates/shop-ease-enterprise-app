import { createProxyHandlers } from '../_proxy';

// Proxies /api/auth -> USER_SERVICE_INTERNAL_URL + /api/auth
export const { GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS } = createProxyHandlers(
  'USER_SERVICE_INTERNAL_URL',
  '/api/auth'
);
