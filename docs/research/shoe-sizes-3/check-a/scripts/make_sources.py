import sys, os, csv, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import load_rows, load_log

sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
CSV, LOG, BASE = sys.argv[1:4]
rows, urls = load_rows(CSV)
log = load_log(LOG)
D = {
    1: "Brooks UK size guide (en_gb): the women's chart (default) headed Foot Length (CM) | US | UK | EU, 17 rows; width table; thumb-width advice; 'View guide' link to the EMEA measuring article.",
    2: "Brooks DE men's chart fragment (ajax): Fußlänge (CM) | US | UK | Europa, 20 rows equal to u57; German half-size advice.",
    3: "Brooks EMEA help centre: How to measure your foot.",
    4: "Brooks US size guide (en_us): women's chart US | UK | Europe (no foot length); thumb's-width advice; the all-gender sentence.",
    5: "Brooks US help centre: which width to choose (1/2\" to 1\" space, length conversion 1.5 sizes, no exact measurements).",
    6: "Brooks US help centre: avoiding holes in the shoe fabric.",
    7: "Brooks AU help centre: Sizing tips (approx. 1/2 in.).",
    8: "Brooks EMEA help centre: shoe sizing compared to other brands.",
    9: "Brooks CA help centre: shoe sizing compared to other brands.",
    10: "Brooks US help centre: Children's shoes.",
    11: "Brooks AU help centre: How do I know my shoe size.",
    12: "Brooks AU help centre: Size Conversion Chart (Japan Men (cm), Japan Women (cm)).",
    13: "Skechers US size chart page; text present (a bot-check script is embedded but the page text loaded).",
    14: "Skechers kids' Shoe Fit Guide PDF (printable gauge, inch marks, US/UK/EU marks).",
    15: "Skechers AU help centre: selecting the right size.",
    16: "Skechers Direct: Shoe Sizing & Care (fit guides); text present beside an embedded bot-check script.",
    17: "Puma AU size charts: men's and women's shoe charts with Length cm; unisex sentence; clothing measuring.",
    18: "Puma US size charts (production-pna-sfcc host): unisex sentence; kids' charts with Length in inches.",
    19: "Puma AE size guide: unisex sentence; Men's Shoes EU UK US; a Product Measurements Size Length (cm) table.",
    20: "Puma VN size guide: JPN/CM definition and footwear conversions.",
    21: "Puma EU (de, English) size guide: clothing measuring only; no foot measuring.",
    22: "On US Cloudmonster product page: Size chart True to size; Size & Fit True to size.",
    23: "On US Cloud Play (kids) product page: True to size; how to measure your kid's feet.",
    24: "On US product tester page: Brannock or ruler advice; the kids' measuring text in embedded data.",
    25: "On US FAQ (product-advice-sizing-stock): an empty shell, no text (2,125 bytes).",
    26: "Reebok AU size guides: men's (24 rows) and women's (14 rows) footwear charts US | UK | EU | CM | INCH, repeated in several tabs; kids' charts; method; between sizes; Club C note.",
    27: "Reebok US unisex shoe size guide: U.S. Men Size | U.S. Women Size | Heel-Toe Measurement (in); method.",
    28: "Reebok CA footwear size chart: Heel-toe measurement row; Winter Boots Sizing (women's 7 rows, men's 8 rows); method.",
    29: "Reebok UK help size charts: no file (connect timeout twice; fetcher ECONNREFUSED).",
    30: "Nike US men's footwear size guide.",
    31: "Nike US women's footwear size guide.",
    32: "adidas Bahrain men's shoes size chart: Heel-toe (INCH) and (cm) rows, UK, EU in thirds, US men, US women; method; in-between sizes.",
    33: "Asics NZ: how to measure shoe size.",
    34: "Asics AU: how to measure your shoe size.",
    35: "Salomon SG men's footwear sizing guide (FOOT LENGTH (CM)/(INCH), comma decimals).",
    36: "Salomon SG women's footwear sizing guide.",
    37: "New Balance men's printable size and width tool PDF.",
    38: "Converse CA size guide (method, between sizes, Chuck Taylor note, charts with cm and in).",
    39: "Converse CA Chuck Taylor All Star product page (runs large, heel-to-toe method).",
    40: "Under Armour US men's footwear size guide.",
    41: "Under Armour AU men's footwear size chart.",
    42: "Clarks AU size guide (CM is foot length note); no measuring method.",
    43: "Clarks US: how to measure feet for shoes (editorial).",
    44: "Clarks UK: measure at home with a tape measure.",
    45: "Dr. Martens UK shoe size guide.",
    46: "Dr. Martens US size guide.",
    47: "Birkenstock US fitting guide (EU sizes, the US + 31 / + 33 formula).",
    48: "Birkenstock US fit guide size chart (mm table).",
    49: "Birkenstock MY fit knowledge page (fit calculator).",
    50: "UGG kids' printable size chart PDF.",
    51: "Vans US size charts (unisex chart with Foot Length; measuring sentence twice).",
    52: "Vans US FAQ.",
    53: "Timberland US size chart (EU UK USA Inch; method).",
    54: "Timberland US how to measure boots: HTTP 403 'Access to this page has been denied' (a bot wall): a refusal, no content.",
    55: "HOKA US size chart: HTTP 410 with the site's 'We're Sorry... does not exist or is no longer available' page; no chart.",
    56: "Crocs US size chart: 'Loading...' where the chart goes; tips and column labels in embedded data.",
    57: "Brooks UK men's chart fragment (ajax): Foot Length (CM) | US | UK | Europe, 20 rows.",
    58: "Brooks UK all-gender chart fragment (ajax): EU and US charts with Foot Length (CM), 20 rows each.",
}
L = ['# Checker A: sources opened (2026-10-21)', '',
     'Every page in wave2-check.csv (58 counting the second pages), downloaded once by `scripts/download.py` with curl '
     '(User-Agent `bigsmall-research-checker/1.0 (research script verifying published shoe size charts)`, no personal data), '
     'one host at a time, hosts in parallel. Files in `downloads/`; PDF text from pdftotext in `text/`.', '',
     '| # | URL | HTTP | file | bytes | what the file holds |', '|---|---|---|---|---|---|']
