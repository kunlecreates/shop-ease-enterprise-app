import { buildTargetUrl, pickHeaders, getAbortSignal, createProxyHandlers } from '../app/api/_proxy';

jest.mock('next/server', () => {
  class MockNextResponse {
    body: unknown;
    status: number;
    headers: Headers;

    constructor(body: unknown, init?: { status?: number; headers?: Headers }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = init?.headers ?? new Headers();
    }

    static json(body: unknown, init?: { status?: number }) {
      return { body, status: init?.status ?? 200 };
    }
  }

  return { NextResponse: MockNextResponse };
});

describe('proxy helpers', () => {
  test('buildTargetUrl assembles URL with path and query', () => {
    const base = 'http://api.test';
    const prefix = '/api';
    const segments = ['foo', 'bar baz'];
    const qs = new URLSearchParams('q=1&a=2');
    const out = buildTargetUrl(base, prefix, segments, qs);
    expect(out.startsWith('http://api.test/api/foo/bar%20baz')).toBe(true);
    expect(out.includes('q=1')).toBe(true);
    expect(out.includes('a=2')).toBe(true);
  });

  test('pickHeaders forwards allowed headers only', () => {
    process.env.CF_ACCESS_CLIENT_ID = 'client-id';
    process.env.CF_ACCESS_CLIENT_SECRET = 'client-secret';
    const req: any = { headers: { get: (k: string) => (k === 'content-type' ? 'application/json' : null) } };
    const headers = pickHeaders(req as any);
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('authorization')).toBeNull();
    expect(headers.get('CF-Access-Client-Id')).toBe('client-id');
    expect(headers.get('CF-Access-Client-Secret')).toBe('client-secret');
  });

  test('getAbortSignal returns a signal object', () => {
    const sig = getAbortSignal(1000);
    expect(typeof sig).toBe('object');
    expect('aborted' in sig).toBe(true);
  });

  test('proxy handler returns 500 when upstream env var is missing', async () => {
    delete process.env.TEST_UPSTREAM_URL;
    const handlers = createProxyHandlers('TEST_UPSTREAM_URL', '/api/test');
    const req: any = {
      method: 'GET',
      headers: { get: () => null },
      nextUrl: { searchParams: new URLSearchParams() },
      clone: () => ({ body: null }),
    };

    const res: any = await handlers.GET(req, { params: Promise.resolve({ path: [] }) } as any);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Upstream base URL not configured for TEST_UPSTREAM_URL' });
  });

  test('proxy handler returns 405 for unsupported methods', async () => {
    process.env.TEST_UPSTREAM_URL = 'http://upstream.local';
    const handlers = createProxyHandlers('TEST_UPSTREAM_URL', '/api/test');
    const req: any = {
      method: 'TRACE',
      headers: { get: () => null },
      nextUrl: { searchParams: new URLSearchParams() },
      clone: () => ({ body: null }),
    };

    const res: any = await handlers.GET(req, { params: Promise.resolve({ path: [] }) } as any);
    expect(res.status).toBe(405);
    expect(res.body).toEqual({ error: 'Method not allowed' });
  });

  test('proxy handler forwards GET response and safe headers', async () => {
    process.env.TEST_UPSTREAM_URL = 'http://upstream.local';
    process.env.PROXY_UPSTREAM_TIMEOUT_MS = '1200';
    const handlers = createProxyHandlers('TEST_UPSTREAM_URL', '/api/test');

    const fetchMock = jest.fn().mockResolvedValue({
      body: 'ok-body',
      status: 204,
      headers: {
        get: (h: string) => ({
          'content-type': 'application/json',
          'cache-control': 'no-cache',
          etag: 'abc',
          'set-cookie': 'drop-me',
        } as Record<string, string | undefined>)[h] ?? null,
      },
    } as any);
    (globalThis as any).fetch = fetchMock;

    const req: any = {
      method: 'GET',
      headers: { get: () => null },
      nextUrl: { searchParams: new URLSearchParams('q=1') },
      clone: () => ({ body: null }),
    };

    const res: any = await handlers.GET(req, { params: Promise.resolve({ path: ['item'] }) } as any);

    expect(fetchMock).toHaveBeenCalled();
    const target = fetchMock.mock.calls[0][0] as string;
    expect(target).toContain('http://upstream.local/api/test/item');
    expect(target).toContain('q=1');
    expect(res.status).toBe(204);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.headers.get('etag')).toBe('abc');
    expect(res.headers.get('set-cookie')).toBeNull();

  });

  test('proxy handler sets body/duplex for non-GET and returns 502 on abort', async () => {
    process.env.TEST_UPSTREAM_URL = 'http://upstream.local';
    const handlers = createProxyHandlers('TEST_UPSTREAM_URL', '/api/test');

    const fetchMock = jest.fn().mockRejectedValue({ name: 'AbortError', message: 'timeout' });
    (globalThis as any).fetch = fetchMock;
    const req: any = {
      method: 'POST',
      headers: { get: (k: string) => (k === 'content-type' ? 'application/json' : null) },
      nextUrl: { searchParams: new URLSearchParams() },
      clone: () => ({ body: 'raw-stream' }),
    };

    const res: any = await handlers.POST(req, { params: Promise.resolve({ path: ['create'] }) } as any);

    const init = fetchMock.mock.calls[0][1] as any;
    expect(init.body).toBe('raw-stream');
    expect(init.duplex).toBe('half');
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'Upstream timeout' });

  });

  test('proxy handler returns 502 on non-timeout upstream errors', async () => {
    process.env.TEST_UPSTREAM_URL = 'http://upstream.local';
    const handlers = createProxyHandlers('TEST_UPSTREAM_URL', '/api/test');
    const fetchMock = jest.fn().mockRejectedValue(new Error('connection reset'));
    (globalThis as any).fetch = fetchMock;

    const req: any = {
      method: 'DELETE',
      headers: { get: () => null },
      nextUrl: { searchParams: new URLSearchParams() },
      clone: () => ({ body: null }),
    };

    const res: any = await handlers.DELETE(req, { params: Promise.resolve({ path: ['id-1'] }) } as any);

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'Upstream error' });

  });
});
