import sys, os, csv
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
p = os.path.join(B, 'sources.md'); s = open(p, encoding='utf-8').read()
old = 'CM 0.5 above the US site\'s at US 5-6 and 7.5-12, equal at 6.5-7; UK 0.5 below at US 5-8, equal from 8.5; Euro equal throughout.'
new = 'Against the US site, CM 0.5 lower at US 5-6, equal at 6.5-7, 0.5 higher at 7.5-12 (the UK site climbs 0.5 per half size, 22 to 29; the US site repeats 23.5 and 24); UK 0.5 lower at US 5-8, equal from 8.5; Euro equal throughout.'
assert s.count(old) == 1; open(p, 'w', encoding='utf-8').write(s.replace(old, new))
rows = {r['id']: r for r in csv.DictReader(open(os.path.join(B, 'check.csv'), encoding='utf-8', newline=''))}
for i in ('A103', 'A104'):
    r = dict(rows[i]); r['note'] += ' Across the chart: CM 0.5 lower than the US site at US 5-6, equal at 6.5-7, 0.5 higher at 7.5-12 (the UK site climbs 0.5 cm per half size, 22 to 29; the US site prints 23.5 at both 6 and 6.5 and 24 at both 7 and 7.5); UK 0.5 lower at US 5-8, equal from 8.5; Euro equal throughout.'
    record([r])
print(open(p, encoding='utf-8').read()[-900:])
