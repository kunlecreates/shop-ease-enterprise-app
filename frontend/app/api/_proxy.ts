/* Secure internal proxy helpers for Next.js App Router */
import type { NextRequest, NextResponse } from 'next/server';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

const ALLOWED_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const FORWARDED_REQ_HEADERS = ['content-type', 'accept', 'accept-encoding', 'authorization'];

export function buildTargetUrl(baseUrl: string, prefixPath: string, extraSegments: string[] = [], search: URLSearchParams): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const prefix = prefixPath ? (prefixPath.startsWith('/') ? prefixPath : `/${prefixPath}`) : '';
  const encodedSegments = extraSegments.map(s => encodeURIComponent(s));
  const pathTail = encodedSegments.length ? `/${encodedSegments.join('/')}` : '';
  const url = new URL(`${base}${prefix}${pathTail}`);
  // Copy query params
  search.forEach((v, k) => url.searchParams.append(k, v));
  return url.toString();
}

export function pickHeaders(req: NextRequest): Headers {
  const headers = new Headers();
  for (const key of FORWARDED_REQ_HEADERS) {
    const v = req.headers.get(key);
    if (v) headers.set(key, v);
  }
  
  // Add Cloudflare Access service token headers if configured
  // This authenticates the frontend service with Cloudflare Access
  const cfClientId = process.env.CF_ACCESS_CLIENT_ID;
  const cfClientSecret = process.env.CF_ACCESS_CLIENT_SECRET;
  if (cfClientId && cfClientSecret) {
    headers.set('CF-Access-Client-Id', cfClientId);
    headers.set('CF-Access-Client-Secret', cfClientSecret);
  }
  
  return headers;
}

export function getAbortSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs).unref?.();
  return controller.signal;
}

export function createProxyHandlers(envVarName: string, upstreamPrefixPath: string) {
  async function handler(
    req: NextRequest, 
    context: { params: Promise<{ path?: string[] }> }
  ): Promise<NextResponse> {
    // Defer importing NextResponse to runtime to avoid pulling Next's runtime
    // when running unit tests that only exercise helpers in this module.
    // This keeps the helpers testable without Next.js server environment.
    const { NextResponse: RuntimeNextResponse } = await import('next/server');
    try {
      const baseUrl = process.env[envVarName];
      if (!baseUrl) {
        return RuntimeNextResponse.json({ error: `Upstream base URL not configured for ${envVarName}` }, { status: 500 });
      }
      const method = (req.method || 'GET').toUpperCase() as HttpMethod;
      if (!ALLOWED_METHODS.includes(method)) {
        return RuntimeNextResponse.json({ error: 'Method not allowed' }, { status: 405 });
      }

      const params = await context.params;
      const extraSegments = params?.path ?? [];
      const target = buildTargetUrl(baseUrl, upstreamPrefixPath, extraSegments, req.nextUrl.searchParams);

      const timeoutMs = Number(process.env.PROXY_UPSTREAM_TIMEOUT_MS) || 30000;
      const init: RequestInit = {
        method,
        headers: pickHeaders(req),
        redirect: 'manual',
        signal: getAbortSignal(timeoutMs),
      };
      if (method !== 'GET' && method !== 'HEAD') {
        // Stream or clone body
        init.body = req.body;
      }

      const res = await fetch(target, init);

      // Forward response with safe headers
      const outHeaders = new Headers();
      const copyRespHeaders = ['content-type', 'cache-control', 'etag'];
      copyRespHeaders.forEach(h => {
        const v = res.headers.get(h);
        if (v) outHeaders.set(h, v);
      });
      return new RuntimeNextResponse(res.body, { status: res.status, headers: outHeaders });
    } catch (err: any) {
      const msg = err?.name === 'AbortError' ? 'Upstream timeout' : 'Upstream error';
      return RuntimeNextResponse.json({ error: msg }, { status: 502 });
    }
  }

  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    PATCH: handler,
    DELETE: handler,
    HEAD: handler,
    OPTIONS: handler,
  };
}
