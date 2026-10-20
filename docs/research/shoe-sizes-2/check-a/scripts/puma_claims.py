import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
TOOL = 'script (curl, then python -I html.parser)'
record([
 dict(id='A60', result='confirmed', found_value='Kids shoes, Youth 8-16 years: US 6.5 | UK 5.5 | EU 3.5; Unisex shoes: AU/US Men 8 then 9, no 8.5',
  exact_words="Kids shoes (Age Group | US | UK | EU): ... | 6 | 5 | 38 ; | 6.5 | 5.5 | 3.5 ; | 7 | 6 | 39. Unisex shoes (AU | US Men | US Women | UK | FR): 8 | 8 | 9.5 | 7 | 40.5 ; 9 | 9 | 10.5 | 8 | 42",
  url_or_file='https://au.puma.com/au/en/help/size-guide ; downloads/puma_au.html', tool=TOOL,
  note="The page prints EU 3.5 at Youth US 6.5, between 38 (US 6) and 39 (US 7); that it is a typo (38.5 meant) is the worker's inference, which the neighbours support, the page saying nothing. The unisex chart goes from 8 to 9 with no 8.5 row; its last column is headed FR, not EU."),
 dict(id='A67', result='confirmed', found_value='AU women US 7: UK 4.5, EU 37.5, 23.5 cm; EU de/en women US 7: UK 4, DE/FR/IT/ES 37',
  exact_words="AU Women's shoes (US | UK | EU | Length cm): 7 | 4.5 | 37.5 | 23.5. eu.puma.com/de/en Women's shoes (DE | UK | FR | IT | ES | US): 37 | 4 | 37 | 37 | 37 | 7",
  url_or_file='https://au.puma.com/au/en/help/size-guide ; https://eu.puma.com/de/en/help/size-guide ; downloads/puma_au.html, puma_eu_de_en.html', tool=TOOL,
  note="Every value as recorded. But the difference is AU against de/en only: eu.puma.com/en_GB prints US 7 = UK 4.5 = DE/FR/IT/ES 37.5, as AU does. The de/en women's chart has no US 6.5 row and no 40.5 row, prints UK 6 at both US 9 (39) and US 9.5 (40), and so sits half a US size off en_GB from US 7 to US 9.5 (de/en 37 = US 7, en_GB 37 = US 6.5), rejoining at 41 = US 10. The European pages have no column labelled EU: DE, FR, IT, ES."),
])
source('''## Puma (fetched 2026-10-20T22:28Z, curl then python -I)
9. https://au.puma.com/au/en/help/size-guide -> 200, downloads/puma_au.html. 18 server-rendered tables: Unisex shoes (AU | US Men | US Women | UK | FR), Men's shoes (US | UK | EU | Length cm, US 4-18), Women's shoes (US | UK | EU | Length cm, US 4-11), Kids shoes (Age Group | US | UK | EU), clothing and socks. Rows A51-A60, AU half of A67.
10. https://eu.puma.com/de/en/help/size-guide -> 200, downloads/puma_eu_de_en.html. 15 tables, all DE | UK | FR | IT | ES | US; first, Women's shoes, 11 rows (US 5.5-11, no 6.5). Rows A61-A63, A67.
11. https://eu.puma.com/en_GB/size-charts.html -> 200, downloads/puma_eu_en_gb.html. 17 tables; first, Women's shoes, 12 rows (US 5.5-11 with 6.5); differs from de/en at US 6.5-9.5. Rows A64-A66.''')
