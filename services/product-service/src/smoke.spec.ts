import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('AppModule', () => {
  beforeAll(() => {
    if (!process.env.TEST_POSTGRES) {
      process.env.TEST_SQLITE = '1';
    }
  });
  it('compiles the module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    expect(moduleRef).toBeDefined();
  });
});
