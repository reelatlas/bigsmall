import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from csvlib import Brand, HERE
b = Brand('Birkenstock')
T = 'script (curl), saved HTML parsed by tables.py'
def J(n): return json.load(open(os.path.join(HERE, n), encoding='utf-8'))

# US conversion chart: one table with Women | Men | Kids blocks side by side
US = 'https://www.birkenstock.com/us/fit-guide/'
t = J('birk_us.json')[0]['rows']
for k, chart in enumerate(['Women', 'Men', 'Kids']):
    rows = [[r[2*k], r[2*k+1]] for r in t[2:]]
    while rows and rows[-1] == ['', '']: rows.pop()
    b.table('birkenstock.com/us', 'Size Conversion Chart: ' + chart, ['U.S. Size', 'BIRKENSTOCK Size'], rows, US, T,
            'the three audiences sit side by side in one table on the page; a blank pair (women past 11 - 11 1/2) dropped')

# Printable template PDF table (text layer), EU 24..50
PDF = 'https://www.birkenstock.com/on/demandware.static/-/Library-Sites-birkenstock-amer/default/dwa81bfd9b/documents/Measurement_Template_US_A4.pdf'
EU = list(range(24, 51))
UK = '7,0 8,0 8,5 9,0 10 11 11,5 13 13,5 1,0 2,0 2,5 3,5 4,5 5,0 5,5 7,0 7,5 8,0 9,0 9,5 10,5 11,5 12,0 13,0 14,0 14,5'.split()
MM = '150 160 165 170 180 185 190 200 205 210 220 225 230 240 245 250 260 265 270 280 285 290 300 305 310 320 325'.split()
CH = '6-6.5 7-7.5 8-8.5 9-9.5 10-10.5 11-11.5 12-12.5 13-13.5 1-1.5 2-2.5 3-3.5'.split()
LA = '4-4.5 5-5.5 6-6.5 7-7.5 8-8.5 9-9.5 10-10.5 11-11.5'.split()
ME = '7-7.5 8-8.5 9-9.5 10-10.5 11-11.5 12-12.5 13-13.5 14-14.5 15-15.5 16-16.5 17-17.5'.split()
rows = []
for i, e in enumerate(EU):
    ch = CH[i] if e <= 34 else ''
    la = LA[e-35] if 35 <= e <= 42 else ''
    me = ME[e-40] if 40 <= e <= 50 else ''
    rows.append([str(e), ch, la, me, UK[i], MM[i]])
b.table('birkenstock.com (US printable template PDF)', 'PRINTABLE SIZING TEMPLATE A4: size table',
        ['EU', 'US Children', 'US Ladies', 'US Men', 'UK', 'MM'], rows, PDF,
        'script (curl) then pdftext.py on the PDF text layer',
        'read from the PDF text layer, not the drawn page: EU, UK and MM are 27 values each in order; the US rows (11, 8, 11 values) are placed against EU by the web chart (Children from 24, Ladies from 35, Men from 40), an alignment reasoned, not seen; the US header words split as printed ("Child r en", "L adies", "M en")')

def range_chart(js, site, url, labels, note):
    for (idx, chart) in labels:
        rr = J(js)[idx]['rows']
        out = []
        for r in rr[2:]:
            if r[1] == 'Narrow':
                out.append([r[0], r[2], r[3]])
        b.table(site, chart, ['Size', 'Length From', 'Length To'], out, url, T,
                note + '; one row per size from the Narrow line; the Regular line repeats the same length; the foot-width columns (Width From/To, mm) dropped, widths noted only')
GB = 'https://www.birkenstock.com/gb/fit-guide-size-chart.html'
NL = 'https://www.birkenstock.com/on/demandware.store/Sites-EU-Site/en_NL/FitGuide-SizeChart'
range_chart('birk_gb_sizechart.json', 'birkenstock.com/gb', GB, [(0, 'Adults: UK sizes and measurements (in mm)'), (1, 'Kids: UK sizes and measurements (in mm)')], 'UK sizes with a decimal comma as printed')
range_chart('birk_nl_sizechart.json', 'birkenstock.com (Sites-EU-Site en_NL)', NL, [(0, 'Adults: EU sizes and measurements (in mm)'), (1, 'Kids: EU sizes and measurements (in mm)')], 'EU sizes')

b.claim('Birkenstock lists all its footwear in European sizes and gives the US conversion as a formula', 'asserted by the page', US, "All our footwear is listed in European sizes. To find yours, use the formula below or reference your U.S. shoe size in our conversion chart. Women's: U.S. size + 31 = EU size Men's: U.S. size + 33 = EU size")
b.claim('Birkenstock US maps a range of two US half sizes to each EU size (e.g. women 6 - 6 1/2 = 37), no foot length on the US web chart', 'asserted by the page', US, '6 - 6 1/2 | 37')
b.claim('Birkenstock US kids chart: US 6 - 6 1/2 = 24 up to 3 - 3 1/2 = 34', 'asserted by the page', US, '6 - 6 1/2 | 24 ... 3 - 3 1/2 | 34')
b.claim('Birkenstock template: the MM column is the foot length measured on the template, used to find the size; the same size and mm are written in each footbed', 'asserted by the page', PDF, "HOW TO DETERMINE YOUR SHOE SIZE: If you've measured your feet then all you have to do is use that millimeter measurement to find your shoe size in the table. Remember that every BIRKENSTOCK has its shoe size and millimeter size written in the footbed")
b.claim('Birkenstock GB and EU charts give each size a foot-length range in mm (From/To), identical between the UK-labelled (gb) and EU-labelled (en_NL) pages row for row (UK 2,5 = EU 35 = 221 to 225 ... UK 14,5 = EU 50 = 321 to 325)', 'measured', GB, 'UK sizes and measurements (in mm) Size | Width | Length | Width From | To | From | To 2,5 | Narrow | 221 | 225 | 81 | 84')
b.claim("Birkenstock template's single MM per size equals the upper bound ('To') of the web chart's range at every EU size 24 to 50 (35: 225, 40: 260, 50: 325)", 'measured', PDF, 'MM | 150 | 160 | 165 ... 320 | 325')
b.claim('Birkenstock charts give foot width in mm and two widths (Narrow, Regular; US page: regular/wide, medium/narrow): not charted here', 'asserted by the page', US, "Choose Regular for medium to wide feet or Narrow for narrow to medium. Women's width equivalent: C-D. Men's width equivalent: D-EE.")
b.claim('Birkenstock (Malaysia fit calculator) advises the next size up when unsure', 'asserted by the page', 'https://www.birkenstock.com/my/passform/knowledge-fit.html', 'If are unsure about your size, we recommend choosing the next size up, as feet expand slightly during the day. This calculation is based on our size chart')
b.claim('Birkenstock US fit test: about a quarter inch of space around the foot on the footbed', 'asserted by the page', US, "Check that your toes don't touch the edge of the footbed. Aim for about ¼ inch of space around your foot.")
b.claim('Birkenstock GB alternates /on/demandware.store/Sites-EU-Site/en_GB/Page-Show?cid=us-service-fittingguide and /gb/fit-guide/ returned 404; the GB chart was reached at /gb/fit-guide-size-chart.html', 'measured', 'https://www.birkenstock.com/gb/fit-guide/', '(curl: 404)')
b.save()
