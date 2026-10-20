# Asics Singapore, as transcribed by the harness's fetcher (WebFetch) on 2026-10-20; the page's text lists each chart column by column and the fetcher aligned them by row.
import json, os
B=os.path.dirname(os.path.abspath(__file__))+'/..'
U='https://www.asics.com/sg/en-sg/customer-service/size-fit-guide/size-fit-guide.html'
C={"Men's/Unisex Sizes":(["US","EU","CM","UK"],"""4 36 22.5 3|4H 37 23 3.5|5 37.5 23.5 4|5H 38 24 4.5|6 39 24.5 5|6H 39.5 25 5.5|7 40 25.5 6|7H 40.5 25.75 6.5|8 41.5 26 7|8H 42 26.5 7.5|9 42.5 27 8|9H 43.5 27.5 8.5|10 44 28 9|10H 44.5 28.25 9.5|11 45 28.5 10|11H 46 29 10.5|12 46.5 29.5 11|12H 47 30 11.5|13 48 30.5 12|13H 48.5 30.75 12.5|14 49 31 13|14H 49.5 31.5 13.5|15 50.5 32 14"""),
"Women's Sizes":(["US","EU","CM","UK"],"""4 34.5 21.5 2|4H 35 22 2.5|5 35.5 22.5 3|5H 36 22.75 3.5|6 37 23 4|6H 37.5 23.5 4.5|7 38 24 5|7H 39 24.5 5.5|8 39.5 25 6|8H 40 25.5 6.5|9 40.5 25.75 7|9H 41.5 26 7.5|10 42 26.5 8|10H 42.5 27 8.5|11 43.5 27.5 9|11H 44 28 9.5|12 44.5 28.5 10|12H 45 28.75 10.5|13 46 29 11"""),
"Kids' Sizes":(["US","CM","UK","EU"],"""K10 17 K9 27|K10H 17.25 K9.5 28|K11 17.5 K10 28.5|K11H 18 K10.5 29.5|K12 18.5 K11 30|K12H 19 K11.5 30.5|K13 19.5 K12 31.5|K13H 19.75 K12.5 32|1 20 K13 32.5|1H 20.5 K13.5 33|2 21 1 33.5|2H 21.5 1.5 34.5|3 22 2 35|3H 22.25 2.5 35.5|4 22.5 3 36|4H 23 3.5 37|5 23.5 4 37.5|5H 24 4.5 38|6 24.5 5 39|6H 25 5.5 39.5|7 25.5 6 40""")}
rows=[]
for ch,(cols,data) in C.items():
    for i,r in enumerate(data.split('|'),1):
        for col,v in zip(cols,r.split()):
            rows.append(dict(brand='Asics',site='asics.com/sg',chart=ch,column=col,row=i,value=v,url=U,date_read='2026-10-20',tool="the harness's fetcher (WebFetch); a script's request was refused (403)",notes="transcribed by the fetcher's model from the page's column-by-column text, rows aligned by it; to be confirmed by a checker; the page does not say what CM measures"))
json.dump(rows,open(f'{B}/cells/asics_sg.json','w',encoding='utf-8'),ensure_ascii=False,indent=0); print(len(rows))
