#!/usr/bin/env bash
set -euo pipefail
# copy-ci-artifacts.sh
# Usage: ./scripts/copy-ci-artifacts.sh /path/to/downloaded/artifact-dir [dest-dir]
# Example: ./scripts/copy-ci-artifacts.sh /tmp/run19618128336-artifacts/playwright-smoke-report-clean ./ci-artifacts/run19618128336

SRC=${1:-}
DEST=${2:-./ci-artifacts/ci-run}

if [ -z "$SRC" ]; then
  echo "Usage: $0 /path/to/downloaded/artifact-dir [dest-dir]"
  exit 2
fi

if [ ! -d "$SRC" ]; then
  echo "Source directory does not exist: $SRC"
  exit 3
fi

mkdir -p "$DEST"
echo "Copying artifacts from: $SRC -> $DEST"
cp -av "$SRC"/* "$DEST"/

echo "Done. Artifacts copied to: $DEST"
echo "You can now run: ls -la $DEST && sed -n '1,200p' $DEST/playwright-debug-artifacts/logs/pg.log"

exit 0
