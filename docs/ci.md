
# CI Notes (updated)

This document explains how the integration CI works for `shop-ease-enterprise-app`.

Key points:

- The previous shared `services/test-utils` artifact is deprecated. Per-service
	test helpers are now included directly inside each service under
	`src/test/java/org/kunlecreates/testutils/`.
- The `publish-test-utils` workflow has been replaced with a DEPRECATED stub.
- Per-service integration tests should be runnable without relying on a
	separately published `test-utils` artifact.

Commands you can run locally:

```bash
# write settings (used by some Maven flows)
bash scripts/write_maven_settings.sh "$(whoami)" "${GITHUB_TOKEN:-}"

# run one service integration tests (Testcontainers enabled)
bash scripts/smoke_run_service.sh services/user-service
```
