import re, json, os, html
B=os.path.dirname(os.path.abspath(__file__))+'/..'
for f in ['nike_us_mens','nike_us_womens','nike_us_kids','nike_gb_mens','nike_gb_womens']:
    h=open(f'{B}/downloads/{f}.html',encoding='utf-8').read()
    tables=re.findall(r'(?s)<table.*?</table>',h)
    blocks=json.load(open(f'{B}/downloads/{f}_sizecharts.json',encoding='utf-8'))
    js=[[ [x.get('value','') for x in s] for s in sc['data']] for b in blocks for sc in b['sizeCharts']]
    ok=[]
    for t,j in zip(tables,js):
        rows=re.findall(r'(?s)<tr.*?</tr>',t)
        cells=[[ ' '.join(html.unescape(re.sub('<[^>]+>','',c)).split()) for c in re.findall(r'(?s)<t[dh][^>]*>(.*?)</t[dh]>',r)] for r in rows]
        jn=[[ ' '.join(v.split()) for v in s] for s in j]
        ok.append(cells==jn or (len(cells),len(jn), [ (a,b) for a,b in zip(cells,jn) if a!=b][:1]))
    print(f,len(tables),len(js),ok)
