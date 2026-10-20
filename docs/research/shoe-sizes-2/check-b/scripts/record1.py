import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common
S = 'script (python urllib: fetch.py; parsed with html.parser: parse_html.py)'
def U(url, f): return f'{url} | check-b/downloads/{f}'
GB = U('https://www.clarks.com/en-gb/fitguide', 'clarks_gb_fitguide.html')
IE = U('https://www.clarks.com/en-ie/fitguide', 'clarks_ie_fitguide.html')
USM = U('https://www.clarks.com/en-us/fit-guide/mens', 'clarks_us_mens.html')
USW = U('https://www.clarks.com/en-us/fit-guide/womens', 'clarks_us_womens.html')
BUS = U('https://www.birkenstock.com/us/fit-guide/ (redirected to https://www.birkenstock.com/us/us-service-fittingguide.html)', 'birk_us_fitguide.html')
BGB = U('https://www.birkenstock.com/gb/fit-guide-size-chart.html', 'birk_gb_sizechart.html')
SSG = U('https://sg.salomon.com/pages/men-size-guide', 'salomon_sg_men.html')
BRC = U('https://support.brooksrunning.com.au/hc/en-us/articles/360047594793-Size-Conversion-Chart', 'brooks_au_conversion.html')
BRH = U('https://support.brooksrunning.com.au/hc/en-us/articles/360046951054-How-do-I-know-my-shoe-size', 'brooks_au_howknow.html')
gbm = "Men's chart (caption 'Mens Clarks Shoe Sizes'), data row 11: Clarks UK Size 10 | Clarks EU Size 44½ | Standard EU Size 45 | Foot Length (Millimetres)(MMs) 280. Both EU columns and the length as recorded."
gbw = "Women's chart (caption 'Womens Clarks Shoe Sizes'), data row 5: Clarks UK Size 5 | Clarks EU Size 38 | Standard EU Size 38 | Foot Length 237."
gbk = ("Kids & Babies chart, data row 7: Clarks UK Size 5 | Clarks EU Size 21 | Foot Length 126 (the infant 5). The check's expectation (a millimetre from the women's) does not hold for this row: "
       "the kids' chart runs 2 to 13½ then restarts at 1 to 10 (43 data rows), and its second UK 5, data row 33, reads EU 38 | 236 mm, one millimetre under the women's 237. The recorded cell at row 7 is as printed.")
