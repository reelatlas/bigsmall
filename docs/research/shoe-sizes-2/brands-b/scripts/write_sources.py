# writes ../sources.md: every page opened, in order, and what it gave (script fetches from fetchlog.tsv are listed in the table at the end)
import os, csv
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
S = [
 ('search', 'web search: Clarks, Dr. Martens, Birkenstock, Timberland, UGG, Crocs, HOKA, On, Brooks, Salomon size charts (10 queries)', 'candidate URLs; summaries are leads, never cited'),
 ('script', 'https://www.clarks.com/en-ie/fitguide', 'Clarks IE: Womens, Mens, Kids & Babies charts, UK / Clarks EU / Standard EU / foot length mm; widths tables; gauge disclaimer'),
 ('script', 'https://www.drmartens.com/us/en/about/size-guide', '403 bot check ("Help us verify real visitors")'),
 ('script', 'https://www.drmartens.com/uk/en_gb/shoe-size-guide', '403 bot check'),
 ('script', 'https://www.birkenstock.com/us/fit-guide/', 'Birkenstock US: Size Conversion Chart (Women, Men, Kids), formula, width notes, template link'),
 ('script', 'https://www.brooksrunning.com/en_us/unisex-footwear-size-chart.html', '403 Access Denied'),
 ('script', 'https://www.ugg.com/size-chart.html', '406 BLOCKED_EDGE'),
 ('script', 'https://www.crocs.com/size-chart.html', 'Crocs: page shell with measuring text and FAQ; the chart is loaded from /size-chart/*.json'),
 ('script', 'https://www.hoka.com/en/us/size-chart.html', '406 Access Denied'),
 ('script', 'https://www.on.com/en-us/size-guide', '200, 4 KB client-rendered shell, no chart'),
 ('script', 'https://www.salomon.com/en-us/size-guide', '404'),
 ('script', 'https://www.timberland.com/en-us/size-chart', '403'),
 ('script', 'https://www.crocs.com/_next/static/... (49 script chunks)', 'found the chart component and its data files korea/japan/gb/emea/default.json'),
 ('script', 'https://www.crocs.com/size-chart/{default,gb,emea,japan,korea}.json', 'Crocs adults and kids charts per region, every cell'),
 ('script', 'https://www.clarks.com/en-gb/fitguide', 'Clarks GB: identical to IE'),
 ('script', 'https://www.clarks.com/en-us/fitguide', '404'),
 ('script', 'https://clarks.com.au/pages/size-guide', 'Clarks Australia: Mens (no length), Womens (cm), Kids three tabs (cm); approximate disclaimer; foot not shoe length'),
 ('script', 'https://www.birkenstock.com/gb/fit-guide/ and /de/fit-guide/', '404'),
 ('search', 'web search on clarks.com: US fit guide', 'URLs of /en-us/fit-guide, /womens, /mens'),
 ('script', 'https://www.clarks.com/en-us/fit-guide', '200, no chart table in the HTML'),
 ('script', 'https://www.clarks.com/en-us/fit-guide/womens', "Clarks US Women's Shoe Size Chart (US, UK, foot length IN)"),
 ('script', 'https://www.clarks.com/en-us/fit-guide/mens', "Clarks US Men's Shoe Size Chart (US, UK, foot length IN), widths"),
 ('script', 'https://www.clarks.com/en-us/fit-guide/kids', '404'),
 ('script', 'https://www.birkenstock.com/on/demandware.store/Sites-EU-Site/{en_GB,de_DE}/Page-Show?cid=us-service-fittingguide', '404'),
 ('script', 'https://www.birkenstock.com/on/demandware.static/-/Library-Sites-birkenstock-amer/default/dwa81bfd9b/documents/Measurement_Template_US_A4.pdf', 'Birkenstock printable template: EU / US Children / Ladies / Men / UK / MM table (read from the text layer)'),
 ('search', 'web search on birkenstock.com: GB size guide', 'URLs of the GB, en_NL, MY pages'),
 ('script', 'https://www.birkenstock.com/gb/fit-guide-size-chart.html', 'Birkenstock GB: Adults and Kids, UK sizes, foot length From/To mm, foot width'),
 ('script', 'https://www.birkenstock.com/on/demandware.store/Sites-EU-Site/en_NL/FitGuide-SizeChart', 'Birkenstock EU: Adults and Kids, EU sizes, the same ranges'),
 ('script', 'https://www.birkenstock.com/my/passform/knowledge-fit.html', 'Birkenstock Malaysia: fit calculator, "next size up" advice; no table in HTML'),
 ('fetcher', 'https://www.drmartens.com/us/en/about/size-guide', "Dr. Martens US: Women's and Men's chart with Foot length, Foot width, UK, EU, US Men's, US Women's; Socks; fit sentences; kids tab not captured"),
 ('fetcher', 'https://www.drmartens.com/uk/en_gb/shoe-size-guide', "Dr. Martens UK: the chart as flattened text, five headers (no US Men's); fit sentences"),
 ('fetcher', 'https://www.drmartens.com/dk/en_eu/shoe-size-guide', 'Dr. Martens DK/EU: UK, EUR, US WOMEN, US MEN, JAPAN, whole sizes, no length'),
 ('fetcher', 'https://www.brooksrunning.com/en_us/unisex-footwear-size-chart.html', '403'),
 ('script', 'https://www.brooksrunning.com/{en_gb,en_fr}/unisex-footwear-size-chart.html, /en_us/{womens,mens}-footwear-size-chart.html', '403 Access Denied'),
 ('fetcher', 'https://www.brooksrunning.com/en_fr/unisex-footwear-size-chart.html', '403'),
 ('search', 'web search on ugg.com, hoka.com, timberland.com', 'URLs; summaries are leads'),
 ('script', 'https://www.ugg.com/sizing-information.html, /uk/sizing-information/sizing-information.html', '406 BLOCKED_EDGE'),
 ('script', 'https://www.hoka.com/en/gb/sizing-information.html, /en/us/size-fit-men-shoes.html', '406'),
 ('script', 'https://www.timberland.com/en-us/customer-care/size-chart; https://www.timberland.co.uk/customer-care/size-chart.html', '403'),
 ('script', 'https://help.timberland.com/hc/en-us/articles/115001361933 and 115001358294', 'TLS handshake failure'),
 ('fetcher', 'https://www.ugg.com/sizing-information.html; /uk/sizing-information/sizing-information.html; /eu/en/se/sizing-information.html', 'Parse Error: Header overflow'),
 ('fetcher', 'https://www.hoka.com/en/us/size-fit-men-shoes.html', 'Parse Error: Header overflow'),
 ('fetcher', 'https://help.timberland.com/hc/en-us/articles/115001361933-Adult-Footwear-Size-Chart', 'TLS handshake failure'),
 ('fetcher', 'https://www.timberland.com/en-us/customer-care/size-chart; timberland.co.uk; /en-dk/', '403'),
 ('script', 'https://help.timberland.com/api/v2/help_center/en-us/articles/115001361933.json (python urllib)', 'TLS handshake failure'),
 ('search', 'web search on on.com and salomon.com', 'URLs'),
 ('script', 'https://customer-service.on-running.com/{en-nz,en-us}/size_guide; https://www.on.com/en-us/faq/product-advice-sizing-stock', '4 KB client-rendered shells, no chart'),
 ('script', 'https://www.salomon.com/en-us/sizingchart', "Salomon US: Unisex, Men's, Women's, Kid's Footwear charts (foot length cm and in, UK, EUR, US, JP) in the page's Next.js data; ski boot charts skipped"),
 ('script', 'https://www.salomon.com/en-no/sizingchart', "Salomon NO: Men's Footwear, identical to US"),
 ('script', 'https://sg.salomon.com/pages/{men,women,unisex}-size-guide', 'Salomon Singapore: the same charts as HTML tables, men\'s extended to the unisex range'),
 ('script', 'https://my.salomon.com/pages/kids-size-guide', 'no table in HTML'),
 ('fetcher', 'https://customer-service.on-running.com/en-us/size_guide', '301 to on.com/faq/product-advice-sizing-stock'),
 ('fetcher', 'https://www.on.com/en-us/faq/product-advice-sizing-stock', 'empty content'),
 ('search', 'web search: Brooks Japan size chart', 'found support.brooksrunning.com.au'),
 ('script', 'https://support.brooksrunning.com.au/hc/en-us/articles/360046951054-How-do-I-know-my-shoe-size', 'Brooks Australia: US sizes, 2D measure approximates, lasts differ, widths'),
 ('script', 'https://support.brooksrunning.com.au/hc/en-us/articles/360047594793-Size-Conversion-Chart', 'Brooks Australia: Size Conversion Chart, US M/W, UK M/W, Europe Unisex, Japan M/W (cm); no length'),
 ('search', 'web search: Timberland Japan, HOKA Japan', 'no brand page found'),
 ('fetcher', 'https://www.hoka.com/en/gb/sizing-information.html', 'Parse Error: Header overflow'),
 ('script', 'https://www.crocs.co.uk/size-chart/{gb,emea}.json; https://www.crocs.de/size-chart/{gb,emea}.json', 'byte-identical to crocs.com\'s'),
 ('script', 'https://www.crocs.co.uk/size-chart', 'page HTML; no measuring text found by the reader'),
]
with open(os.path.join(ROOT, 'sources.md'), 'w', encoding='utf-8') as f:
    f.write('# brands-b: sources, in the order opened (2026-10-20)\n\n')
    f.write('Tools: "script" = curl from scripts/fetch.sh (generic browser user agent, nothing personal), saved to downloads/; "fetcher" = the harness WebFetch (page turned to text, read by its model); "search" = the harness WebSearch, whose summaries are leads only.\n\n')
    f.write('Retailer and third-party copies seen in search results, as leads only, flagged copies, never the record: Scheels (UGG, HOKA, Timberland, Salomon), RunRepeat (HOKA, Timberland, Brooks, Salomon), outsole.nl (HOKA, On), looksize.com (all), evo.com (Salomon, Timberland), Marathon Sports (HOKA), absolute-snow.co.uk (Timberland), The Golden Boot (Clarks, Dr. Martens). None opened.\n\n')
    f.write('| # | tool | page | what it gave |\n|---|---|---|---|\n')
    for i, (t, u, g) in enumerate(S, 1):
        f.write(f'| {i} | {t} | {u} | {g} |\n')
    f.write('\n## Script fetch log (scripts/fetchlog.tsv)\n\n| time (UTC) | name | url | status | bytes |\n|---|---|---|---|---|\n')
    for r in csv.reader(open(os.path.join(HERE, 'fetchlog.tsv'), encoding='utf-8'), delimiter='\t'):
        r = (r + ['', '', '', '', ''])[:5]
        f.write('| ' + ' | '.join(x.replace('|', '/') for x in r) + ' |\n')
print('ok', len(S))
