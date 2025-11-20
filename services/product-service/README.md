# Product Service (ShopEase)

Manages products, categories, inventory, pricing.

## Phase 2 Status
- Domain Entities: Product, Category, StockMovement
- CRUD: Create & list products with category auto-provision
- Inventory: Adjust stock (increment/decrement) with non-negative constraint
- Validation: DTO + global ValidationPipe
- Migrations: Initial schema migration (Postgres) + CLI scripts
- Testing: Unit test for product creation & stock adjustment (sqlite in-memory)

## API
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| PATCH | `/api/products/:sku/stock` | Adjust stock |

## Run (Postgres)
```bash
npm install
npm run migration:run
npm run dev
```

## Test (sqlite in-memory)
```bash
npm test
```

## Env Vars
`POSTGRES_HOST` `POSTGRES_PORT` `POSTGRES_USER` `POSTGRES_PASSWORD` `POSTGRES_DB` (default product_svc) `TEST_SQLITE`

## Migrations
```bash
npm run migration:generate
npm run migration:run
```

## Stock Calculation
Sum of all movement quantities for a product. Decrement rejected if result would go negative.

## Roadmap
Add auth, tracing, metrics, price rules, caching.