#!/usr/bin/env bash
set -euo pipefail

# Run per-service integration tests locally in a way that mirrors CI.
# Requires: Docker, Java 21, Node 20 where applicable. Uses Testcontainers (Postgres).

ROOT_DIR="$(cd "${BASH_SOURCE[0]%/*}"/.. && pwd)"
pushd "$ROOT_DIR" >/dev/null

echo "Running local integration matrix (Postgres Testcontainers)"

run_mvn_module() {
  local module_dir="$1"
  if [ -f "$module_dir/pom.xml" ]; then
    echo "--- Maven test: $module_dir ---"
    mvn -B -f "$module_dir/pom.xml" -Dtestcontainers.enabled=true -DskipITs=false test
  else
    echo "Skipping $module_dir (no pom.xml)"
  fi
}

# Java services
run_mvn_module services/user-service || true
run_mvn_module services/order-service || true

# NestJS product-service: run unit/e2e with PostgreSQL Testcontainers if configured.
if [ -f services/product-service/package.json ]; then
  echo "--- Node tests: services/product-service ---"
  pushd services/product-service >/dev/null
  if [ -f package-lock.json ]; then npm ci; else npm install; fi
  npx jest --coverage || true
  popd >/dev/null
fi

# FastAPI notification-service: install deps and run pytest if tests present.
if [ -f services/notification-service/requirements.txt ]; then
  echo "--- Python tests: services/notification-service ---"
  pushd services/notification-service >/dev/null
  python3 -m venv .venv || true
  source .venv/bin/activate
  pip install --upgrade pip
  if [ -f requirements-dev.txt ]; then pip install -r requirements-dev.txt; fi
  pip install -r requirements.txt
  if [ -d tests ]; then
    pytest -q || true
  else
    echo "No tests/ directory found; skipping pytest"
  fi
  deactivate || true
  popd >/dev/null
fi

# Optional curl smokes against standardized API paths if BASE_URL is set
if [ -n "${BASE_URL:-}" ]; then
  echo "--- Curl smokes against ${BASE_URL} ---"
  for path in \
    "/api/product" \
    "/api/user" \
    "/api/order" \
    "/api/notification/health"; do
    echo "GET ${BASE_URL}${path}"
    curl -fsS -o /dev/null -w "%{http_code} %{time_total}\n" "${BASE_URL}${path}" || echo "Smoke failed for ${path}"
  done
else
  echo "BASE_URL not set; skipping curl smokes"
fi

echo "Matrix run complete. See service-specific reports for details."

popd >/dev/null