usm = "US men's chart (heading 'Men’s Shoe Size Chart'; columns US Size, UK Size, Foot Length (IN)): row 1 = US 7 | UK 6 | 9.7; row 8 = US 10½ | UK 9½ | 10.9; row 14 (last) = US 15 | UK 14 | 12.4. Every cell at these rows as recorded."
rows = [
 dict(id='B01', result='confirmed', found_value='44½', url_or_file=GB, tool=S, note=gbm),
 dict(id='B02', result='confirmed', found_value='45', url_or_file=GB, tool=S, note=gbm),
 dict(id='B03', result='confirmed', found_value='280', url_or_file=GB, tool=S, note=gbm + ' Heading carries the unit: Foot Length (Millimetres)(MMs).'),
 dict(id='B04', result='confirmed', found_value='237', url_or_file=GB, tool=S, note=gbw),
 dict(id='B05', result='confirmed', found_value='38', url_or_file=GB, tool=S, note=gbw),
 dict(id='B06', result='confirmed', found_value='126', url_or_file=GB, tool=S, note=gbk),
 dict(id='B07', result='confirmed', found_value='21', url_or_file=GB, tool=S, note=gbk),
 dict(id='B08', result='confirmed', found_value='', exact_words='*These measurements do not correlate to measuring with a Clarks foot gauge. For this method, follow these instructions .', url_or_file=IE, tool=S,
      note="On the IE page, at the end of the measuring steps ('...take the length in millimetres from the tip of your longest toe to your heel. (Please be aware that your longest toe may not always be your big toe.)'), just above the Kids & Babies chart; the GB page carries the same sentence in the same place."),
 dict(id='B09', result='confirmed', found_value='9.7', url_or_file=USM, tool=S, note=usm),
 dict(id='B10', result='confirmed', found_value='6', url_or_file=USM, tool=S, note=usm),
 dict(id='B11', result='confirmed', found_value='10.9', url_or_file=USM, tool=S, note=usm),
 dict(id='B12', result='confirmed', found_value='9½', url_or_file=USM, tool=S, note=usm),
 dict(id='B13', result='confirmed', found_value='12.4', url_or_file=USM, tool=S, note=usm + ' Past US 12 the chart steps by whole sizes (12, 13, 14, 15).'),
 dict(id='B14', result='confirmed', found_value='14', url_or_file=USM, tool=S, note=usm),
 dict(id='B15', result='confirmed', found_value='', exact_words='Account for Foot Swelling Feet may swell throughout the day, particularly in warm weather or after prolonged standing. Consider sizing up slightly to accommodate potential swelling and ensure comfort throughout the day.', url_or_file=USW, tool=S,
      note="Under the heading 'Account for Foot Swelling' on the US women's fit guide; the US men's fit guide carries no such advice (no 'swelling' anywhere in it)."),
 dict(id='B34', result='confirmed', found_value='6 - 6 1/2', url_or_file=BUS, tool=S, note="Size Conversion Chart, Women columns (U.S. Size | BIRKENSTOCK Size), data row 3: '6 - 6 1/2' | 37. The URL now redirects to us-service-fittingguide.html."),
 dict(id='B35', result='confirmed', found_value='10 - 10 1/2', url_or_file=BUS, tool=S, note="Size Conversion Chart, Men columns, data row 4: '10 - 10 1/2' | 43 (the men's run is 40 to 50, the women's 35 to 42)."),
 dict(id='B36', result='confirmed', found_value='', exact_words='All our footwear is listed in European sizes. To find yours, use the formula below or reference your U.S. shoe size in our conversion chart. Women’s: U.S. size + 31 = EU size Men’s: U.S. size + 33 = EU size', url_or_file=BUS, tool=S,
      note="Under 'FIND YOUR EUROPEAN SIZE'; the page writes Women’s and Men’s with a curly apostrophe. The chart agrees with the formula (W 6 -> 37, M 10 -> 43)."),
 dict(id='B37', result='confirmed', found_value='251', url_or_file=BGB, tool=S, note="Adults tab, subtitle 'UK sizes and measurements (in mm)'; size 7 is the 6th size (2,5; 3,5; 4,5; 5; 5,5; 7: comma decimals, no 6 or 6,5), spanning a Narrow and a Regular line, both Length From 251 To 260. Columns: Size | Width (Narrow/Regular) | Length From, To | Width From, To."),
 dict(id='B38', result='confirmed', found_value='260', url_or_file=BGB, tool=S, note="As B37: size 7, Length From 251 To 260 on both the Narrow and the Regular line; widths 90-95 (Narrow), 96-104 (Regular)."),
 dict(id='B58', result='confirmed', found_value='15 M', url_or_file=SSG, tool=S, note="Men's Footwear Sizing Guide, last data row (23): UK 14.5 | EUR 50 2/3 | JP 33 | US 15 M | FOOT LENGTH (CM) 32,5 | FOOT LENGTH (INCH) 12,8."),
 dict(id='B59', result='confirmed', found_value='32,5', url_or_file=SSG, tool=S, note="As B58; the page writes the length with a comma decimal (32,5)."),
 dict(id='B60', result='confirmed', found_value='50 2/3', url_or_file=SSG, tool=S, note="As B58."),
]
brk = ("US men's 9 is the table's 14th row as the worker counted (11 data rows, an empty row, a repeated header row, then this row): US Men 9 | US Women 10.5 | UK Men 8 | UK Women 8.5 | Europe Unisex 42.5 | Japan Men (cm) 27 | Japan Women (cm) 28.")
for i, v in zip(['B61','B62','B63','B64','B65','B66'], ['10.5','8','8.5','42.5','27','28']):
    rows.append(dict(id=i, result='confirmed', found_value=v, url_or_file=BRC, tool=S, note=brk))
rows.append(dict(id='B67', result='confirmed', found_value='', exact_words='4 | 5.5 | 3 | 3.5 | 36 | 23 | 22.5 ; 4.5 | 6 | 3.5 | 4 | 36.5 | 23 | 23 ; 6.5 | 8 | 5.5 | 6 | 39 | 25 | 25 ; 7 | 8.5 | 6 | 6.5 | 40 | 25 | 25.5 ; 8.5 | 10 | 7.5 | 8 | 42 | 26.5 | 27 ; 9 | 10.5 | 8 | 8.5 | 42.5 | 27 | 28', url_or_file=BRC, tool=S,
      note="All three named: Japan Men 23 at US M 4 and 4.5; 25 at US M 6.5 and 7; Japan Women 27 at US W 10, then 28 at US W 10.5 (a 1 cm step where its neighbours step 0.5). The four rows the worker quoted match cell for cell. Also seen: Europe Unisex steps 36.5 to 37.5 (US M 4.5 to 5) and 39 to 40 (6.5 to 7); Japan Women is blank from US W 13 (US M 11.5) on."))
