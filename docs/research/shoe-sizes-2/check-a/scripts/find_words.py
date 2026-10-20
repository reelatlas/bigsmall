# usage: find_words.py <page name> <regex> [<regex> ...] : prints the rendered text around each hit (scripts stripped), then JSON-string hits
import sys, os, re, json, html as H
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
name = sys.argv[1]; pats = sys.argv[2:]
raw = load(name); txt = text_of(raw)
for p in pats:
    ms = list(re.finditer(p, txt, re.I))
    print('== TEXT', name, repr(p), len(ms), 'hits')
    for m in ms[:3]:
        print('   ...' + txt[max(0, m.start() - 250): m.end() + 350] + '...')
    if not ms:
        # look inside script blocks (JSON strings) too
        ms2 = list(re.finditer(p, H.unescape(raw), re.I))
        print('   in raw incl. scripts:', len(ms2))
        for m in ms2[:2]:
            s = H.unescape(raw)
            print('   RAW...' + s[max(0, m.start() - 250): m.end() + 350].replace('\n', ' ') + '...')
