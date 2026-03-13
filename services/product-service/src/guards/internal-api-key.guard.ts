import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Guards service-to-service internal endpoints.
 * Validates the X-Internal-Api-Key header against the INTERNAL_SERVICE_API_KEY env var.
 * Use this instead of JwtAuthGuard for system-initiated calls (e.g. stock reconciliation from order-service).
 */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const internalKey = process.env.INTERNAL_SERVICE_API_KEY;
    if (!internalKey) {
      throw new UnauthorizedException('Internal service API key is not configured');
    }
    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-internal-api-key'];
    if (!provided || provided !== internalKey) {
      throw new UnauthorizedException('Invalid or missing internal service API key');
    }
    return true;
  }
}
