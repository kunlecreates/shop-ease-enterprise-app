#!/usr/bin/env bash
set -euo pipefail

# Push the current branch into the shared PR branch 'feat/dev-tests'.
# Usage: run this from your topic branch with a clean working tree.

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo .)"
cd "$REPO_ROOT"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree must be clean. Commit or stash changes before running this script."
  git status --porcelain
  exit 1
fi

CUR_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CUR_BRANCH" = "feat/dev-tests" ]; then
  echo "You are already on 'feat/dev-tests' — push directly with 'git push origin feat/dev-tests' or switch to a topic branch first."
  exit 1
fi

echo "Updating local refs from origin..."
git fetch origin --prune

echo "Creating/updating local 'feat/dev-tests' from origin/main..."
if git show-ref --verify --quiet refs/remotes/origin/feat/dev-tests; then
  git checkout -B feat/dev-tests origin/feat/dev-tests
else
  git checkout -B feat/dev-tests origin/main
fi

echo "Merging '$CUR_BRANCH' into 'feat/dev-tests'..."
if git merge --no-ff --no-edit "$CUR_BRANCH"; then
  echo "Merge succeeded"
else
  echo "Merge failed due to conflicts. Resolve them manually in 'feat/dev-tests' or abort the merge." >&2
  git merge --abort || true
  exit 2
fi

echo "Pushing 'feat/dev-tests' to origin..."
git push origin feat/dev-tests

# If gh CLI exists, create a PR if one doesn't already exist
if command -v gh >/dev/null 2>&1; then
  echo "Checking for existing PR for 'feat/dev-tests'..."
  EXISTING=$(gh pr list --head feat/dev-tests --json number --limit 1 2>/dev/null || echo '[]')
  if [ "$EXISTING" = "[]" ]; then
    PR_TITLE="dev-tests: merge $CUR_BRANCH"
    PR_BODY="Auto-merged branch $CUR_BRANCH into feat/dev-tests using scripts/push-to-feat-dev-tests.sh\n\nPlease review CI results and squash-merge when ready."
    echo "Creating PR: $PR_TITLE"
    gh pr create --base main --head feat/dev-tests --title "$PR_TITLE" --body "$PR_BODY" || true
  else
    echo "A PR for 'feat/dev-tests' already exists. Opening it in the browser..."
    gh pr view --web --head feat/dev-tests || true
  fi
else
  echo "gh CLI not found. To create a PR, run:\n  gh pr create --base main --head feat/dev-tests --title 'dev-tests: merge $CUR_BRANCH' --body 'Auto-merged $CUR_BRANCH into feat/dev-tests'"
fi

echo "Done. Monitor CI on the 'feat/dev-tests' PR and squash-merge when ready."
