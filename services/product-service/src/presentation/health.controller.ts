import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  // Exposed at /api/health because the application sets a global prefix 'api'
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
