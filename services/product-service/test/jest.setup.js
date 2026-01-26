const fs = require('fs');
const path = require('path');

// Load Testcontainer connection info if present and set env vars for TypeORM
const p = path.resolve(__dirname, '.pg_container.json');
if (fs.existsSync(p)) {
  try {
    const info = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (info.host) process.env.PRODUCT_DB_HOST = info.host;
    if (info.port) process.env.PRODUCT_DB_PORT = '' + info.port;
    if (info.user) process.env.PRODUCT_DB_USER = info.user;
    if (info.password) process.env.PRODUCT_DB_PASSWORD = info.password;
    if (info.database) process.env.PRODUCT_DB_NAME = info.database;
    // ensure tests don't try sqlite
    delete process.env.TEST_SQLITE;
    console.log('jest.setup: set PRODUCT_DB_HOST=%s PRODUCT_DB_PORT=%s', process.env.PRODUCT_DB_HOST, process.env.PRODUCT_DB_PORT);
  } catch (e) {
    console.warn('jest.setup: failed to read .pg_container.json', e.message || e);
  }
} else {
  console.log('jest.setup: no .pg_container.json found; using defaults');
}
