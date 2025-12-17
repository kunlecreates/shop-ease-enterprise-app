# order-service Helm Chart

This chart deploys the Order Service (Spring Boot + MS SQL Server).

## Secrets

Database credentials are provided via a Kubernetes Secret and injected as environment variables. The CI workflow can create the Secret per release from GitHub Secrets.

- Secret name (in namespace): `shopease-order-db`
- Expected GitHub Secrets (repo/org):
  - `ORDER_DB_HOST` (e.g., `mssql-svc.mssql-system.svc.cluster.local`)
  - `ORDER_DB_PORT` (e.g., `1433`)
  - `ORDER_DB_NAME` (e.g., `orderdb`)
  - `ORDER_DB_USER`
  - `ORDER_DB_PASSWORD`
  - `ORDER_DATABASE_URL` (optional: full DSN)

The workflow sets Helm with `--set db.secretName=${DB_SECRET_NAME}` so the Deployment loads the Secret with `envFrom`.

## Values

```yaml
db:
  secretName: ""          # Set to the Secret name (e.g., shopease-order-db)
  createDevSecret: false   # Dev only: generate Secret from values.db.dev
  dev: {}
  #  DB_HOST: mssql-svc.mssql-system.svc.cluster.local
  #  DB_PORT: "1433"
  #  DB_NAME: orderdb
  #  DB_USER: sa
  #  DB_PASSWORD: "<change-me>"
  #  DATABASE_URL: sqlserver://sa:<change-me>@mssql-svc.mssql-system.svc.cluster.local:1433?database=orderdb
```

Do not commit real credentials. Use GitHub Secrets or external secret managers in production.
