/**
 * API Contract Test HTTP Clients
 * 
 * These clients connect directly to Kubernetes services for isolated API contract testing.
 * No ingress, no Cloudflare Access, no frontend proxy - direct service-to-service testing.
 */
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE || '.env' });

// Direct Kubernetes service URLs for API contract testing
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || '';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || '';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || '';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || '';

// Service-specific HTTP clients for direct API contract testing
export const productHttp: AxiosInstance = axios.create({
  baseURL: PRODUCT_SERVICE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' }
});

export const userHttp: AxiosInstance = axios.create({
  baseURL: USER_SERVICE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' }
});

export const orderHttp: AxiosInstance = axios.create({
  baseURL: ORDER_SERVICE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' }
});

export const notificationHttp: AxiosInstance = axios.create({
  baseURL: NOTIFICATION_SERVICE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' }
});

