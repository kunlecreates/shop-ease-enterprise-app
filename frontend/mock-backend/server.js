const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Health check used by CI wait-on
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Simple in-memory fixtures
const products = [
  { id: 1, name: 'Apple', price: 100 },
  { id: 2, name: 'Orange', price: 80 }
];

let orders = [];

app.get('/api/product', (req, res) => {
  res.json(products);
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [], total: 0 });
});

function createOrderHandler(req, res) {
  const id = orders.length + 1;
  const order = Object.assign({ id, status: 'created' }, req.body || {});
  orders.push(order);
  res.status(201).json(order);
}

// Preferred singular endpoint
app.post('/api/order', createOrderHandler);
// Backwards-compatible plural alias
app.post('/api/orders', createOrderHandler);

app.post('/api/payments', (req, res) => {
  // Simulate a successful payment
  res.status(200).json({ success: true, transactionId: `tx-${Date.now()}` });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock backend listening on http://localhost:${port}`);
});
