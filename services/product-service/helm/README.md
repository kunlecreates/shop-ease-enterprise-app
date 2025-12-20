# product-service Helm Chart

This chart deploys the Product Service (NestJS + PostgreSQL).

## Secrets

Database credentials are provided via a Kubernetes Secret and injected as environment variables. The CI workflow can create the Secret per release from GitHub Secrets.

- Secret name (in namespace): `shopease-product-db`
- Expected GitHub Secrets (repo/org):
  - `PRODUCT_DB_HOST` (e.g., `postgresql.postgres-system.svc.cluster.local`)
  - `PRODUCT_DB_PORT` (e.g., `5432`)
  - `PRODUCT_DB_NAME` (e.g., `productdb`)
  - `PRODUCT_DB_USER`
  - `PRODUCT_DB_PASSWORD`
  - `PRODUCT_DATABASE_URL` (optional: full DSN)

The workflow sets Helm with `--set db.secretName=${DB_SECRET_NAME}` so the Deployment loads the Secret with `envFrom`.

## Values

```yaml
db:
  secretName: ""          # Set to the Secret name (e.g., shopease-product-db)
  createDevSecret: false   # Dev only: generate Secret from values.db.dev
  dev: {}
  #  PRODUCT_DB_HOST: postgresql.postgres-system.svc.cluster.local
  #  PRODUCT_DB_PORT: "5432"
  #  PRODUCT_DB_NAME: productdb
  #  PRODUCT_DB_USER: devuser
  #  PRODUCT_DB_PASSWORD: devpass
  #  PRODUCT_DATABASE_URL: postgresql://devuser:devpass@postgresql.postgres-system.svc.cluster.local:5432/productdb
```

Do not commit real credentials. Use GitHub Secrets or external secret managers in production.
