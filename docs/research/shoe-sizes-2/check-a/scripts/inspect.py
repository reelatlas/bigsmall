import sys, os, re, glob
sys.stdout.reconfigure(encoding='utf-8')
D = sys.argv[1]
keys = ['<table', '__NEXT_DATA__', 'captcha', 'Access Denied', 'challenge', 'Foot Length', 'Heel', '42.5', '27.5', 'size-chart', 'application/json', 'application/ld+json']
for p in sorted(glob.glob(os.path.join(D, '*.html'))):
    t = open(p, encoding='utf-8', errors='replace').read()
    m = re.search(r'<title[^>]*>(.*?)</title>', t, re.S | re.I)
    title = (m.group(1).strip()[:70] if m else '-')
    counts = {k: t.count(k) for k in keys}
    print(os.path.basename(p), len(t), '|', title, '|', ' '.join('%s=%d' % (k, v) for k, v in counts.items() if v))
    if os.path.basename(p) == 'asics_sg.html':
        print('   SG body:', re.sub(r'\s+', ' ', t)[:400])
