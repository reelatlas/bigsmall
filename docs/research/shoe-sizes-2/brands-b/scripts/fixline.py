# usage: python -I fixline.py FILE STARTSWITH NEWLINEFILE : replaces the first line starting with STARTSWITH by the content of NEWLINEFILE
import sys
p,start,nf=sys.argv[1:4]
L=open(p,encoding='utf-8').read().split('\n'); new=open(nf,encoding='utf-8').read().rstrip('\n')
for i,l in enumerate(L):
    if l.startswith(start): L[i]=new; break
else: sys.exit('no line')
open(p,'w',encoding='utf-8').write('\n'.join(L))
