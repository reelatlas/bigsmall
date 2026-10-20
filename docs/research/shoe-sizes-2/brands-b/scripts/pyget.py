# usage: python -I pyget.py URL OUTFILE : plain GET with python's ssl, logs status
import sys,urllib.request,ssl
u,o=sys.argv[1:3]
try:
    r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0','Accept':'text/html,application/json'}),timeout=30,context=ssl.create_default_context())
    b=r.read(); open(o,'wb').write(b); print(r.status,len(b))
except Exception as e: print('ERR',type(e).__name__,str(e)[:200])
