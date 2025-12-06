#!/usr/bin/env bash
set -euo pipefail
# write_maven_settings.sh
# Writes a minimal Maven settings.xml configured for GitHub Packages.
# Usage: write_maven_settings.sh <github_actor> <github_token>

GITHUB_ACTOR="${1:-${GITHUB_ACTOR:-}}"
GITHUB_TOKEN="${2:-${GITHUB_TOKEN:-}}"

mkdir -p "$HOME/.m2"
cat > "$HOME/.m2/settings.xml" <<EOF
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd">
  <servers>
    <server>
      <id>github</id>
      <username>${GITHUB_ACTOR}</username>
      <password>${GITHUB_TOKEN}</password>
    </server>
  </servers>
  <profiles>
    <profile>
      <id>github</id>
      <repositories>
        <repository>
          <id>github</id>
          <url>https://maven.pkg.github.com/kunlecreates/shop-ease-enterprise-app</url>
        </repository>
      </repositories>
    </profile>
  </profiles>
  <activeProfiles>
    <activeProfile>github</activeProfile>
  </activeProfiles>
</settings>
EOF

printf "Wrote $HOME/.m2/settings.xml (server id=github)\n"
