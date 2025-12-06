# test-utils Developer Notes

The `services/test-utils` module contains shared Flyway migrations and helpers used by integration tests across services.

Location: `services/test-utils/migrations`

How it's consumed in CI:
- The `integration-tests` workflow will attempt to download `org.kunlecreates:test-utils:0.1.0` from the GitHub Packages registry.
- If the artifact is not present, CI will build and `mvn install` the module and share the local repository subtree as an artifact called `test-utils-m2`.

When developing locally:
- Update migrations under `services/test-utils/migrations/sql`.
- Bump the version in `services/test-utils/pom.xml` and run the `publish-test-utils` workflow (push to main or use `workflow_dispatch`) to publish to GitHub Packages.
