import sys, os, re, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
TOOL = 'script (curl, then python -I html.parser)'
U = {'ua_us_mens': 'https://www.underarmour.com/en-us/t/size-guide/mens-footwear/', 'ua_us_womens': 'https://www.underarmour.com/en-us/t/size-guide/womens-footwear/', 'ua_uk_womens': 'https://www.underarmour.co.uk/en-gb/t/size-guide/womens-footwear/'}
G = {p: grid(tables(load(p))[0]) for p in U}
def inches(s):  # parse a printed fraction like 9¹¹/₁₆ or 10¼ into a float, for the cm-inch comparison only
    s = s.strip(); m = re.match(r'(\d+)(.*)', s); whole = int(m.group(1)); rest = m.group(2)
    if not rest: return float(whole)
    if len(rest) == 1: return whole + unicodedata.numeric(rest)
    sup = str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉', '01234567890123456789'); a, b = re.split('[/⁄]', rest.translate(sup)); return whole + int(a) / int(b)
m = G['ua_us_mens']
print('US men inch vs cm (row, US, inches, in->cm, CM, diff mm, slash char):')
for i, r in enumerate(m[1:], 1):
    c = inches(r[1]) * 2.54; print('  ', i, r[0], r[1], round(c, 2), r[2], round((float(r[2]) - c) * 10, 1), 'U+2044' if '⁄' in r[1] else ('/' if '/' in r[1] else '-'))
r1 = m[1]; print('A99 recorded vs printed:', repr(myrows()['A99']['value']), repr(r1[1]), myrows()['A99']['value'] == r1[1])
check_cells(['A%02d' % i for i in range(90, 101)], m, U['ua_us_mens'], 'ua_us_mens', TOOL,
  lambda rid, r, row, f: "Size Chart table, US Men | Inches | CM | Euro | UK, 19 rows (US 7-16)." + (" At US men's 7 the page prints 9¹¹/₁₆ (superscript 11, ASCII slash, subscript 16) beside 25 CM: 9 11/16 in is 24.61 cm, 3.9 mm short of 25, so the two columns do not agree there; 25 cm is about 9 27/32 in." if rid in ('A99', 'A100') else ''))
w, k = G['ua_us_womens'], G['ua_uk_womens']
wus = {r[0]: r for r in w[1:]}; cmp = []
for r in k[1:]:
    u = wus.get(r[3]); cmp.append((r[3], 'UK site cm %s UK %s Euro %s' % (r[0], r[2], r[1]), 'US site cm %s UK %s Euro %s' % (u[2], u[4], u[3]) if u else 'absent'))
for c in cmp: print('  ', c)
check_cells(['A101', 'A102'], w, U['ua_us_womens'], 'ua_us_womens', TOOL, lambda rid, r, row, f: 'Size Chart table, US Women | Inches | CM | Euro | UK, 15 rows (US 5-12).')
check_cells(['A103', 'A104'], k, U['ua_uk_womens'], 'ua_uk_womens', TOOL, lambda rid, r, row, f: "Size Chart table on the UK site, columns in another order (CM | Euro | UK | US Women), no inches, 15 rows (US 5-12). Differs from the US site at US women's 5: 22 cm and UK 2.5 against 22.5 cm and UK 3; Euro 35.5 on both.")
raw = load('ua_us_mens'); txt = text_of(raw)
for pat in [r'true foot', r'heel to toe', r'translated into']:
    print(pat, [txt[max(0, x.start() - 200): x.end() + 250] for x in re.finditer(pat, txt, re.I)][:2])
