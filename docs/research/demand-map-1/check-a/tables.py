# usage: python -I tables.py <html> <max_tables> <row_regex>
import sys, re, html
sys.stdout.reconfigure(encoding="utf-8")
h = open(sys.argv[1], encoding="utf-8", errors="replace").read()
maxt = int(sys.argv[2]); rx = re.compile(sys.argv[3])
def clean(s): return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()
tabs = re.findall(r"<table\b.*?</table>", h, re.S | re.I)
print("tables:", len(tabs))
for ti, t in enumerate(tabs[:maxt]):
    # nearest preceding heading/caption text
    pos = h.find(t)
    pre = clean(h[max(0, pos-600):pos])[-160:]
    rows = re.findall(r"<tr\b.*?</tr>", t, re.S | re.I)
    print(f"--- TABLE {ti}: {len(rows)} rows; before: ...{pre}")
    for ri, r in enumerate(rows):
        cells = [clean(c) for c in re.findall(r"<t[dh]\b[^>]*>(.*?)</t[dh]>", r, re.S | re.I)]
        line = " | ".join(cells)
        if ri == 0 or rx.search(line):
            print(f"   r{ri}: {line[:300]}")
