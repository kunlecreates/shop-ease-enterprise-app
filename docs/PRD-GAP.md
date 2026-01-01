# PRD Gap Analysis (Snapshot)

This snapshot identifies remaining work vs. implemented scaffolds, focusing on deltas only.

## Implemented (do not duplicate)
-- CI: Previously published `test-utils` to GH Packages; that module is now deprecated/removed. Playwright smoke workflow and integration tests workflow skeleton remain.
- Services: scaffolds for frontend, `user-service`, `product-service`, `order-service`, `notification-service`.

## Gaps
- Product feature set: endpoints + frontend pages need business logic and tests.
- Checkout flow: cart, payment mock adapter, order events & tests.
- Auth flows: login/register UI + protected endpoints.
- Staging deploy: umbrella Helm values and promotion workflow.
- Observability dashboards and minimal alerts.

## Next Actions (non-duplicative)
- Implement product listing MVP (API + UI + tests).
- Add local integration runner script mirroring CI matrix for faster iteration.
- Add staging Helm values and workflow.
