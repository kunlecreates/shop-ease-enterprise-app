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

## Product Service Helm chart

Migration — CI-run Flyway (recommended)

For CI and staging, the repository builds a Flyway image containing the SQL migration files and the deploy workflow renders and runs the chart's migration Job before deploying the application. This is the recommended, authoritative migration path for staging and CI.

Required GitHub Secrets for CI-run Flyway (product):
- `PRODUCT_DB_HOST`, `PRODUCT_DB_PORT`, `PRODUCT_DB_NAME` — database address details
- `PRODUCT_MIG_DB_USER`, `PRODUCT_MIG_DB_PASSWORD` — a dedicated migration user with appropriate privileges

How it works
- CI builds a Flyway image for this service using `services/product-service/Dockerfile.flyway` and tags it `ghcr.io/<owner>/product-service-flyway:staging-<sha>`.
- The deploy workflow creates a Kubernetes migration Secret (e.g. `shopease-product-db-migration`) from the GitHub Secrets above.
- The workflow then renders and applies `templates/migration-job.yaml` with `migration.image`/`migration.tag` set to the immutable CI-built image, waits for completion, and proceeds with the Helm upgrade/install.

Defaults
- `flyway.enabled` is `false` for staging/CI so the application does not auto-run migrations on startup.
- The chart includes `templates/migration-job.yaml` as an opt-in Job that runs Flyway inside the cluster when `migration.enabled=true` and a migration secret is provided.

Operational notes
- Ensure the CI-built Flyway image tag (e.g. `staging-<sha>`) is passed through to the Helm args so the Job pulls the exact migration image built for the commit.
- Do NOT enable in-app migrations in production without careful review — prefer CI-run or orchestrated Jobs with dedicated migration users.

## Notes

Do not commit real credentials. Use GitHub Secrets or external secret managers in production.
