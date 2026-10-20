"""Visible text of a saved HTML file, one block per line (scripts, styles, svgs dropped)."""
import sys, re, html
h=open(sys.argv[1],encoding='utf-8',errors='replace').read()
h=re.sub(r'(?is)<(script|style|svg|noscript)\b.*?</\1>',' ',h)
h=re.sub(r'(?i)<br\s*/?>','\n',h)
h=re.sub(r'(?i)</(p|div|li|h\d|tr|td|th|section|span|button|a)>','\n',h)
h=re.sub(r'<[^>]+>',' ',h); h=html.unescape(h)
lines=[' '.join(l.split()) for l in h.split('\n')]
out=[l for l in lines if l]
open(sys.argv[2],'w',encoding='utf-8').write('\n'.join(out))
