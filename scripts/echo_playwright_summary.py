#!/usr/bin/env python3
import sys
import json
import os

if len(sys.argv) < 2:
    print('Playwright summary: not found')
    sys.exit(0)
path = sys.argv[1]
if not os.path.isfile(path):
    print('Playwright summary: not found')
    sys.exit(0)
try:
    d = json.load(open(path))
    print(f"Playwright summary: total={d.get('total',0)} passed={d.get('passed',0)} failed={d.get('failed',0)} skipped={d.get('skipped',0)}")
except Exception:
    print('Playwright summary: error reading summary')
    sys.exit(0)
