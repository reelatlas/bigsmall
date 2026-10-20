import sys, json, re
h=open(sys.argv[1],encoding='utf-8').read()
m=re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',h,re.S)
d=json.loads(m.group(1)); out=[]
def walk(o,path='',ctx=None):
    if isinstance(o,dict):
        if 'sizeCharts' in o:
            out.append({'path':path,'card':{k:v for k,v in o.items() if k!='sizeCharts' and isinstance(v,(str,int))},'sizeCharts':o['sizeCharts']})
        for k,v in o.items(): walk(v,path+'/'+k)
    elif isinstance(o,list):
        for i,v in enumerate(o): walk(v,path+f'[{i}]')
walk(d); json.dump(out,open(sys.argv[2],'w'),indent=1); print(sys.argv[1],len(out),[len(x['sizeCharts']) for x in out],[x['card'] for x in out])