rows.append(dict(id='B68', result='confirmed', found_value='', exact_words='Because the foot is three-dimensional, any two-dimensional measuring tool, such as a ruler or Brannock device® can only approximate your true shoe size. Please also keep in mind that manufacturers use different lasts to construct their shoes, and sizing may vary accordingly.', url_or_file=BRH, tool=S,
      note="Word for word, ® included; the next sentence: 'Note that the Brooks running shoes are all in US sizes.'"))
common.record(rows)
for what, url, f, gave in [
 ('Clarks GB fit guide', 'https://www.clarks.com/en-gb/fitguide', 'clarks_gb_fitguide.html', '200, server-rendered HTML tables: women, men, kids and babies (sizes and widths); B01-B07'),
 ('Clarks IE fit guide', 'https://www.clarks.com/en-ie/fitguide', 'clarks_ie_fitguide.html', '200, same tables as GB; the foot-gauge sentence; B08'),
 ("Clarks US men's fit guide", 'https://www.clarks.com/en-us/fit-guide/mens', 'clarks_us_mens.html', '200, HTML table US/UK/inches; B09-B14'),
 ("Clarks US women's fit guide", 'https://www.clarks.com/en-us/fit-guide/womens', 'clarks_us_womens.html', '200, HTML table; the swelling advice; B15'),
 ('Clarks AU size guide', 'https://clarks.com.au/pages/size-guide', 'clarks_au_sizeguide.html', '200, five HTML tables; B16-B18'),
 ('Dr. Martens US size guide (script attempt)', 'https://www.drmartens.com/us/en/about/size-guide', 'drm_us_sizeguide_script.html', '403 from Cloudflare to the script, as for the worker; re-read through the fetcher'),
 ('Dr. Martens DK/EU size guide (script attempt)', 'https://www.drmartens.com/dk/en_eu/shoe-size-guide', 'drm_dk_sizeguide_script.html', '403 from Cloudflare to the script; re-read through the fetcher'),
 ('Birkenstock US fit guide', 'https://www.birkenstock.com/us/fit-guide/', 'birk_us_fitguide.html', '200 after a redirect to /us/us-service-fittingguide.html; conversion table and the formula; B34-B36'),
 ('Birkenstock GB size chart', 'https://www.birkenstock.com/gb/fit-guide-size-chart.html', 'birk_gb_sizechart.html', '200, Adults and Kids tables in mm; B37-B38'),
 ('Birkenstock US printable template A4 (PDF)', 'https://www.birkenstock.com/on/demandware.static/-/Library-Sites-birkenstock-amer/default/dwa81bfd9b/documents/Measurement_Template_US_A4.pdf', 'birk_template_us_a4.pdf', '200, application/pdf, 693,592 bytes; B39-B42'),
 ('Crocs default.json', 'https://www.crocs.com/size-chart/default.json', 'crocs_default.json', '200 JSON; B43-B47, B49-B50'),
 ('Crocs gb.json', 'https://www.crocs.com/size-chart/gb.json', 'crocs_gb.json', '200 JSON; the comparison for B49'),
 ('Crocs size chart page', 'https://www.crocs.com/size-chart', 'crocs_sizechart.html', '200, Next.js page, no server-rendered table; B48, B51'),
 ('Salomon US sizing chart', 'https://www.salomon.com/en-us/sizingchart', 'salomon_us_sizingchart.html', '200 (Vercel), chart in Next.js flight data; B52-B57'),
 ("Salomon SG men's size guide", 'https://sg.salomon.com/pages/men-size-guide', 'salomon_sg_men.html', '200, HTML table; B58-B60'),
 ('Brooks Australia size conversion chart', 'https://support.brooksrunning.com.au/hc/en-us/articles/360047594793-Size-Conversion-Chart', 'brooks_au_conversion.html', '200, one HTML table with a blank row and a repeated header mid-table; B61-B67'),
 ('Brooks Australia: How do I know my shoe size?', 'https://support.brooksrunning.com.au/hc/en-us/articles/360046951054-How-do-I-know-my-shoe-size', 'brooks_au_howknow.html', '200, article text; B68')]:
    common.log_source(dict(what=what, url=url, file='check-b/downloads/' + f, tool='script (python urllib, 2026-10-20 15:29)', gave=gave))
print('recorded', len(rows))
