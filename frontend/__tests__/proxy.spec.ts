import { buildTargetUrl, pickHeaders, getAbortSignal } from '../app/api/_proxy';

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
    const req: any = { headers: { get: (k: string) => (k === 'content-type' ? 'application/json' : null) } };
    const headers = pickHeaders(req as any);
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('authorization')).toBeNull();
  });

  test('getAbortSignal returns a signal object', () => {
    const sig = getAbortSignal(1000);
    expect(typeof sig).toBe('object');
    expect('aborted' in sig).toBe(true);
  });
});
