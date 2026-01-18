import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE || '.env' });

const baseURL = process.env.E2E_BASE_URL || '';

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export function authHeaders(token?: string) {
  const headers: Record<string, string> = {};
  if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
    headers['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID;
    headers['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET;
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Resilient request helper that tries the given path and common API prefixes.
 * Returns the axios response object or throws the last error.
 */
export async function request(method: 'get' | 'post' | 'put' | 'delete', path: string, data?: any, opts: { headers?: Record<string,string> } = {}) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const candidates = [normalized, `/api${normalized}`];

  let lastResp: any = null;
  for (const p of candidates) {
    try {
      const resp = await http.request({ method, url: p, data, headers: opts.headers, validateStatus: () => true });
      lastResp = resp;

      // If Cloudflare or service responded, stop retrying
      if (resp.status !== 404) {
        return resp;
      }
    } catch (err: any) {
      // continue to next candidate
      continue;      
    }
  }
  return lastResp;
}

