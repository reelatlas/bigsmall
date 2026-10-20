# usage: python -I text.py FILE.html START_REGEX [MAXCHARS] -> visible text from the first match of START_REGEX
import sys,re
sys.stdout.reconfigure(encoding='utf-8')
s=open(sys.argv[1],encoding='utf-8',errors='replace').read()
s=re.sub(r'(?is)<(script|style|noscript|svg)\b.*?</\1>',' ',s)
s=re.sub(r'(?i)<(br|/p|/div|/h\d|/li|/tr|/th|/td|/button|/span)[^>]*>',lambda m:' | ' if m.group(1).lower() in('/td','/th') else '\n',s)
s=re.sub(r'<[^>]+>',' ',s)
import html; s=html.unescape(s)
s=re.sub(r'[ \t]+',' ',s); s=re.sub(r'\n\s*\n+','\n',s)
m=re.search(sys.argv[2],s)
n=int(sys.argv[3]) if len(sys.argv)>3 else 4000
print(s[m.start():m.start()+n] if m else 'NO MATCH')
