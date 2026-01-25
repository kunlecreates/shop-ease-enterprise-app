import { createProxyHandlers } from '../_proxy';

// Proxies /api/notification -> NOTIFICATION_SERVICE_INTERNAL_URL + /api/notification
export const { GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS } = createProxyHandlers(
  'NOTIFICATION_SERVICE_INTERNAL_URL',
  '/api/notification'
);
