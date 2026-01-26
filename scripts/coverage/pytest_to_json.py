#!/usr/bin/env python3
import sys
import json

if len(sys.argv) != 3:
    print("Usage: pytest_to_json.py <pytest-json> <service-name>", file=sys.stderr)
    sys.exit(2)

pytest_json_path = sys.argv[1]
service_name = sys.argv[2]

with open(pytest_json_path) as f:
    data = json.load(f)

totals = data.get("totals", {})
covered = totals.get("covered_lines", 0)
missed = totals.get("missing_lines", 0)
total = covered + missed

coverage_pct = round((covered / total) * 100, 2) if total else 0.0

output = {
    "service": service_name,
    "language": "python",
    "lines": {
        "total": total,
        "covered": covered,
        "missed": missed,
        "coverage_pct": coverage_pct
    }
}

json.dump(output, sys.stdout)
