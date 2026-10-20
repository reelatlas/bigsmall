import sys,os,json; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from csvlib import Brand,DL
b=Brand('Crocs')
LAB={'inches':'Heel to Toe Length (Inches)','cm':'Heel to Toe Length (Centimeters)','mm':'Heel to Toe Length (mm)','us_women':'US Women','us_men':'US Men','uk_women':'UK Women','uk_men':'UK Men','us':'US','uk':'UK','eu':'EU','jp':'Japan','kr':'Korea'}
CHART={'adults':'Adults','kids':'Kids'}
T='script (curl), JSON data file the page loads'
for f,site in(('default','crocs.com (default.json, the US and default chart)'),('gb','crocs.com gb.json (the GB region chart)'),('emea','crocs.com emea.json (the EMEA region chart)'),('japan','crocs.com japan.json (the Japan region chart)'),('korea','crocs.com korea.json (the Korea region chart)')):
    url=f'https://www.crocs.com/size-chart/{f}.json'
    d=json.load(open(os.path.join(DL,'crocs_json',f+'.json'),encoding='utf-8'))
    for k in('adults','kids'):
        rows=d[k]; keys=[]
        for r in rows:
            for kk in r:
                if kk not in keys: keys.append(kk)
        hdr=[LAB.get(kk,kk) for kk in keys]
        data=[[r.get(kk,'') for kk in keys] for r in rows]
        b.table(site,CHART[k],hdr,data,url,T,notes='column labels from the page\'s own label strings (pdp.sizechart.table); JSON key order kept; a key absent in a row is blank',
                colnotes={'Heel to Toe Length (mm)':'the page code excludes inches/cm/mm/shoe from the size labels and shows the length per a region unit setting; which of cm or mm a region displays is not confirmed'})
U='https://www.crocs.com/size-chart'
b.claim('Crocs says its chart length is the foot\'s heel-to-toe length, measured by tracing the foot','asserted by the page',U,'3. Measure the point from your heel to your longest toe. This is your Heel-to-Toe length.')
b.claim('Crocs labels every length column of the chart "Heel to Toe Length" (adults, kids, foot)','asserted by the page',U,'"adultLength":"Heel to Toe Length","kidsLength":"Heel to Toe Length","footLength":"Heel to Toe Length"')
b.claim('Crocs sizes shown on the US site are US sizes','asserted by the page',U,'All sizes shown on the website are US sizes, which matches the size on your shoes and invoice sizes.')
b.claim('Crocs offers no wide sizes (widths not charted)','asserted by the page',U,'Do you carry wide sizes? No. Most of our shoes have a roomy fit, so you\'ll likely find our standard sizes are comfortable.')
b.claim('The Crocs page loads its chart from region files /size-chart/{korea,japan,gb,emea,default}.json, chosen by the visitor\'s region','measured',U,'(page script) KOREA="korea.json", JAPAN="japan.json", GB="gb.json", EMEA="emea.json", DEFAULT="default.json"; fetch(`/size-chart/${e}`)')
b.claim('Crocs default.json adults: the cm column and the mm column disagree on every row (cm 20 beside mm 210 ... cm 35 beside mm 350), so the chart gives two lengths per size about 1 cm apart; inches track the cm column (7 5/8 in = 19.4 cm)','measured','https://www.crocs.com/size-chart/default.json','"inches": "7 5/8", "cm": "20", "mm": "210", ... "us_women": "4", "us_men": "2"')
b.claim('Crocs default.json adults: the mm column steps 260 to 265 to 270 while the Korea column steps 260mm to 270mm to 280mm, so the two disagree from US M8/W10 up','measured','https://www.crocs.com/size-chart/default.json','"cm": "26", "mm": "265", ... "kr": "270mm"')
b.claim('Crocs kids EU and Korea columns differ between default.json and gb.json/emea.json from C6 up (e.g. C6: default EU 21-22, gb/emea EU 22-23; C4 Korea default 115, gb 140)','measured','https://www.crocs.com/size-chart/gb.json','default C6 "eu": "21-22"; gb C6 "eu": "22-23"; default C4 "kr": "115"; gb C4 "kr": "140"')
b.claim('Crocs adult sizes are whole sizes only, US women = US men + 2 and UK women = UK men + 1 on every adult row, every region file','measured','https://www.crocs.com/size-chart/default.json','"us_women": "6", "us_men": "4", "uk_women": "4", "uk_men": "3"')
b.claim('Crocs japan.json and korea.json adult EU differ from default/gb/emea at the two smallest sizes (34 and 35 against 33-34 and 34-35); korea.json adult UK is one smaller than emea\'s on most rows (e.g. M4|W6 UK M2|W3 in korea, M3|W4 in emea)','measured','https://www.crocs.com/size-chart/korea.json','korea {"mm":"230","us":"M4 | W6","eu":"36-37","uk":"M2 | W3"}; emea {"cm":"22","eu":"36-37","uk":"M3 | W4","us":"M4 | W6"}')
b.claim('Crocs region files are the same on crocs.co.uk and crocs.de as on crocs.com (gb.json and emea.json byte-identical); the crocs.co.uk/size-chart HTML (401 KB) carried no measuring text in what the script read', 'measured', 'https://www.crocs.co.uk/size-chart/gb.json', '(cmp: identical)')
b.save()
