import { createProxyHandlers } from '../_proxy';

// Proxies /api/user -> USER_SERVICE_INTERNAL_URL + /api/user
export const { GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS } = createProxyHandlers(
  'USER_SERVICE_INTERNAL_URL',
  '/api/user'
);
