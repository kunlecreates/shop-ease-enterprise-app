# user-service Helm Chart

This chart deploys the User Service (Spring Boot + Oracle DB).

## Secrets

Database credentials are provided via a Kubernetes Secret and injected as environment variables. The CI workflow can create the Secret per release from GitHub Secrets.

- Secret name (in namespace): `shopease-user-db`
- Expected GitHub Secrets (repo/org):
  - `USER_DB_HOST` (e.g., `oracledb.oracle-system.svc.cluster.local`)
  - `USER_DB_PORT` (e.g., `1521`)
  - `USER_DB_NAME` (e.g., `oracledb`)
  - `USER_DB_USER`
  - `USER_DB_PASSWORD`
  - `USER_DATABASE_URL` (optional: full DSN)

The workflow sets Helm with `--set db.secretName=${DB_SECRET_NAME}` so the Deployment loads the Secret with `envFrom`.

## Values

```yaml
db:
  secretName: ""          # Set to the Secret name (e.g., shopease-user-db)
  createDevSecret: false   # Dev only: generate Secret from values.db.dev
  dev: {}
  #  DB_HOST: oracledb.oracle-system.svc.cluster.local
  #  DB_PORT: "1521"
  #  DB_NAME: XE
  #  DB_USER: devuser
  #  DB_PASSWORD: devpass
  #  DATABASE_URL: oracle+thin:@oracledb.oracle-system.svc.cluster.local:1521/XE
```

Do not commit real credentials. Use GitHub Secrets or external secret managers in production.