for i, u in enumerate(urls, 1):
    d = log.get(u, {})
    L.append(f"| u{i} | {u} | {d.get('code', '')} | {d.get('file', '') or '(none)'} | {d.get('size', '')} | {D[i]} |")
L += ['', '## Retries and the fetcher', '',
      '- u29 Reebok UK: script retried with a 30 s connect timeout: curl 28, could not connect. Fetcher: `connect ECONNREFUSED 3.33.139.32:443`.',
      '- u25 On FAQ: fetcher returned an empty page (two separators, no text).',
      '- u54 Timberland FAQ: fetcher returned HTTP 403 Forbidden.',
      '- u55 HOKA size chart: fetcher returned `Parse Error: Header overflow`.', '',
      "## The worker's saved copies read (only for pages both tools refused)", '',
      'Folder: `scratchpad/shoe-sizes-3/rules/downloads/`.', '',
      "- `tim-us-howtomeasure.html` (u54): a real page, title 'How to Measure Boots for the Best Fit? | Timberland', 5,078 characters of text; used for A-C076 and A-C075's second page, flagged `worker copy`.",
      '- `on-us-faq-sizing.html`, `on-us-faq-product.html` (u25): 4,348-byte shells with no text: refusals, not copies.',
      "- `hoka-us-sizechart.html` (u55): an 'Access Denied' page: a refusal, not a copy.",
      '- No copy of u29 (Reebok UK) exists there; `reebok-eu-home.html` is another page and was not opened.', '',
      '## Derived files', '',
      '- `download_log.csv`: status, final URL, type, size, and file per page.',
      '- `text/*.txt`, `text/*.raw.txt`: pdftotext output (layout and plain) of the three PDFs (u14, u37, u50).',
      '- `tables_brooks.json`, `tables_reebok.json`: the HTML tables parsed from u1, u2, u4, u57, u58 and u26, u28.',
      '- `claims_auto.json`: the first fragment-matching pass over every claim.',
      '- `check.csv`: the verdicts, written by `scripts/write_check.py` from `scripts/notes.txt` and the pages.']
open(os.path.join(BASE, 'sources.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
with open(os.path.join(BASE, 'check.csv'), encoding='utf-8', newline='') as f:
    chk = list(csv.DictReader(f))
ids_in = [r['id'] for r in rows]
ids_out = [r['id'] for r in chk]
print('sources.md lines:', len(L), '| check rows:', len(chk), '| ids match input order:', ids_in == ids_out)
print('results:', collections.Counter(r['result'] for r in chk))
print('empty exact_words:', [r['id'] for r in chk if not r['exact_words'].strip()])
print('tools:', collections.Counter(r['tool'] for r in chk))
