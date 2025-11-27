#!/usr/bin/env bash
set -euo pipefail
# poll_and_triage_ci.sh
# Usage: ./scripts/poll_and_triage_ci.sh <owner/repo> <branch> [--pr <pr-number>] [--timeout-min 30]
# Requires: GitHub CLI `gh` authenticated with access to repo, python3

REPO=${1:-}
BRANCH=${2:-}
PR_NUMBER=""
TIMEOUT_MIN=${4:-30}

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <owner/repo> <branch> [--pr <pr-number>] [--timeout-min <minutes>]"
  exit 2
fi

while [ "$#" -gt 0 ]; do
  case "$1" in
    --pr) PR_NUMBER="$2"; shift 2 ;;
    --timeout-min) TIMEOUT_MIN="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install and authenticate 'gh auth login' before running this script." >&2
  exit 3
fi

START=$(date +%s)
END=$((START + TIMEOUT_MIN*60))
SLEEP=15

echo "Polling latest workflow run for branch '$BRANCH' in repo '$REPO' (timeout ${TIMEOUT_MIN}m)"

while true; do
  now=$(date +%s)
  if [ "$now" -ge "$END" ]; then
    echo "Timed out waiting for workflow run to finish" >&2
    exit 4
  fi

  # get latest run id for the workflow file name matching 'Playwright Smoke Tests (clean)' or overall latest for branch
  RUN_INFO=$(gh run list --repo "$REPO" --branch "$BRANCH" --limit 5 --json databaseId,status,conclusion,headBranch -q '.[] | select(.headBranch=="'"$BRANCH"'" ) | {id: .databaseId, status: .status, conclusion: .conclusion}' || true)
  if [ -z "$RUN_INFO" ]; then
    echo "No workflow runs found yet for branch $BRANCH; sleeping $SLEEP s..."
    sleep $SLEEP
    continue
  fi

  # pick the most recent run id
  RUN_ID=$(gh run list --repo "$REPO" --branch "$BRANCH" --limit 1 --json databaseId,status,conclusion -q '.[0].databaseId') || true
  STATUS=$(gh run view --repo "$REPO" "$RUN_ID" --json status,conclusion -q '.status') || true
  CONCL=$(gh run view --repo "$REPO" "$RUN_ID" --json status,conclusion -q '.conclusion') || true

  echo "Found run id=$RUN_ID status=$STATUS conclusion=$CONCL"
  if [ "$STATUS" = "completed" ]; then
    echo "Run completed (conclusion=$CONCL). Downloading artifacts..."
    DESTDIR="tmp/gh-run-artifacts-$RUN_ID"
    rm -rf "$DESTDIR"
    mkdir -p "$DESTDIR"
    gh run download --repo "$REPO" "$RUN_ID" --dir "$DESTDIR" || true

    # Look for Playwright report index.html in common locations
    REPORT_HTML=""
    if [ -f "$DESTDIR/playwright-debug-artifacts/playwright-report/index.html" ]; then
      REPORT_HTML="$DESTDIR/playwright-debug-artifacts/playwright-report/index.html"
    elif [ -f "$DESTDIR/frontend/test-results/playwright-report/index.html" ]; then
      REPORT_HTML="$DESTDIR/frontend/test-results/playwright-report/index.html"
    fi

    if [ -z "$REPORT_HTML" ]; then
      echo "No Playwright HTML report found in artifacts. Listing artifact files:"; find "$DESTDIR" -type f -maxdepth 4 -print | sed -n '1,200p'
    else
      echo "Found report at: $REPORT_HTML"
      SUMMARY_DIR="$DESTDIR/playwright-summary"
      mkdir -p "$SUMMARY_DIR"
      python3 scripts/summarize_playwright_report.py "$REPORT_HTML" "$SUMMARY_DIR" || true
      python3 scripts/extract_playwright_failures.py "$REPORT_HTML" "$SUMMARY_DIR" || true
      echo "Summary:"; cat "$SUMMARY_DIR/summary.json" || true
      echo "Failures:"; cat "$SUMMARY_DIR/failures.json" || true

      # If failures exist, optionally create an issue or comment on PR
      if [ -s "$SUMMARY_DIR/failures.json" ]; then
        if [ -n "$PR_NUMBER" ]; then
          echo "Posting comment on PR #$PR_NUMBER with failure summary"
          gh pr comment --repo "$REPO" "$PR_NUMBER" --body "Playwright smoke tests reported failures. See attached summary and failures.json." || true
          gh run download --repo "$REPO" "$RUN_ID" --dir "$SUMMARY_DIR" --name failures.json || true
        else
          echo "Failures detected. Run 'gh run download' to retrieve artifacts or provide --pr <number> to post a comment."
        fi
      fi
    fi
    exit 0
  else
    echo "Run status is $STATUS; sleeping $SLEEP s..."
    sleep $SLEEP
  fi
done
