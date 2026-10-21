import csv, sys, os, re, subprocess, time, collections, concurrent.futures
from urllib.parse import urlparse
CSV, OUT, LOG = sys.argv[1], sys.argv[2], sys.argv[3]
only = set(sys.argv[4].split(',')) if len(sys.argv) > 4 and sys.argv[4] else None
UA = 'bigsmall-research-checker/1.0 (research script verifying published shoe size charts)'
with open(CSV, encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
urls = []
for r in rows:
    for k in ('url', 'second_url'):
        u = (r.get(k) or '').strip()
        if u and u not in urls:
            urls.append(u)
def slug(u):
    s = re.sub(r'^https?://', '', u)
    return re.sub(r'[^A-Za-z0-9]+', '_', s).strip('_')[:80]
SNIFF = ['captcha', 'access denied', 'pardon our interruption', 'cf-chl', 'challenge-platform', 'px-captcha',
         'incapsula', 'request unsuccessful', 'are you a robot', 'verify you are human', 'datadome', 'just a moment']
def fetch(i, u):
    base = f"{i:02d}_{slug(u)}"
    tmp = os.path.join(OUT, base + '.part')
    cmd = ['curl', '-sS', '-L', '--compressed', '--max-time', '45', '-A', UA,
           '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8',
           '-H', 'Accept-Language: en', '-o', tmp,
           '-w', '%{http_code}\t%{url_effective}\t%{content_type}\t%{size_download}', u]
    t0 = time.time()
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=70)
        out, err = p.stdout.strip(), p.stderr.strip()
    except Exception as e:
        out, err = '', repr(e)
    parts = (out.split('\t') if out else []) + ['000', '', '', '0']
    code, eff, ctype, size = parts[:4]
    ext = '.pdf' if 'pdf' in ctype.lower() else '.json' if 'json' in ctype.lower() else '.html'
    final = os.path.join(OUT, base + ext)
    if os.path.exists(tmp):
        os.replace(tmp, final)
    else:
        final = ''
    flags = ''
    if final and ext != '.pdf':
        txt = open(final, 'rb').read().decode('utf-8', 'replace').lower()
        flags = ';'.join(p for p in SNIFF if p in txt)
    return dict(i=i, url=u, code=code, effective=eff, ctype=ctype, size=size,
                file=os.path.basename(final), err=err[:200], flags=flags, secs=round(time.time() - t0, 1),
                date='2026-10-21')
byhost = collections.OrderedDict()
for i, u in enumerate(urls, 1):
    if only and str(i) not in only:
        continue
    byhost.setdefault(urlparse(u).netloc, []).append((i, u))
def run_host(items):
    res = []
    for n, (i, u) in enumerate(items):
        if n:
            time.sleep(1.5)
        res.append(fetch(i, u))
    return res
results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    for res in ex.map(run_host, byhost.values()):
        results.extend(res)
results.sort(key=lambda d: d['i'])
newfile = not os.path.exists(LOG)
with open(LOG, 'a', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(results[0].keys()))
    if newfile:
        w.writeheader()
    w.writerows(results)
for d in results:
    print(f"{d['i']:02d} {d['code']} {d['size']:>8} {d['ctype'][:28]:28} {d['flags'][:30]:30} {d['file'][:60]} {d['err'][:60]}")
