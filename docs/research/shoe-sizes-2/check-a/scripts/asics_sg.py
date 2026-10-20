import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
lines = open(os.path.join(D, 'asics_sg_fetcher_raw_lists.txt'), encoding='utf-8').read().splitlines()
cols = {}
for ln in lines[2:6]:
    k, *v = ln.split(); cols[k] = v
print({k: len(v) for k, v in cols.items()})
hdr = ['US', 'EU', 'CM', 'UK']; n = len(cols['US'])
g = [hdr] + [[cols[h][i] for h in hdr] for i in range(n)]
TOOL = 'fetcher (WebFetch: its model\'s transcription, not a parse); script refused (403)'
URL = 'https://www.asics.com/sg/en-sg/customer-service/size-fit-guide/size-fit-guide.html'
def nf(rid, r, row, f):
    return ("The page content holds the chart column by column (US, EU, CM, UK as four lists of 23 entries each, per the fetcher's quote in page order); "
            "the four values are entry %s of each list, so they share a row by position; the fetcher cannot show the drawn row itself." % r['row'])
out = check_cells(['A%02d' % i for i in range(32, 41)], g, URL, 'asics_sg', TOOL, nf)
for o in out: o['url_or_file'] = URL + ' ; downloads/asics_sg_fetcher_raw_lists.txt'
record(out)
record([dict(id='A41', result='confirmed', found_value='SG men 4H and 14H present, NZ men absent; NZ men 16 present, SG men ends at 15; women US 5: NZ 22 cm, SG 22.5; women US 5.5: NZ 22.5, SG 22.75',
  exact_words="NZ Women's Shoe Sizes (US | UK | EU | CM | US Men): 5 | 3 | 35.5 | 22 | 3.5 ; 5.5 | 3.5 | 36 | 22.5 | 4. SG Women's Sizes (US | EU | CM | UK), fetcher: 5 | 35.5 | 22.5 | 3 ; 5H | 36 | 22.75 | 3.5. SG Men's/Unisex US list: 4 4H 5 5H ... 14 14H 15; NZ Men's/Unisex US column: 4, 5, 5.5 ... 14, 15, 16",
  url_or_file='https://www.asics.com/nz/en-nz/size-guide ; downloads/asics_nz.html ; ' + URL + ' ; downloads/asics_sg_fetcher_rows.txt, asics_sg_fetcher_raw_lists.txt',
  tool='NZ: script (curl, python -I); SG: fetcher (WebFetch), script refused 403',
  note="Every difference named holds. Also: SG writes half sizes as H (4H); SG women's chart adds US 4 and 4H (21.5 and 22 cm), which NZ women's lacks; SG has no US Women/US Men column; column order differs (NZ US | UK | EU | CM, SG US | EU | CM | UK). SG read only through the fetcher, as for the worker.")])
source('''## Asics Singapore (2026-10-20, fetcher)
6. Same SG URL through the fetcher (WebFetch), read 1: a transcription by rows of Men's/Unisex Sizes (23 rows, US 4-15 with H half sizes) and Women's Sizes (19 rows, US 4-13); the fetcher said it matched rows by position across flattened column lists. Summary kept in downloads/asics_sg_fetcher_rows.txt.
7. Same URL, fetcher read 2: the men's chart quoted in page order, four column lists (US, EU, CM, UK) of 23 entries each, kept in downloads/asics_sg_fetcher_raw_lists.txt; rows A32-A40 checked from it by position, A41 with the NZ page. The worker's saved copy was not opened (the fetcher did not fail).''')
