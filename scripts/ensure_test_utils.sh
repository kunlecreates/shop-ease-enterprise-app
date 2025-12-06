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
# Use explicit settings.xml and explicit GitHub Packages remote in case the runner
# default Maven configuration doesn't include our repository.
mvn -B -s "$HOME/.m2/settings.xml" \
  org.apache.maven.plugins:maven-dependency-plugin:3.5.0:get \
  -Dartifact=org.kunlecreates:test-utils:0.1.0:pom \
  -DremoteRepositories=github::default::https://maven.pkg.github.com/kunlecreates/shop-ease-enterprise-app || true
mvn -B -s "$HOME/.m2/settings.xml" \
  org.apache.maven.plugins:maven-dependency-plugin:3.5.0:get \
  -Dartifact=org.kunlecreates:test-utils:0.1.0:jar \
  -DremoteRepositories=github::default::https://maven.pkg.github.com/kunlecreates/shop-ease-enterprise-app \
  -Dtransitive=false || true

# Debug: show whether settings.xml exists and basic info (not printing secrets)
if [ -f "$HOME/.m2/settings.xml" ]; then
  echo "Found settings.xml; contents (first 50 chars):"
  head -c 200 "$HOME/.m2/settings.xml" | sed -n '1,5p' || true
else
  echo "No settings.xml found at $HOME/.m2/settings.xml"
fi

# Check for HTTP status code 401 in the Maven logs (helpful to diagnose unauthorized)
echo "Checking for downloaded files after mvn attempts..."

# Check if download succeeded
if [ -f "$HOME/.m2/repository/org/kunlecreates/test-utils/0.1.0/test-utils-0.1.0.jar" ]; then
  echo "Downloaded test-utils into local repo"
  find "$HOME/.m2/repository/org/kunlecreates/test-utils" -name "*.lastUpdated" -delete || true
  find "$HOME/.m2/repository/org/kunlecreates/test-utils" -name "_remote.repositories" -delete || true
  exit 0
fi

echo "test-utils not available via mvn. Trying curl download fallback from GitHub Packages if credentials available..."

# Try direct HTTP download using GitHub credentials as a fallback. This can help when
# Maven's dependency:get experiences authentication issues but the token is valid.
GITHUB_ACTOR="${GITHUB_ACTOR:-${1:-}}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}" 
if [ -n "${GITHUB_TOKEN}" ]; then
  echo "Attempting HTTP download of POM and JAR using basic auth (will not print token)"
  BASE_URL="https://maven.pkg.github.com/kunlecreates/shop-ease-enterprise-app/org/kunlecreates/test-utils/0.1.0"
  mkdir -p "$HOME/.m2/repository/org/kunlecreates/test-utils/0.1.0"
  POM_URL="$BASE_URL/test-utils-0.1.0.pom"
  JAR_URL="$BASE_URL/test-utils-0.1.0.jar"
  echo "Downloading POM from $POM_URL"
  curl -fSL -u "${GITHUB_ACTOR}:${GITHUB_TOKEN}" "$POM_URL" -o "$HOME/.m2/repository/org/kunlecreates/test-utils/0.1.0/test-utils-0.1.0.pom" || echo "curl pom failed"
  echo "Downloading JAR from $JAR_URL"
  curl -fSL -u "${GITHUB_ACTOR}:${GITHUB_TOKEN}" "$JAR_URL" -o "$HOME/.m2/repository/org/kunlecreates/test-utils/0.1.0/test-utils-0.1.0.jar" || echo "curl jar failed"
  if [ -f "$HOME/.m2/repository/org/kunlecreates/test-utils/0.1.0/test-utils-0.1.0.jar" ] && [ -f "$HOME/.m2/repository/org/kunlecreates/test-utils/0.1.0/test-utils-0.1.0.pom" ]; then
    echo "Successfully downloaded POM+JAR via curl into local repo"
    exit 0
  else
    echo "HTTP download fallback failed or returned 401/404. Will attempt to build from source if available."
  fi
else
  echo "No GITHUB_TOKEN available in environment; skipping HTTP download fallback."
fi

echo "test-utils not available via provided artifact or remote. Will attempt to build from source..."

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
