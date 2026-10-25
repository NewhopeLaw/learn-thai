"""Print every handwriting worksheet in printables/worksheets.js to PDF with headless Chrome or Edge.

Run after changing the worksheets:   python tools/build_worksheets.py [file ...]
Writes printables/<file>.pdf for each sheet (or only the sheets named on the command line).
"""
import pathlib
import re
import subprocess
import sys
import tempfile
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
PRINTABLES = ROOT / 'printables'
BROWSERS = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
]


def main():
    browser = next((b for b in BROWSERS if pathlib.Path(b).exists()), None)
    if not browser:
        sys.exit('Chrome or Edge not found')
    sheets = re.findall(r"file: '([^']+)'", (PRINTABLES / 'worksheets.js').read_text(encoding='utf-8'))
    if len(sys.argv) > 1:
        sheets = [s for s in sheets if s in sys.argv[1:]]
    page = (PRINTABLES / 'worksheet.html').as_uri()
    with tempfile.TemporaryDirectory() as profile:
        for name in sheets:
            out = PRINTABLES / f'{name}.pdf'
            subprocess.run([browser, '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
                            '--virtual-time-budget=8000', f'--user-data-dir={profile}',
                            f'--print-to-pdf={out}', f'{page}?s={urllib.parse.quote(name)}'],
                           check=True, capture_output=True)
            print('wrote', out.relative_to(ROOT))


if __name__ == '__main__':
    main()
