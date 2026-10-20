import json, os
B=os.path.dirname(os.path.abspath(__file__))+'/..'
pages=[('nike.com/us','nike_us_mens','https://www.nike.com/size-fit/mens-footwear',"Men's Footwear"),
       ('nike.com/us','nike_us_womens','https://www.nike.com/size-fit/womens-footwear',"Women's Footwear"),
       ('nike.com/us','nike_us_kids','https://www.nike.com/size-fit/kids-footwear',"Kids' Footwear"),
       ('nike.com/gb','nike_gb_mens','https://www.nike.com/gb/size-fit/mens-footwear',"Men's Footwear"),
       ('nike.com/gb','nike_gb_womens','https://www.nike.com/gb/size-fit/womens-footwear',"Women's Footwear")]
rows=[]
for site,f,url,aud in pages:
    blocks=json.load(open(f'{B}/downloads/{f}_sizecharts.json',encoding='utf-8'))
    for b in blocks:
        chart=aud+(' - '+b['card']['title'] if b['card'].get('title') else '')
        for sc in b['sizeCharts']:
            for series in sc['data']:
                col=series[0].get('value','')
                for i,x in enumerate(series[1:],1):
                    v=x.get('value')
                    rows.append(dict(brand='Nike',site=site,chart=chart,column=col,row=i,value=v if v is not None else '',url=url,date_read='2026-10-20',tool='script (curl; chart data from the page\'s embedded __NEXT_DATA__ JSON, the same values as the rendered table)',notes='blank in the chart' if v is None else 'chart printed with systems as rows and sizes as columns; row = size position'))
json.dump(rows,open(f'{B}/cells/nike.json','w',encoding='utf-8'),ensure_ascii=False,indent=0)
print(len(rows))
