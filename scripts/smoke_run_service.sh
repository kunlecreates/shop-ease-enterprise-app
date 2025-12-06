#!/usr/bin/env bash
set -euo pipefail
# smoke_run_service.sh - run a single service integration verify locally (uses MAVEN and Testcontainers)
# Usage: smoke_run_service.sh <service-dir> [additional maven args]

SERVICE_DIR="${1:-services/user-service}"
shift || true
MAVEN_ARGS="$@"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "Writing maven settings to use GitHub Packages (local runner)"
bash ./scripts/write_maven_settings.sh "${GITHUB_ACTOR:-$(whoami)}" "${GITHUB_TOKEN:-}" || true

echo "Ensuring test-utils is available in local repo"
bash ./scripts/ensure_test_utils.sh "$PWD"

echo "Running mvn verify for $SERVICE_DIR"
mvn -B -s $HOME/.m2/settings.xml -U -f "$SERVICE_DIR" -Dtestcontainers.enabled=true $MAVEN_ARGS verify
