# check.csv against wave2-check.csv: every checker-C id present once, no extras, and every
# confirmed cell's found value equal to the recorded value. Reader: run with python -I.
import csv
import sys
from collections import Counter

check_path, out_path = sys.argv[1], sys.argv[2]
with open(check_path, encoding='utf-8', newline='') as f:
    mine = {r['id']: r for r in csv.DictReader(f) if r['checker'] == 'C'}
with open(out_path, encoding='utf-8', newline='') as f:
    got = {r['id']: r for r in csv.DictReader(f)}
key = lambda s: int(s[1:])
print('mine', len(mine), 'written', len(got),
      'missing', sorted(set(mine) - set(got), key=key), 'extra', sorted(set(got) - set(mine), key=key))


def norm(v):
    v = v.strip()
    if v in ('', 'N/A (null)'):
        return ''
    try:
        return repr(float(v))
    except ValueError:
        return v


bad = [(i, r['value'], got[i]['found_value']) for i, r in mine.items()
       if i in got and r['kind'] == 'cell' and got[i]['result'] == 'confirmed'
       and norm(got[i]['found_value']) != norm(r['value'])]
print('confirmed cells whose found value differs from the recorded value:', bad)
print('results:', dict(Counter(r['result'] for r in got.values())))
print('claims:', [(i, got[i]['result']) for i, r in mine.items() if r['kind'] == 'claim'])
print('empty fields:', [(i, c) for i, r in got.items() for c in ('result', 'found_value', 'exact_words', 'url_or_file', 'tool', 'date_checked') if not r[c].strip()])
