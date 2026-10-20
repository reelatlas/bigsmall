import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
from nike_charts import charts
R = myrows(); out = []
TOOL = 'script (curl, then python -I: __NEXT_DATA__ JSON and the server-rendered table)'
def chartdict(rows): return {r[0]: r[1:] for r in rows}
pages = {
 'nike_us_mens': ('https://www.nike.com/size-fit/mens-footwear', chartdict(charts('nike_us_mens')[0][3]), 'US - Men'),
 'nike_gb_mens': ('https://www.nike.com/gb/size-fit/mens-footwear', chartdict(charts('nike_gb_mens')[0][3]), 'US—Men'),
 'nike_us_kids': ('https://www.nike.com/size-fit/kids-footwear', chartdict([c for c in charts('nike_us_kids') if c[1].get('title') == 'Big Kids (1Y - 7Y)'][0][3]), 'US - Kids'),
}
which = {**{'A%02d' % i: 'nike_us_mens' for i in range(1, 12)}, **{'A%02d' % i: 'nike_us_kids' for i in range(12, 18)}, 'A18': 'nike_gb_mens', 'A19': 'nike_gb_mens'}
for rid, pg in which.items():
    r = R[rid]; url, cd, key = pages[pg]; i = int(r['row'])
    col = r['column']; found = cd[col][i - 1] if col in cd else None
    lab = ' ; '.join('%s %s' % (k, v[i - 1]) for k, v in cd.items() if v[i - 1] is not None)
    v = verdict(r['value'], found)
    note = 'Chart is transposed on the page (sizes run across); data position %d = %s %s. ' % (i, key, cd[key][i - 1])
    if 'Foot' in col: note += 'Foot length (cm) is in the embedded JSON only (the Metric toggle); the server-rendered table shows the Imperial view (Foot Length (in) %s). ' % [x for k, x in cd.items() if '(in' in k][0][i - 1]
    else: note += 'Same value in the server-rendered table and the JSON. '
    if rid in ('A10', 'A11'): note += 'At US men 9 the page prints CM / JP 27 and Foot Length (cm) 26.2: two different figures, both as recorded.'
    if rid in ('A18', 'A19'): note += 'Equal to the US chart: every row of the GB chart (US men, US women, UK, CM/JP, EU, foot length in and cm) is identical cell for cell to the US chart; the US chart alone adds a US - Kids row (3.5Y-7Y); labels differ only in punctuation (US—Men, CM/JP, Foot length (cm)).'
    out.append(dict(id=rid, result=v, found_value=found, exact_words=lab, url_or_file=url + ' ; downloads/' + pg + '.html', tool=TOOL, note=note))
q20 = ('"Please note the CM size displayed on shoe boxes and labels is different than Foot Length (cm)." ... "have a friend or partner assist you by marking the tip of the big toe and the outermost part of the heel. Once the marks are recorded, step off the paper and use a ruler or measuring tape to measure the distance between the two points. This measurement represents the length of the foot."')
out.append(dict(id='A20', result='confirmed', found_value='', exact_words=q20, url_or_file='https://www.nike.com/size-fit/mens-footwear ; downloads/nike_us_mens.html', tool=TOOL, note='Both sentences in the page text as quoted by the worker (ellipses theirs); the first sits above the chart, the second in How To Measure Foot Length.'))
q21 = '"Please note that it is common for one foot to be slightly different length than the other. Apply the longer of the two measurements to our size chart to find the right correlating size for the recorded foot length. If the measurement is between sizes, we recommend sizing up."'
out.append(dict(id='A21', result='confirmed', found_value='', exact_words=q21, url_or_file='https://www.nike.com/size-fit/mens-footwear ; downloads/nike_us_mens.html', tool=TOOL, note="Confirmed on the men's page; the claim also names women, whose page is not among this check's sources and was not opened."))
record(out)
for o in out: print(o['id'], o['result'], o['found_value'])
source('''## Nike (fetched 2026-10-20T22:28Z, curl then python -I)
1. https://www.nike.com/size-fit/mens-footwear -> 200, downloads/nike_us_mens.html. Men's Footwear Size Chart in __NEXT_DATA__ (appData.cards[8d48ee84...].sizeCharts[0].data: US - Men, US - Women, US - Kids, UK, CM / JP, EU, Foot Length (in), Foot Length (cm); 38 sizes, 3.5-22) and one server-rendered table (the same rows except Foot Length (cm), the Imperial view). The CM-label note and How To Measure text in the page text. Rows A01-A11, A20, A21.
2. https://www.nike.com/size-fit/kids-footwear -> 200, downloads/nike_us_kids.html. Three charts in JSON and rendered (Big Kids (1Y - 7Y), Little Kids (8C - 3Y), Babies & Toddlers (1C - 10C)); Big Kids' rendered rows equal the JSON's; Foot Length (cm) JSON only. Rows A12-A17.
3. https://www.nike.com/gb/size-fit/mens-footwear -> 200, downloads/nike_gb_mens.html. Same chart structure, every row identical to the US chart's, no US - Kids row. Rows A18-A19.''')
