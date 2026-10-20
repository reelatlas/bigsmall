import sys, os, csv, collections, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
from nike_charts import charts
# A21: the women's page, opened as a second source for the claim's "women"
rows = {r['id']: r for r in csv.DictReader(open(os.path.join(B, 'check.csv'), encoding='utf-8', newline=''))}
a21 = dict(rows['A21']); a21['url_or_file'] += ' ; https://www.nike.com/size-fit/womens-footwear ; downloads/nike_us_womens.html'
a21['note'] = "Confirmed on the men's page, and the same sentences on the women's page (Women's Shoes), fetched for the claim's 'women' (2026-10-20T22:37Z)."
record([a21])
source('''## Extra page for A21 (fetched 2026-10-20T22:37Z, curl then python -I)
22. https://www.nike.com/size-fit/womens-footwear -> 200, downloads/nike_us_womens.html. The same CM-label note and the same between-sizes advice as the men's page. Row A21 (women).''')
# tally and coverage
rows = list(csv.DictReader(open(os.path.join(B, 'check.csv'), encoding='utf-8', newline='')))
mine = myrows()
print('rows in check.csv:', len(rows), '| ids match my rows:', sorted(r['id'] for r in rows) == sorted(mine))
print(collections.Counter(r['result'] for r in rows))
print('tools:', collections.Counter(r['tool'].split(' (')[0] for r in rows))
# Nike: is the cm row the inch row converted?
c = {r[0]: r[1:] for r in charts('nike_us_mens')[0][3]}
def frac(s):
    p = s.split(); return float(p[0]) + (eval_frac(p[1]) if len(p) > 1 else 0)
def eval_frac(f): a, b = f.split('/'); return int(a) / int(b)
d = [(m, i, cm, round(frac(i) * 2.54, 2)) for m, i, cm in zip(c['US - Men'], c['Foot Length (in)'], c['Foot Length (cm)'])]
print('Nike cm minus inches-converted (mm):', sorted(set(round((float(cm) - x) * 10, 1) for _, _, cm, x in d)))
print('rounded-to-mm matches:', sum(1 for _, _, cm, x in d if abs(float(cm) - round(x, 1)) < 1e-9), 'of', len(d), '| truncated-to-mm matches:', sum(1 for _, _, cm, x in d if abs(float(cm) - int(x * 10) / 10) < 1e-9))
