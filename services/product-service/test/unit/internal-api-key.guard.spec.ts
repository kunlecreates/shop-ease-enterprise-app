import { UnauthorizedException } from '@nestjs/common';
import { InternalApiKeyGuard } from '../../src/guards/internal-api-key.guard';

describe('InternalApiKeyGuard', () => {
  const guard = new InternalApiKeyGuard();
  const originalEnv = process.env.INTERNAL_SERVICE_API_KEY;

  afterEach(() => {
    process.env.INTERNAL_SERVICE_API_KEY = originalEnv;
  });

  function contextWithHeader(value?: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-internal-api-key': value } }),
      }),
    } as any;
  }

  it('throws when internal key is not configured', () => {
    delete process.env.INTERNAL_SERVICE_API_KEY;
    expect(() => guard.canActivate(contextWithHeader('abc'))).toThrow(UnauthorizedException);
  });

  it('throws when header is missing or invalid', () => {
    process.env.INTERNAL_SERVICE_API_KEY = 'expected-key';
    expect(() => guard.canActivate(contextWithHeader(undefined))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(contextWithHeader('wrong-key'))).toThrow(UnauthorizedException);
  });

  it('allows request when header matches configured key', () => {
    process.env.INTERNAL_SERVICE_API_KEY = 'expected-key';
    expect(guard.canActivate(contextWithHeader('expected-key'))).toBe(true);
  });
});