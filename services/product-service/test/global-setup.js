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

  // Run test-only seed migrations first (if present), then production migrations.
  const testMigDir = path.resolve(__dirname, 'test-migration');
  const migDir = path.resolve(__dirname, '..', 'src', 'main', 'resources', 'db', 'migration');
  if (fs.existsSync(testMigDir) || fs.existsSync(migDir)) {
    const client = new Client({ host, port, user: 'postgres', password: 'postgres', database: 'test' });
    await client.connect();
    try {
      // Apply test-only migrations first. These are intended to create minimal schema and tables
      // required so production migrations (which may assume objects exist) can run in a fresh DB.
      if (fs.existsSync(testMigDir)) {
        const testFiles = fs.readdirSync(testMigDir).filter(f => f.endsWith('.sql')).sort();
        for (const f of testFiles) {
          const sql = fs.readFileSync(path.join(testMigDir, f), 'utf8');
          try {
            await client.query(sql);
          } catch (e) {
            console.warn('test-migration', f, 'failed:', e.message || e);
          }
        }
      }

      // Ensure the canonical schema exists in the test DB so migrations that perform ALTERs don't fail.
      // This is safe for tests only and does not modify production migrations.
      try {
        await client.query("CREATE SCHEMA IF NOT EXISTS product_svc AUTHORIZATION postgres;");
      } catch (e) {
        console.warn('global-setup: create schema product_svc failed:', e.message || e);
      }

      if (fs.existsSync(migDir)) {
        const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
        for (const f of files) {
          const sql = fs.readFileSync(path.join(migDir, f), 'utf8');
          try {
            await client.query(sql);
          } catch (e) {
            console.warn('migration', f, 'failed:', e.message || e);
          }
        }
      }
    } finally {
      await client.end();
    }
  }

  console.log('global-setup: Postgres started and migrations applied (if present)');
};
