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
  echo "ERROR: Input file not found at ${INPUT}" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

OUT_FILE="$OUT_DIR/coverage.json"

case "$FORMAT" in
  jacoco)
    python scripts/coverage/jacoco_to_json.py "$INPUT" "$SERVICE" > "$OUT_FILE"
    ;;
  pytest)
    python scripts/coverage/pytest_to_json.py "$INPUT" "$SERVICE" > "$OUT_FILE"
    ;;
  jest)
    python scripts/coverage/jest_to_json.py "$INPUT" "$SERVICE" > "$OUT_FILE"
    ;;
  *)
    echo "ERROR: Unknown coverage format: $FORMAT" >&2
    exit 2
    ;;
esac

# Validate JSON exists and is non-empty
if [[ ! -s "$OUT_FILE" ]]; then
  echo "ERROR: Coverage output is empty for $SERVICE" >&2
  exit 3
fi

# Validate JSON structure
jq -e '
  .service and
  .language and
  .lines.total >= 0 and
  .lines.covered >= 0 and
  .lines.missed >= 0 and
  (.lines.covered + .lines.missed == .lines.total)
' "$OUT_FILE" > /dev/null

echo "✓ Normalized and validated $FORMAT coverage for $SERVICE"