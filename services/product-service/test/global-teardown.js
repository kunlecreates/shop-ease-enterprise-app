const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('Global teardown: stopping Postgres container (ci-product-pg)');
  try {
    try {
      execSync('docker rm -f ci-product-pg', { stdio: 'inherit' });
    } catch (e) {
      console.warn('Failed to remove ci-product-pg container (it may not exist):', e.message);
    }
    const marker = path.resolve(__dirname, '.pg_running');
    if (fs.existsSync(marker)) fs.unlinkSync(marker);
  } catch (err) {
    console.error('Global teardown error:', err);
  }
};
