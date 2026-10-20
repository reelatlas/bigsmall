import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from csvlib import Brand, HERE
b = Brand('Salomon')
T = 'script (curl), Next.js flight data in the saved HTML decoded by salomon_tables.py'
def J(n): return json.load(open(os.path.join(HERE, n), encoding='utf-8'))
def emit(js, idx, site, url, chart):
    t = J(js)[idx]
    hr = t['header_raw']
    hdr = []
    for h in hr:
        if 'cm' in h and 'inch' in h:
            hdr += [h['cm'], h['inch']]
        else:
            hdr.append(h['title'])
    rows = []
    for r in t['others']['rows']:
        row = []
        for h, c in zip(hr, r):
            if 'cm' in h and 'inch' in h:
                row += [c.get('cm', ''), c.get('inch', '')]
            else:
                row.append(c.get('title', ''))
        rows.append(row)
    b.table(site, chart, hdr, rows, url, T,
            'the length column carries a cm and an inch value (a page toggle); both kept as two columns; header spacing ("US  ") as in the data; decimal commas as printed')
    return hdr, rows
US = 'https://www.salomon.com/en-us/sizingchart'
NO = 'https://www.salomon.com/en-no/sizingchart'
u = {}
for idx, chart in ((60, 'Unisex Footwear'), (88, "Men's Footwear"), (89, "Women's Footwear"), (73, "Kid's Footwear")):
    u[chart] = emit('sal_us.json', idx, 'salomon.com/en-us', US, chart)
n = emit('sal_no.json', 99, 'salomon.com/en-no', NO, "Men's Footwear")
same = n[1] == u["Men's Footwear"][1]
b.claim('Salomon en-no Men\'s Footwear chart equals the en-us one cell for cell: ' + str(same) + ' (the en-no page carried only the Men\'s footwear table among the footwear charts in its data)', 'measured', NO, '(compared by script)')
b.claim('Salomon footwear charts give foot length per size in cm (to the half cm) and in inches, against UK, EUR (in thirds: 36 2/3, 40 2/3), US, and JP', 'asserted by the page', US, '"FOOT LENGTH (CM)" / "FOOT LENGTH (INCH)" ... {"cm": "22", "inch": "8,7"} ... "36 2/3"')
b.claim('Salomon JP column is the foot length plus 0.5 cm on the adult charts (foot 21,5 = JP 22; foot 24,5 = JP 25)', 'measured', US, 'Unisex Footwear: "21,5" | "3.5" | "36" | "4M / 5 W" | "22"')
b.claim('Salomon tells the visitor to measure the foot, in the socks worn, heel against a wall, the longer foot deciding', 'asserted by the page', US, 'Make sure you are wearing the same socks that you would normally wear with this type of shoe ... Then use a pen to draw a line just in front of your big toe. Repeat for both feet and take the longer distance to determine your size.')
b.claim('Salomon: for a wide foot, add half a size', 'asserted by the page', US, "If the width is more than 107mm (4.21''), your foot is wide. To have a better fit, you can: ... or, you can add +0.5 to your order size.")
b.claim('Salomon unisex chart writes US as men and women together (US women = men + 1: "4M / 5 W")', 'asserted by the page', US, '"4M / 5 W", "4.5 M / 5.5 W"')
b.claim('Salomon kids chart marks kids sizes with "(Kid)" in UK and US columns', 'asserted by the page', US, '"8.5(Kid)" | "26" | "9(Kid)"')
b.claim('Salomon also publishes per-model ski boot and snowboard boot charts (foot length mm against order size, boot sole length, last width) on the same page: out of scope, not transcribed', 'asserted by the page', US, '"FOOT LENGTH (MM)", "ORDER SIZE", "EURO", "UK", "US", "BOOT SOLE LENGTH(mm)", "LAST WIDTH (mm)"')
b.claim('Salomon /en-us/size-guide returned 404; the chart is at /en-us/sizingchart', 'measured', 'https://www.salomon.com/en-us/size-guide', '(curl: 404)')
T2 = 'script (curl), saved HTML parsed by tables.py'
for js, chart, url in (('salomon_sg_men.json', 'Men Size Guide: footwear', 'https://sg.salomon.com/pages/men-size-guide'), ('salomon_sg_women.json', 'Women Size Guide: footwear', 'https://sg.salomon.com/pages/women-size-guide'), ('salomon_sg_unisex.json', 'Unisex Size Guide: footwear', 'https://sg.salomon.com/pages/unisex-size-guide')):
    t = J(js)[0]['rows']
    b.table('sg.salomon.com', chart, t[0], t[1:], url, T2, 'Salomon Singapore store (sg.salomon.com, a Shopify page; its operator not stated in what was read); first table of the page only, apparel and socks tables skipped')
b.claim("Salomon Singapore men's footwear chart runs 23 rows from foot 21,5 cm (UK 3.5, 4M) to 32,5 (UK 14.5, 15 M), where salomon.com/en-us Men's Footwear runs 15 rows from 24,5 to 31,5; on the shared rows the cells agree, and the SG women's and unisex charts match the en-us ones (column order differs: UK first)", 'measured', 'https://sg.salomon.com/pages/men-size-guide', 'UK | EUR | JP | US | FOOT LENGTH (CM) | FOOT LENGTH (INCH) 3.5 | 36 | 22 | 4M | 21,5 | 8,5')
b.claim('Salomon Malaysia kids page (my.salomon.com/pages/kids-size-guide) served no table in its HTML', 'measured', 'https://my.salomon.com/pages/kids-size-guide', '(curl: 200, no <table>)')
b.save()
