const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

module.exports = async () => {
  console.log('Global setup: starting Postgres docker container (ci-product-pg)');
  try {
    // Try to run container; if exists, start it
    try {
      execSync('docker run -d --name ci-product-pg -p 5433:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=test postgres:15', { stdio: 'inherit' });
    } catch (err) {
      // If container already exists, start it
      try {
        execSync('docker start ci-product-pg', { stdio: 'inherit' });
      } catch (e) {
        console.warn('Failed to start existing ci-product-pg container:', e.message);
      }
    }

    // Wait for Postgres to be ready
    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        execSync('docker exec ci-product-pg pg_isready -U postgres');
        ready = true;
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    if (!ready) {
      throw new Error('Postgres container did not become ready');
    }

    // Run SQL migrations from src/main/resources/db/migration if present
    const migDir = path.resolve(__dirname, '..', 'src', 'main', 'resources', 'db', 'migration');
    if (fs.existsSync(migDir)) {
      const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
      const client = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgres', database: 'test' });
      await client.connect();
      for (const f of files) {
        const sql = fs.readFileSync(path.join(migDir, f), 'utf8');
        try {
          await client.query(sql);
        } catch (e) {
          console.warn('Migration', f, 'failed:', e.message);
        }
      }
      await client.end();
    }

    // Write a marker file so tests or chores can see container is running
    const marker = path.resolve(__dirname, '.pg_running');
    fs.writeFileSync(marker, 'localhost:5433');
    console.log('Global setup complete: Postgres ready at localhost:5433');
  } catch (err) {
    console.error('Global setup failed:', err);
    throw err;
  }
};
