# Infra Provisioning Workflow

This document explains the purpose and usage of the `infra-provisioning` GitHub Actions workflow located at `.github/workflows/infra-provisioning.yml`.

## Purpose
- Create or update DB and notification secrets in service namespaces from GitHub Secrets.
- Optionally render and run Helm migration Jobs for `product`, `user`, and `order` services.

This workflow is intentionally minimal and intended to be run separately from the main deploy workflow. Secrets and migrations are delegated to this infra workflow so the deploy workflow remains focused and fast.

## Inputs
- `services` (string): comma-separated list or `all`. Default: `all`.
- `image_tag` (string): optional image tag used when rendering migration Jobs.
- `run_migrations` (boolean): `true`/`false` to control whether migration Jobs are executed. Default: `true`.

## Required GitHub Secrets
Define the following secrets in the repository or organization for the services you want to provision.

- For `product`, `user`, `order` DB secrets (example for `product`):
  - `PRODUCT_HOST`, `PRODUCT_PORT`, `PRODUCT_NAME`, `PRODUCT_USER`, `PRODUCT_PASSWORD`
  - Optional migration creds: `PRODUCT_MIG_DB_USER`, `PRODUCT_MIG_DB_PASSWORD`

- For `notification` credentials:
  - `NOTIFICATION_HOST`, `NOTIFICATION_PORT`, `NOTIFICATION_USER`, `NOTIFICATION_PASSWORD`, `NOTIFICATION_FROM`

Secrets are mapped into Kubernetes `Secret` objects using `kubectl create secret generic --from-literal=...` and applied with `kubectl apply`.

## Where it runs
- This workflow expects to run on an in-cluster ARC runner (same pattern used by the deploy workflow). It configures an in-cluster `kubeconfig` from the runner ServiceAccount.

## How to run
1. Ensure the required GitHub Secrets are set.
2. From the GitHub UI, open the workflow and click `Run workflow`, or use the `gh` CLI, e.g.:

```bash
gh workflow run infra-provisioning.yml -f services=product,user -f image_tag=staging-abc123 -f run_migrations=true
```

## Behavior and idempotency
- Secrets: only present keys are included; applying the generated secret manifests is idempotent (`kubectl apply`).
- Migrations: if `run_migrations=true`, the workflow renders the chart's `templates/migration-job.yaml` and applies it, then waits (600s) for job completion. If you prefer a separate migration pipeline or Helm hook, set `run_migrations=false`.

## Notes & Troubleshooting
- Ensure the ARC runner has network access and permissions to create namespaces/secrets and run Jobs.
- If using sealed-secrets or another secret operator, replace the secret creation steps in the workflow with your preferred mechanism.
- Logs from the workflow will show applied manifests and job logs when migration Jobs fail.

## Next steps
- Consider integrating this workflow into your release automation: run `infra-provisioning` prior to `deploy-staging` in your pipeline, or trigger it manually as part of pre-deploy operations.
