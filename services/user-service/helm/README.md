# user-service Helm Chart

This chart deploys the User Service (Spring Boot + Oracle DB).

  Overview
  --------

  This chart manages runtime configuration for `user-service`. Database credentials are injected from a Kubernetes Secret (the deploy workflow can create this per-release from GitHub Secrets). Migrations for staging are expected to be executed from CI (GitHub Actions) by default; the chart includes an optional in-cluster migration Job for manual use.

  Secrets
  -------

  - Secret name (in namespace): `shopease-user-db`
  - Expected GitHub Secrets (repo/org) to create the above Secret:
    - `USER_DB_HOST` (e.g., `oracledb.oracle-system.svc.cluster.local`)
    - `USER_DB_PORT` (optional, default `1521`)
    - `USER_DB_NAME` (optional, default `XE`)
    - `USER_DB_USER`
    - `USER_DB_PASSWORD`
    - `USER_DATABASE_URL` (optional full DSN)

  The deploy workflow sets Helm with `--set db.secretName=${DB_SECRET_NAME}` so the Deployment loads the Secret with `envFrom`.

  Values (db)
  -----------

  Example values snippet:

  ```yaml
  db:
    secretName: ""          # Set to the Secret name (e.g., shopease-user-db)
    createDevSecret: false   # Dev only: generate Secret from values.db.dev
    dev: {}
  ```

  Migration — CI-run Flyway (recommended)
  --------------------------------------

  For CI and staging the repository runs Flyway from the runner before Helm applies the chart. This is the recommended, authoritative migration path for staging and CI.

  - Required GitHub Secrets for CI-run Flyway (user):
    - `USER_DB_HOST`, `USER_DB_PORT` (optional), `USER_DB_NAME` (optional)
    - `USER_MIG_DB_USER` (migration DB user with DDL privileges)
    - `USER_MIG_DB_PASSWORD`

  - The workflow mounts `services/user-service/src/main/resources/db/migration` into the Flyway container and runs `flyway migrate`.
  - If migration SQL files are present in the repository but migration secrets are missing, the workflow will fail to avoid accidental partial deployments.

  Migration Job (chart) — optional
  --------------------------------

  The chart includes an optional `templates/migration-job.yaml` that can run Flyway inside the cluster. This Job is provided as a manual/debugging option only and is not applied automatically by the CI workflow to avoid duplicate execution.

  Usage:

  - Set `migration.enabled=true` and provide `migration.secretName` pointing to a Kubernetes Secret containing `MIG_DB_USER`, `MIG_DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `DB_NAME`.
  - For dev-only usage, set `migration.createSecret=true` and populate `migration.secretData` (NOT for production).

  Important: Creating a Kubernetes Secret does not create the corresponding DB user. Ensure the DB user exists and has DDL privileges before running the Job.

  Default Flyway mode
  -------------------

  For staging and CI-driven deploys this chart defaults to `flyway.enabled: false` so migrations are run out-of-process by CI. Set `flyway.enabled=true` only for manual or development deployments where you intentionally want the application to run migrations on startup.

  Notes
  -----

  - Do not commit real credentials. Use GitHub Secrets or an external secret manager in production.
