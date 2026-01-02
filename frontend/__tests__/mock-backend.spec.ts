import * as http from 'http';

const PORT = 4001;

describe('mock-backend (in-process)', () => {
  let server: http.Server;

  beforeAll((done) => {
    server = http.createServer((req, res) => {
      if (!req.url) return res.end();
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ok' }));
      }
      if (req.url === '/api/products' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify([{ id: 1, name: 'Apple', price: 100 }]));
      }
      if (req.url === '/api/cart' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ items: [], total: 0 }));
      }
      if (req.url === '/api/orders' && req.method === 'POST') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          const id = Date.now();
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id, status: 'created', payload: body ? JSON.parse(body) : null }));
        });
        return;
      }
      if (req.url === '/api/payments' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, transactionId: `tx-${Date.now()}` }));
      }
      res.writeHead(404); res.end();
    });
    server.listen(PORT, '127.0.0.1', () => done());
  });

  afterAll((done) => { server.close(() => done()); });

  test('GET /api/products returns products array', (done) => {
    http.get(`http://127.0.0.1:${PORT}/api/products`, (res) => {
      expect(res.statusCode).toBe(200);
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        const json = JSON.parse(body);
        expect(Array.isArray(json)).toBe(true);
        expect(json.length).toBeGreaterThan(0);
        done();
      });
    }).on('error', (err) => done(err));
  });

  test('POST /api/orders creates an order', (done) => {
    const data = JSON.stringify({ customer: 'test', items: [] });
    const req = http.request({ hostname: '127.0.0.1', port: PORT, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (res) => {
      expect(res.statusCode).toBe(201);
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        const json = JSON.parse(body);
        expect(json.id).toBeDefined();
        expect(json.status).toBe('created');
        done();
      });
    });
    req.on('error', (e) => done(e));
    req.write(data);
    req.end();
  });
});
