import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('AppModule', () => {
  beforeAll(() => {
    // If a Testcontainers Postgres instance is provided, prefer it.
    const containerFile = path.resolve(__dirname, '..', 'test', '.pg_container.json');
    if (!fs.existsSync(containerFile) && !process.env.PRODUCT_DB_HOST) {
      process.env.TEST_SQLITE = '1';
    } else {
      delete process.env.TEST_SQLITE;
    }
  });

  it('compiles the module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    expect(moduleRef).toBeDefined();
  });
});
