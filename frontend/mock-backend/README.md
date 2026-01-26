# Mock Backend

This lightweight Express mock backend provides simple endpoints used during local development and tests.

Run it locally from the `frontend` directory:

```bash
npm run mock-backend
# or specify a port:
PORT=4001 npm run mock-backend
```

Endpoints:
- `GET /health` — health check
- `GET /api/product` — list of products
- `GET /api/cart` — empty cart
- `POST /api/order` — create an order (returns 201)
- `POST /api/orders` — alias for backward compatibility
- `POST /api/payments` — simulate a successful payment

Use this service when running Playwright locally or when executing the Jest mock-backend tests.
