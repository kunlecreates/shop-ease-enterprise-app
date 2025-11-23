const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Basic placeholder endpoints used by the frontend smoke tests.
app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Mock Product', price: 9.99 }
  ]);
});

app.post('/api/cart', (req, res) => {
  // echo the payload as confirmation
  res.status(201).json({ success: true, cart: req.body });
});

app.listen(port, () => {
  console.log(`Mock backend listening on port ${port}`);
});
