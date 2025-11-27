#!/usr/bin/env python3
"""
extract_playwright_failures.py

Usage: extract_playwright_failures.py <report_html_path> <outdir>

Extract failing test details from the Playwright embedded report (index.html)
and write a compact `failures.json` into <outdir>. If no failures, writes an empty list.
"""
import sys
import os
import re
import json
import base64
import zipfile
import io


def extract_report_zip_from_html(report_html_path):
    s = open(report_html_path, 'rb').read().decode('utf-8', 'replace')
    m = re.search(r"<script[^>]*id=[\"']playwrightReportBase64[\"'][^>]*>(.*?)</script>", s, re.S)
    if not m:
        return None
    b = m.group(1).strip()
    if b.startswith('data:application/zip;base64,'):
        b = b.split(',', 1)[1]
    return zipfile.ZipFile(io.BytesIO(base64.b64decode(b)))


def gather_failures_from_report_json(report):
    failures = []
    for f in report.get('files', []):
        for t in f.get('tests', []):
            ok = t.get('ok', False)
            outcome = t.get('outcome')
            if not ok or outcome == 'unexpected' or outcome == 'failed':
                entry = {
                    'fileName': f.get('fileName'),
                    'testId': t.get('testId'),
                    'title': t.get('title'),
                    'location': t.get('location'),
                    'outcome': outcome,
                    'ok': ok,
                    'results': []
                }
                for res in t.get('results', []):
                    # results may contain 'error' or 'attachments'
                    item = {}
                    if 'error' in res and res['error']:
                        err = res['error']
                        # keep small: message and stack if available
                        item['error'] = {
                            'message': err.get('message') if isinstance(err, dict) else str(err),
                            'stack': err.get('stack') if isinstance(err, dict) else None,
                        }
                    if 'stdout' in res and res['stdout']:
                        item['stdout'] = res['stdout']
                    if 'attachments' in res and res['attachments']:
                        # list attachment names/types (do not extract content)
                        item['attachments'] = [ { 'name': a.get('name'), 'contentType': a.get('contentType') } for a in res.get('attachments', []) ]
                    if item:
                        entry['results'].append(item)
                failures.append(entry)
    return failures


def main():
    if len(sys.argv) < 3:
        print('Usage: extract_playwright_failures.py <report_html_path> <outdir>', file=sys.stderr)
        return 2
    report_html = sys.argv[1]
    outdir = sys.argv[2]
    os.makedirs(outdir, exist_ok=True)

    if not os.path.isfile(report_html):
        open(os.path.join(outdir, 'notice.txt'), 'w').write('report_html_not_found')
        return 0

    try:
        z = extract_report_zip_from_html(report_html)
        if z is None:
            open(os.path.join(outdir, 'notice.txt'), 'w').write('no_embedded_report')
            return 0
        if 'report.json' not in z.namelist():
            open(os.path.join(outdir, 'notice.txt'), 'w').write('no_report_json')
            return 0
        report = json.load(z.open('report.json'))
        failures = gather_failures_from_report_json(report)
        open(os.path.join(outdir, 'failures.json'), 'w').write(json.dumps(failures, indent=2))
        return 0
    except Exception as e:
        open(os.path.join(outdir, 'error.txt'), 'w').write(str(e))
        return 0


if __name__ == '__main__':
    sys.exit(main())
