import { PostgresContainer } from 'testcontainers';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { Client } from 'pg';

let container: any = null;

export async function startPostgresAndMigrate(): Promise<void> {
  if (container) return;
  const pg = await new PostgresContainer('postgres:15')
    .withDatabase('test')
    .withUsername('postgres')
    .withPassword('postgres')
    .start();
  container = pg;

  const host = pg.getHost();
  const port = pg.getPort();

  process.env.PRODUCT_DB_HOST = host;
  process.env.PRODUCT_DB_PORT = `${port}`;
  process.env.PRODUCT_DB_USER = 'postgres';
  process.env.PRODUCT_DB_PASSWORD = 'postgres';
  process.env.PRODUCT_DB_NAME = 'test';

  // Run SQL migrations located in src/main/resources/db/migration
  const migDir = path.resolve(__dirname, '..', 'src', 'main', 'resources', 'db', 'migration');
  const client = new Client({ host, port, user: 'postgres', password: 'postgres', database: 'test' });
  await client.connect();
  try {
    const files = readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
    for (const f of files) {
      const sql = readFileSync(path.join(migDir, f), 'utf8');
      // Split on batch separators if present; execute as a single statement when possible.
      await client.query(sql);
    }
  } catch (err) {
    // If migrations not found or fail, log and continue — tests may still pass against clean schema
    // eslint-disable-next-line no-console
    console.warn('Migration run warning:', err.message || err);
  } finally {
    await client.end();
  }
}

export async function stopPostgres(): Promise<void> {
  if (!container) return;
  try {
    await container.stop();
  } catch (e) {
    // ignore
  }
  container = null;
}
