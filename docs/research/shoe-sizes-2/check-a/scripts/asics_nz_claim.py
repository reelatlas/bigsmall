import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
record([dict(id='A31', result='confirmed', found_value='25.75 (US 7.5); 28.25 (US 10.5); 30.75 (US 13.5)',
  exact_words="Men's/Unisex Shoe Sizes, rows as printed (US | UK | EU | CM | US Women): 7.5 | 6.5 | 40.5 | 25.75 | 9 ; 10.5 | 9.5 | 44.5 | 28.25 | 12 ; 13.5 | 12.5 | 48.5 | 30.75 | 15",
  url_or_file='https://www.asics.com/nz/en-nz/size-guide ; downloads/asics_nz.html', tool='script (curl, then python -I html.parser)',
  note="All three quarter-centimetre values sit in the Men's/Unisex chart: 25.75 at US 7.5 (data row 7), 28.25 at US 10.5 (row 13), 30.75 at US 13.5 (row 19); the rest of the CM column is on the 5 mm grid. The same page also prints 28.25 in Men's Work Boot Sizes (US 11) and 25.75 (US 9) and 28.75 (US 12.5) in Women's Shoe Sizes.")])
source('''## Asics New Zealand (fetched 2026-10-20T22:28Z, curl then python -I)
4. https://www.asics.com/nz/en-nz/size-guide -> 200, downloads/asics_nz.html. 14 server-rendered tables; table 0 Men's/Unisex Shoe Sizes (US | UK | EU | CM | US Women, 22 data rows, US 4, 5, 5.5 ... 14, 15, 16: no 4.5, no 14.5), table 1 Men's Work Boot Sizes, table 2 Women's Shoe Sizes (US | UK | EU | CM | US Men, 17 rows, US 5-13; US 5 = 22 cm, 5.5 = 22.5), table 4 Kid's Shoe Sizes; the rest clothing. Rows A22-A31, and the NZ half of A41.
5. https://www.asics.com/sg/en-sg/customer-service/size-fit-guide/size-fit-guide.html by script -> 403 Access Denied (Akamai edgesuite, Reference #18.510ed217.1792535330.2826269e), downloads/asics_sg.html kept; next read through the fetcher.''')
