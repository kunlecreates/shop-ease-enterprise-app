# CI Notes

This document explains how the integration CI works for `shop-ease-enterprise-app` and how `test-utils` is provided to runners.

Key points:

- `services/test-utils` is published to GitHub Packages via the `publish-test-utils` workflow on pushes to `main`/`master`.
- The `integration-tests` workflow prefers to download `test-utils` from the GitHub Packages registry. If not available, it builds and installs `test-utils` from source and uploads a subtree artifact called `test-utils-m2` for matrix jobs to download.
- To authenticate to GitHub Packages the workflows use a `settings.xml` written by `scripts/write_maven_settings.sh` with the `GITHUB_TOKEN`.

Commands you can run locally:

```bash
# write settings
bash scripts/write_maven_settings.sh "$(whoami)" "${GITHUB_TOKEN:-}"

# ensure test-utils is present in ~/.m2 (attempts to download or build)
bash scripts/ensure_test_utils.sh "$(pwd)"

# run one service integration tests (Testcontainers enabled)
bash scripts/smoke_run_service.sh services/user-service
```
