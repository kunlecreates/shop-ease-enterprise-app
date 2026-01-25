import { createProxyHandlers } from '../../_proxy';

// Proxies /api/order/* -> ORDER_SERVICE_INTERNAL_URL + /api/order/*
export const { GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS } = createProxyHandlers(
  'ORDER_SERVICE_INTERNAL_URL',
  '/api/order'
);
