import sys, json
for f in sys.argv[1:]:
    sc=json.load(open(f))
    print('=====',f,len(sc))
    for c in sc:
        print('chart keys:',{k:(v if k!='data' else len(v)) for k,v in c.items()})
        for series in c['data']:
            print('  ',series[0]['key'],'|',' '.join((x.get('value') or '[blank]') for x in series))
