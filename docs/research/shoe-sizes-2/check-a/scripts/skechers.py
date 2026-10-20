import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
TOOL = 'script (curl, then python -I html.parser)'
pages = {'skechers_us': 'https://www.skechers.com/size-chart/', 'skechers_uk': 'https://www.skechers.co.uk/size-chart/'}
G = {}
for p in pages:
    raw = load(p); G[p] = [grid(t) for t in tables(raw)]
    for m in re.finditer(r'<table', raw):
        before = raw[max(0, m.start() - 1500): m.start()]
        ids = re.findall(r'(?:id|aria-labelledby|data-target|data-tab|class)="([^"]{1,80})"', before)
        print(p, 'table at', m.start(), 'preceding attrs:', ids[-6:])
    txt = text_of(raw)
    for pat in [r'Little', r'-L\b[^|]{0,40}(mean|=|denot)', r'\bL\s*=', r'\(L\)', r'Big Kid', r'Toddler']:
        ms = [txt[max(0, x.start() - 80): x.end() + 80] for x in re.finditer(pat, txt)]
        print('  ', p, repr(pat), len(ms), ms[:2])
us, uk = G['skechers_us'], G['skechers_uk']
for k in range(4):
    d = [(i, a, b) for i, (a, b) in enumerate(zip(us[k], uk[k])) if a != b]
    print('table', k, 'US vs UK differing rows:', d, '| lengths', len(us[k]), len(uk[k]))
check_cells(['A77', 'A78', 'A79', 'A80', 'A81', 'A82'], us[1], pages['skechers_us'], 'skechers_us', TOOL,
  lambda rid, r, row, f: "Second of four tab tables (Women's, Men's, Kids', Infant & Toddler), USA | UK | EU, US 6.5-16. EU 42.5 printed at US 9, 9.5, and 10 (then 44 at 10.5): three US sizes, one EU size.")
check_cells(['A83', 'A84', 'A85', 'A86', 'A87', 'A88'], uk[1], pages['skechers_uk'], 'skechers_uk', TOOL,
  lambda rid, r, row, f: "Second of four tab tables (Men's), USA | UK | EU. The UK page prints 42, 42.5, 43 at US 9, 9.5, 10, where skechers.com prints 42.5 three times; the two men's charts differ only in those two cells (US 9 and US 10).")
kid = us[2]; withL = [r[0] for r in kid[1:] if r[0].endswith('-L')]; noL = [r[0] for r in kid[1:] if not r[0].endswith('-L')]
print('withL', withL, 'noL', noL)
