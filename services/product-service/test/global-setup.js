const fs = require('fs');
const path = require('path');
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Client } = require('pg');

module.exports = async () => {
  console.log('global-setup: starting Postgres Testcontainer');
  const uniqueName = `product-service-test-${Date.now()}-${process.pid}`;

  // Attempt to set a deterministic container name so teardown can remove it reliably.
  let container;
  try {
    container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('test')
      .withUsername('postgres')
      .withPassword('postgres')
      .withName(uniqueName)
      .start();
  } catch (e) {
    // Some testcontainers versions may not support withName(); fall back to unnamed container
    console.warn('global-setup: .withName() not supported or failed, starting without name:', e.message || e);
    container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();
  }

  const host = container.getHost();
  const port = container.getMappedPort(5432);
  const containerId = container.getId ? container.getId() : undefined;

  const info = { host, port, containerId, containerName: uniqueName, user: 'postgres', password: 'postgres', database: 'test' };
  const outPath = path.resolve(__dirname, '.pg_container.json');
  fs.writeFileSync(outPath, JSON.stringify(info));

  // Run migrations (simple SQL runner) if migration directory exists
  const migDir = path.resolve(__dirname, '..', 'src', 'main', 'resources', 'db', 'migration');
  if (fs.existsSync(migDir)) {
    const client = new Client({ host, port, user: 'postgres', password: 'postgres', database: 'test' });
    await client.connect();
    try {
      const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
      for (const f of files) {
        const sql = fs.readFileSync(path.join(migDir, f), 'utf8');
        try {
          await client.query(sql);
        } catch (e) {
          console.warn('migration', f, 'failed:', e.message || e);
        }
      }
    } finally {
      await client.end();
    }
  }

  console.log('global-setup: Postgres started and migrations applied (if present)');
};
