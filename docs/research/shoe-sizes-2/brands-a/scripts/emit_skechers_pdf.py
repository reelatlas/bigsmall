# Transcribed from the text layer of downloads/skechers_kids_size_chart.pdf (pdftotext -raw and -layout), the cells as printed.
import json, os
B=os.path.dirname(os.path.abspath(__file__))+'/..'
U='https://digital-assets.skechers.com/skechers/new-site/kids-size-chart.pdf'
T={"Infant":{"USA":"0 1 2 3","UK":"n/a 0 1 2","EU":"n/a 16 17 19"},
   "Toddler (1-3 years old)":{"USA":"4 5 6 7 8 9 10","UK":"3 4 5 6 7 8 9","EU":"20 21 22 23 24 25 26"},
   "Little Kids (4-8 years old)":{"USA":"10.5 11 11.5 12 12.5 13 13.5 1 1.5 2 2.5 3 3.5","UK":"9.5 10 10.5 11 11.5 12 12.5 13 13.5 1 1.5 2 2.5","EU":"27 27 28 28 29 30 31 32 33 33.5 34 35 35.5"},
   "Big Kids (8-10 years old)":{"USA":"4 4.5 5 5.5 6 6.5 7","UK":"3 3.5 4 4.5 5 5.5 6","EU":"36 36.5 37 37.5 38 39 40"}}
rows=[]
for ch,cols in T.items():
    for col,vals in cols.items():
        for i,v in enumerate(vals.split(),1):
            rows.append(dict(brand='Skechers',site='digital-assets.skechers.com (PDF linked from skechers.com/size-chart in an HTML comment, not shown on the page)',chart='SHOE FIT GUIDE - '+ch,column=col,row=i,value=v,url=U,date_read='2026-10-20',tool='script (curl) then pdftotext text layer',notes='a printable foot gauge; the size marks along its ruler are drawn, not tabulated, so no foot length per size is recorded'))
json.dump(rows,open(f'{B}/cells/skechers_pdf.json','w',encoding='utf-8'),ensure_ascii=False,indent=0); print(len(rows))
