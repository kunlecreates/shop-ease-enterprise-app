#!/usr/bin/env python3
import sys
import json

if len(sys.argv) != 3:
    print("Usage: jest_to_json.py <jest-json> <service-name>", file=sys.stderr)
    sys.exit(2)

jest_json_path = sys.argv[1]
service_name = sys.argv[2]

with open(jest_json_path) as f:
    data = json.load(f)

lines = data.get("total", {}).get("lines", {})
covered = lines.get("covered", 0)
total = lines.get("total", 0)
missed = total - covered
coverage_pct = round((covered / total) * 100, 2) if total else 0.0

output = {
    "service": service_name,
    "language": "javascript",
    "lines": {
        "total": total,
        "covered": covered,
        "missed": missed,
        "coverage_pct": coverage_pct
    }
}

json.dump(output, sys.stdout)
