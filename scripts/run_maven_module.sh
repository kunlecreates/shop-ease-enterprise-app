#!/usr/bin/env bash
set -euo pipefail
# Helper to run a Maven goal against a module POM in a multi-module repo
# Usage: ./scripts/run_maven_module.sh <module-path> [<maven-goal> [<mvn-args>...]]

MODULE_PATH="$1"
GOAL="${2:-test}"
shift || true
shift || true
EXTRA_ARGS=("$@")

if [ -z "$MODULE_PATH" ]; then
  echo "Usage: $0 <module-path> [<maven-goal> [<mvn-args>...]]"
  exit 2
fi

POM_FILE="$MODULE_PATH/pom.xml"
if [ ! -f "$POM_FILE" ]; then
  echo "POM not found at $POM_FILE" >&2
  exit 3
fi

echo "Running Maven goal '$GOAL' for module '$MODULE_PATH' (pom: $POM_FILE)"

# Ensure repository-level wrapper is executable if present
if [ -f ./mvnw ]; then
  chmod +x ./mvnw || true
  MVN_CMD=(./mvnw)
elif [ -f "$MODULE_PATH/mvnw" ]; then
  chmod +x "$MODULE_PATH/mvnw" || true
  MVN_CMD=("$MODULE_PATH/mvnw")
else
  MVN_CMD=(mvn)
fi

# Run Maven pointing explicitly at the module POM to avoid reactor selection issues
echo "Using Maven command: ${MVN_CMD[*]} -B -f $POM_FILE $GOAL ${EXTRA_ARGS[*]}"
"${MVN_CMD[@]}" -B -f "$POM_FILE" "$GOAL" "${EXTRA_ARGS[@]}"

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "Maven run failed with exit code $EXIT_CODE" >&2
fi
exit $EXIT_CODE
