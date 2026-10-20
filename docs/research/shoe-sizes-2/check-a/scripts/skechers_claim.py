import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
raw = load('skechers_us')
i = raw.find('toggle-kids-sizechart'); j = raw.find('toggle-toddlers-sizechart')
seg = text_of(raw[i - 3000: j + 200])
print('TEXT AROUND KIDS CHART:', seg[:1500])
whole = text_of(raw)
print('any "L" glossary near "size" words:', [whole[max(0, m.start() - 60): m.end() + 60] for m in re.finditer(r'\b(L|-L)\b\s*(is|means|stands|indicates|=)', whole)][:3])
record([dict(id='A89', result='confirmed', found_value="-L on 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 1, 1.5, 2, 2.5, 3, 4, 4.5, 5.5; none on 3.5, 5, 6, 6.5, 7",
  exact_words="Kids' chart (USA | UK | EU) USA column: 10.5-L | 11-L | 11.5-L | 12-L | 12.5-L | 13-L | 13.5-L | 1-L | 1.5-L | 2-L | 2.5-L | 3-L | 3.5 | 4-L | 4.5-L | 5 | 5.5-L | 6 | 6.5 | 7",
  url_or_file='https://www.skechers.com/size-chart/ ; downloads/skechers_us.html', tool='script (curl, then python -I html.parser)',
  note="Table in the panel toggle-kids-sizechart. As the worker says: most sizes carry -L, and 3.5, 5, 6, 6.5, 7 carry none. The page nowhere says what L means (searched the chart, its panel, and the page text). The site menu on the same page lists 'Little Kids (Sizes 10.5-3.0) Big Kids (Sizes 3.5-7)', which would fit L on 10.5-3 but not on 4, 4.5, 5.5 (an observation, not the page's statement). skechers.co.uk's Kids' chart is identical, cell for cell.")])
source('''## Skechers (fetched 2026-10-20T22:28Z, curl then python -I)
17. https://www.skechers.com/size-chart/ -> 200, downloads/skechers_us.html. Four tab tables (USA | UK | EU) in panels toggle-womens-, toggle-mens-, toggle-kids-, toggle-toddlers-sizechart. Rows A77-A82, A89.
18. https://www.skechers.co.uk/size-chart/ -> 200, downloads/skechers_uk.html. The same four tables; identical to the US page's but for men's US 9 (EU 42 against 42.5) and US 10 (43 against 42.5). Rows A83-A88.''')
