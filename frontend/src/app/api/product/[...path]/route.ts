import { createProxyHandlers } from '../../_proxy';

// Proxies /api/product/* -> PRODUCT_SERVICE_INTERNAL_URL + /api/product/*
export const { GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS } = createProxyHandlers(
  'PRODUCT_SERVICE_INTERNAL_URL',
  '/api/product'
);
