#!/usr/bin/env python3
"""
summarize_playwright_report.py

Usage: summarize_playwright_report.py <report_html_path> <outdir>

This script extracts the base64-embedded Playwright HTML report archive (if present),
decodes it, and writes a small `summary.json` (best-effort) into the outdir.
It never prints the archive contents to stdout to avoid bloating logs.
"""
import sys
import os
import re
import json
import base64
import zipfile
import io


def main():
    if len(sys.argv) < 3:
        print("Usage: summarize_playwright_report.py <report_html_path> <outdir>", file=sys.stderr)
        return 2
    report_html = sys.argv[1]
    outdir = sys.argv[2]
    os.makedirs(outdir, exist_ok=True)

    if not os.path.isfile(report_html):
        open(os.path.join(outdir, 'notice.txt'), 'w').write('report_html_not_found')
        return 0

    try:
        s = open(report_html, 'rb').read().decode('utf-8', 'replace')
        m = re.search(r"<script[^>]*id=[\"']playwrightReportBase64[\"'][^>]*>(.*?)</script>", s, re.S)
        if not m:
            open(os.path.join(outdir, 'notice.txt'), 'w').write('no_embedded_base64')
            return 0
        b = m.group(1).strip()
        if b.startswith('data:application/zip;base64,'):
            b = b.split(',', 1)[1]
        zdata = base64.b64decode(b)
        z = zipfile.ZipFile(io.BytesIO(zdata))
        summary = None
        # Prefer Playwright's report.json if present (it contains useful stats)
        if 'report.json' in z.namelist():
            try:
                rpt = json.load(z.open('report.json'))
                stats = rpt.get('stats', {})
                total = int(stats.get('total', 0))
                # Playwright uses 'expected' for passing tests, 'unexpected' for failures
                passed = int(stats.get('expected', 0))
                failed = int(stats.get('unexpected', 0))
                skipped = int(stats.get('skipped', 0))
                summary = {'total': total, 'passed': passed, 'failed': failed, 'skipped': skipped}
            except Exception:
                summary = None
        if summary is None:
            # best-effort minimal counters from other JSON files
            total = passed = failed = skipped = 0
            for name in z.namelist():
                if name.endswith('.json') and 'test-results' in name:
                    try:
                        obj = json.load(z.open(name))
                        if isinstance(obj, dict):
                            total += int(obj.get('total', 0))
                            passed += int(obj.get('passed', 0))
                            failed += int(obj.get('failed', 0))
                            skipped += int(obj.get('skipped', 0))
                    except Exception:
                        pass
            summary = {'total': total, 'passed': passed, 'failed': failed, 'skipped': skipped}
        open(os.path.join(outdir, 'summary.json'), 'w').write(json.dumps(summary))
        return 0
    except Exception as e:
        open(os.path.join(outdir, 'error.txt'), 'w').write(str(e))
        return 0


if __name__ == '__main__':
    sys.exit(main())
