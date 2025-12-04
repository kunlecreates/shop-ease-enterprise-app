<!--
Use this template when creating PRs. This project uses a single shared PR branch
`feat/dev-tests` for development PRs. See `scripts/push-to-feat-dev-tests.sh` for
convenience tooling to update that branch from a topic branch.
-->

## Summary

Describe the change and why it is needed. Keep this short and link to any relevant
issue or discussion.

## Changes

- What changed (files, modules, config)
- High-level intent / rationale

## How to test

Provide steps to reproduce and verify the change locally. Example:

```bash
# from a clone of the repo
git checkout my-topic-branch
# run backend tests
./mvnw -pl services/order-service -DskipTests=false test
# run frontend tests
cd frontend && npm ci && npm test
```

## Checklist

- [ ] CI passes for this branch (unit + integration + Playwright smoke)
- [ ] I ran the relevant tests locally
- [ ] I added or updated tests where applicable
- [ ] I updated documentation if applicable

## Notes
- This repository uses a single shared PR branch: `feat/dev-tests`.
- Preferred flow (minimal friction):
  1. Create a short-lived topic branch for your change (e.g. `fix/login-typo`).
  2. Work and commit on that topic branch.
  3. Run `scripts/push-to-feat-dev-tests.sh` from your topic branch to merge it
     into `feat/dev-tests` and push the updated branch to origin. The script will
     optionally create a PR using the `gh` CLI if available.
  4. Wait for CI on the PR to finish, review results, and squash-merge when ready.

If you prefer direct pushes for trivial edits, pushing to `main` is allowed for
small doc or non-functional changes. For anything that affects tests or CI, use
the `feat/dev-tests` PR flow.
