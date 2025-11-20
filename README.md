# ShopEase Monorepo

Initial Phase 1 scaffolding: services, frontend, helm chart, CI workflow.

## Structure
```
services/
  user-service/ (Spring Boot, Oracle)
  product-service/ (NestJS, PostgreSQL)
  order-service/ (Spring Boot, MSSQL)
  notification-service/ (FastAPI)
frontend/ (Next.js + Tailwind CSS)
helm-charts/ (Umbrella Helm chart skeleton)
.github/workflows (CI pipeline skeleton)
```

## Next Phases
- Domain model & migrations alignment
- Auth / RBAC implementation
- Observability wiring (OTel collectors)
- Deployment manifests expansion

## Security
No secrets committed. All runtime credentials must be injected via environment (Kubernetes Secrets / GitHub Actions). Placeholders like `CHANGE_ME` indicate required secret provisioning.
