#!/usr/bin/env bash
set -euo pipefail
# ensure_test_utils.sh
# Ensure services/test-utils is available in the local Maven repository.
# Usage: ensure_test_utils.sh [workdir]

WORKDIR="${1:-$(pwd)}"
REPO_PATH="$HOME/.m2/repository/org/kunlecreates/test-utils"
ARTIFACT_DIR="$WORKDIR/.m2/repository/org/kunlecreates/test-utils"

echo "Ensuring test-utils available in local maven repo..."

# If artifact already exists in runner local repo, nothing to do
if [ -d "$REPO_PATH" ] && [ -f "$REPO_PATH/0.1.0/test-utils-0.1.0.jar" ]; then
  echo "test-utils already present in $REPO_PATH"
  exit 0
fi

# If artifact is provided in workspace (from artifact download), copy into ~/.m2
if [ -d "$ARTIFACT_DIR" ]; then
  echo "Copying provided test-utils artifact into $REPO_PATH"
  mkdir -p "$(dirname "$REPO_PATH")"
  mkdir -p "$REPO_PATH"
  cp -a "$ARTIFACT_DIR" "$HOME/.m2/repository/org/kunlecreates/"
  # remove Maven marker files that can cache not-found
  find "$HOME/.m2/repository/org/kunlecreates/test-utils" -name "*.lastUpdated" -delete || true
  find "$HOME/.m2/repository/org/kunlecreates/test-utils" -name "_remote.repositories" -delete || true
  echo "Copied and cleaned marker files"
  exit 0
fi

# Otherwise, try to download POM+JAR directly using mvn dependency:get (forces remote)
echo "Attempting to download test-utils from configured remote repositories..."
mvn -B -U org.apache.maven.plugins:maven-dependency-plugin:3.5.0:get \
  -Dartifact=org.kunlecreates:test-utils:0.1.0:jar \
  -Dtransitive=false || true

# Check if download succeeded
if [ -f "$HOME/.m2/repository/org/kunlecreates/test-utils/0.1.0/test-utils-0.1.0.jar" ]; then
  echo "Downloaded test-utils into local repo"
  find "$HOME/.m2/repository/org/kunlecreates/test-utils" -name "*.lastUpdated" -delete || true
  find "$HOME/.m2/repository/org/kunlecreates/test-utils" -name "_remote.repositories" -delete || true
  exit 0
fi

echo "test-utils not available remotely or via provided artifact. Building from source..."

# If source is present in workspace, build and install it
if [ -d "$WORKDIR/services/test-utils" ]; then
  pushd "$WORKDIR/services/test-utils" > /dev/null
  mvn -B -DskipTests install
  popd > /dev/null
  echo "Built and installed test-utils into local maven repo"
  exit 0
fi

echo "ERROR: test-utils not found remotely, in artifact, or as source."
exit 2
