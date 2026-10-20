import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
raw = load('converse_ca'); ts = tables(raw); txt = text_of(raw)
URL = 'https://converse.ca/pages/size-guide'; TOOL = 'script (curl, then python -I html.parser)'
ck, st = grid(ts[5]), grid(ts[6])
assert ck[0][0] == "US Men's" and st[0][0] == "US Men's"
check_cells(['A42', 'A43', 'A44', 'A45'], ck, URL, 'converse_ca', TOOL,
  lambda rid, r, row, f: "Table 6 of the page (index 5), in the second footwear panel (Women, Men, Gender-Free, Kids), headed Chuck Taylor All Star, first column US Men's.")
check_cells(['A46', 'A47', 'A48', 'A49'], st, URL, 'converse_ca', TOOL,
  lambda rid, r, row, f: "Table index 6, the men's panel's Standard Sneakers. At US men's 9 its cm is 27 against the Chuck Taylor row's 27.5: 0.5 cm (5 mm) shorter (in 10.6 against 10.8); UK 8 against 9, US women's 10.5 against 11, EU 42.5 in both.")
m1 = re.search(r'These sneakers run large[^.]*\.', txt); m2 = re.search(r'Chuck Taylor All Star runs about a half size large\. All other styles: fit may vary[^.]*\.', txt)
m3 = re.search(r'Jack Purcell, One Star, Pro Leather, G4, Run Star Hike and other non-Chuck styles?\.[^.]*\.', txt)
print(m1.group(0) if m1 else None); print(m2.group(0) if m2 else None); print(m3.group(0) if m3 else None)
print('count of run-large sentence:', len(re.findall(r'These sneakers run large', txt)))
record([dict(id='A50', result='confirmed', found_value='', exact_words='"%s" (under Chuck Taylor All Star in the women\'s and men\'s footwear panels) ... "%s" (in the Kids panel)' % (m1.group(0), m2.group(0)),
  url_or_file=URL + ' ; downloads/converse_ca.html', tool=TOOL,
  note='Both sentences as the worker quoted. The Standard Sneakers chart is introduced by: "%s"' % (m3.group(0) if m3 else 'not found'))])
source('''## Converse Canada (fetched 2026-10-20T22:28Z, curl then python -I)
8. https://converse.ca/pages/size-guide -> 200, downloads/converse_ca.html. 14 server-rendered tables in four panels (Women, Men, Gender-Free, Kids); men's Chuck Taylor All Star (index 5) and Standard Sneakers (index 6) charts, US Men's | US Women's | UK | EU | cm | in; the fit sentences in the page text. Rows A42-A50.''')
