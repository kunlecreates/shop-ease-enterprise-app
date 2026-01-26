# ShopEase Roadmap (Concise)

This roadmap aligns the PRD with the existing microservices repo and CI. It prioritizes high-impact deliverables without duplicating work already present.

## Milestones

- Foundation & Alignment
  - Docs: PRD → repo mapping, contributor guide
  - CI: stable integration matrix, Playwright smoke maintained

- Product & Catalog (API + UI)
  - Product listing, categories, inventory endpoints (NestJS `product-service`)
  - Frontend pages and Playwright smoke for listing

- Orders & Checkout
  - Cart, checkout, order lifecycle, payment mock adapter (Spring `order-service`)
  - E2E: frontend → API → DB, event emission validated

- User Auth & Profiles
  - JWT auth, roles, profile management (Spring `user-service`)

- Staging Deploy & Migrations
  - Helm staging values + promotion workflow
  - Flyway migration job per service

- Observability & SLOs
  - OTel traces, Prometheus metrics, Grafana dashboards; basic alerts

## Immediate Plan (Next PRs)

1. ci/local-integration-runner: add local script mirroring CI matrix (Testcontainers on Postgres)
2. feat/product-listing: minimal product endpoints + frontend listing + tests
3. chore/helm-staging: staging values and deploy workflow

## Acceptance Criteria (Samples)

- Product listing returns paginated results; UI renders grid; Playwright smoke passes.
- Checkout creates orders, persists, and emits `OrderCreated` event; integration tests pass.
- Staging deployment succeeds and runs Flyway migrations before app pods.
