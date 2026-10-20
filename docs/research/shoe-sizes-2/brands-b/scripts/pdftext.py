# usage: python -I pdftext.py FILE.pdf -> crude text from Flate streams (Tj/TJ strings)
import sys, re, zlib
sys.stdout.reconfigure(encoding='utf-8')
b = open(sys.argv[1], 'rb').read()
n = 0
STR = rb'\(((?:[^()\x5c]|\x5c.)*)\)'
for m in re.finditer(rb'stream\r?\n(.*?)\r?\nendstream', b, re.S):
    try:
        d = zlib.decompress(m.group(1))
    except Exception:
        continue
    out = []
    for tm in re.finditer(STR + rb'\s*Tj|\[(.*?)\]\s*TJ', d, re.S):
        if tm.group(1) is not None:
            out.append(tm.group(1))
        else:
            out.append(b''.join(re.findall(STR, tm.group(2), re.S)))
    if out:
        n += 1
        print('--stream', n)
        print(b' | '.join(out).decode('latin-1')[:4000])
print('streams with text', n)
