const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = async () => {
  console.log('global-teardown: stopping Postgres Testcontainer');
  try {
    const p = path.resolve(__dirname, '.pg_container.json');
    if (!fs.existsSync(p)) {
      console.log('global-teardown: no container info file found');
      return;
    }
    const info = JSON.parse(fs.readFileSync(p, 'utf8'));

    // If we have a container id, remove it directly
    if (info && info.containerId) {
      try {
        execSync(`docker rm -f ${info.containerId}`, { stdio: 'inherit' });
        console.log('global-teardown: removed container', info.containerId);
      } catch (e) {
        console.warn('global-teardown: docker rm failed', e.message || e);
      }
    } else if (info && info.containerName) {
      // If a container name was recorded, remove by name (deterministic)
      try {
        execSync(`docker rm -f ${info.containerName}`, { stdio: 'inherit' });
        console.log('global-teardown: removed container by name', info.containerName);
      } catch (e) {
        console.warn('global-teardown: docker rm by name failed', e.message || e);
      }
    } else if (info && info.port) {
      // Fallback: try to find a container exposing the mapped host port and remove it
      try {
        const port = info.port;
        const ps = execSync("docker ps --format '{{.ID}} {{.Ports}}'", { encoding: 'utf8' });
        const lines = ps.split('\n').map(l => l.trim()).filter(Boolean);
        const matches = [];
        for (const line of lines) {
          const parts = line.split(' ');
          const id = parts[0];
          const ports = parts.slice(1).join(' ');
          if (ports && ports.indexOf(':' + port) !== -1) {
            matches.push(id);
          }
        }
        if (matches.length > 0) {
          try {
            execSync(`docker rm -f ${matches.join(' ')}`, { stdio: 'inherit' });
            console.log('global-teardown: removed containers by port', matches.join(', '));
          } catch (e) {
            console.warn('global-teardown: docker rm by port failed', e.message || e);
          }
        } else {
          console.log('global-teardown: no running container matched port', info.port);
        }
      } catch (e) {
        console.warn('global-teardown: failed to inspect docker ps', e.message || e);
      }
    }

    try { fs.unlinkSync(p); } catch (e) { /* ignore */ }
  } catch (e) {
    console.warn('global-teardown error', e.message || e);
  }
};
