#!/usr/bin/env bash
set -euo pipefail

FORMAT="$1"        # jacoco | pytest | jest
SERVICE="$2"
INPUT="$3"
OUT_DIR="$4"

if [[ -z "${FORMAT}" || -z "${SERVICE}" || -z "${INPUT}" || -z "${OUT_DIR}" ]]; then
  echo "Usage: normalize.sh <format> <service-name> <input-path> <output-dir>"
  exit 1
fi

if [[ ! -f "${INPUT}" ]]; then
  echo "Input file not found at ${INPUT}"
  exit 1
fi

mkdir -p "$OUT_DIR"

case "$FORMAT" in
  jacoco)
    python scripts/coverage/jacoco_to_json.py "$INPUT" "$SERVICE" > "$OUT_DIR/coverage.json"
    ;;
  pytest)
    python scripts/coverage/pytest_to_json.py "$INPUT" "$SERVICE" > "$OUT_DIR/coverage.json"
    ;;
  jest)
    python scripts/coverage/jest_to_json.py "$INPUT" "$SERVICE" > "$OUT_DIR/coverage.json"
    ;;
  *)
    echo "Unknown coverage format: $FORMAT"
    exit 2
    ;;
esac

echo "✓ Normalized $FORMAT coverage for $SERVICE"