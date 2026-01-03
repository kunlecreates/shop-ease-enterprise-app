#!/usr/bin/env python3
import sys
import xml.etree.ElementTree as ET
import json

if len(sys.argv) != 3:
    print("Usage: jacoco_to_json.py <jacoco.xml> <service-name>", file=sys.stderr)
    sys.exit(2)

jacoco_xml = sys.argv[1]
service_name = sys.argv[2]

tree = ET.parse(jacoco_xml)
root = tree.getroot()

line_counter = next(
    c for c in root.findall("counter")
    if c.attrib.get("type") == "LINE"
)

covered = int(line_counter.attrib["covered"])
missed = int(line_counter.attrib["missed"])
total = covered + missed
coverage_pct = round((covered / total) * 100, 2) if total else 0.0

output = {
    "service": service_name,
    "language": "java",
    "lines": {
        "total": total,
        "covered": covered,
        "missed": missed,
        "coverage_pct": coverage_pct
    }
}

json.dump(output, sys.stdout)
