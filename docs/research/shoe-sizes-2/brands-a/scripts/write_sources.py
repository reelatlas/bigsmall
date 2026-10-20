"""Write sources.md: every page opened, in order, from fetchlog.tsv (the script's requests) and the harness's fetcher and search calls listed below."""
import os, re, json, glob, collections
B = os.path.dirname(os.path.abspath(__file__)) + '/..'
gave = {
 'nike_us_mens': "Men's Footwear chart: US - Men, US - Women, US - Kids (Y), UK, CM / JP, EU, Foot Length (in), Foot Length (cm); 38 sizes; advice and how-to-measure text. Data read from the page's embedded __NEXT_DATA__ JSON, checked equal to the rendered table.",
 'nike_us_womens': "Women's Footwear chart, same columns, 39 sizes; foot length given to US W 17 only.",
 'nike_us_kids': 'Three charts: Big Kids (1Y - 7Y), Little Kids (8C - 3Y), Babies & Toddlers (1C - 10C), with foot length in in and cm; toddlers add Age (Months).',
 'nike_gb_mens': "GB men's chart: the same cells as the US one but no US Kids row; labels US—Men.",
 'nike_gb_womens': "GB women's chart: the same cells as the US one but no US Kids row.",
 'skechers_us': "Four charts (Women's, Men's, Kids', Infant & Toddler): USA, UK, EU; no length. Commented-out link to a kids' PDF.",
 'skechers_uk': "The same four charts; two cells of the men's EU column differ from the US site.",
 'skechers_au': 'Answered (200) but no chart table in the HTML; not used.',
 'asics_nz': "Men's/Unisex, Men's Work Boot, Women's, Actibreeze sandal (S-XL ranges), Kid's charts: US, UK, EU, CM, other gender's US.",
 'ua_us_men': "Men's chart: US Men, Inches, CM, Euro, UK; How to measure (foot, heel to toe).",
 'ua_us_women': "Women's chart: US Women, Inches, CM, Euro, UK.",
 'ua_us_boys': "Boys' chart: US Youth, US Women, Inches, CM, Euro, UK, 1K to 7.",
 'ua_uk_men': "Men's chart: CM, Euro, UK, US Men (no inches).", 'ua_uk_women': "Women's chart: CM, Euro, UK, US Women; differs from the US site.",
 'ua_au_men': "Men's chart as the US one; adds 'Measurements are desired standards'.", 'ua_au_women': "Women's chart as the UK one, with inches in thirds, sevenths, ninths.",
 'reebok_guides': "Men's Shoes and Women's Shoes Size Guides (US size, heel-toe in), Unisex Shoes tab (US M, US W, heel-toe in), How to Measure.",
 'reebok_unisex': 'Unisex Shoe Size Guide: US M, US W (1.5 apart), heel-toe in.', 'reebok_special': 'Special Unisex Shoe Size Guide: US M, US W (1 apart), heel-toe in.',
 'reebok_kids': 'Grade School, Preschool, Toddler & Baby: US size against heel-toe in.',
 'reebok_ca_mw': "reebok.ca Men's and Women's chart: heel-toe in, US - Men, US - Women; boots charts Euro against Canada/US.", 'reebok_ca_unisex': 'reebok.ca Unisex chart, same shape.',
 'puma_au': "PUMA SIZE GUIDE: Unisex shoes (AU, US Men, US Women, UK, FR), Men's and Women's shoes (US, UK, EU, Length cm), Kids shoes (Age Group, US, UK, EU).",
 'puma_nz': 'The same guide as AU, cell for cell.',
 'puma_eu_de_en': "Women's, Men's, Kids, Baby & toddler shoes: DE, UK, FR, IT, ES, US; no length.",
 'puma_eu_engb': 'The same four charts, all headed International Size Conversions; some cells differ from de/en.',
 'converse_ca_guide': 'converse.ca Size Guide: Women and Men tabs, Chuck Taylor All Star and Standard Sneakers (US, UK, EU, cm, in), Kids: Toddlers (1C-10.5C) and Kids (10C-6Y); How to Measure; fit notes.',
 'puma_us': 'Redirected to help.us.puma.com (403).', 'vans_au': "Answered (200) but the page renders by script; no chart in the HTML.",
}
out = ['# Sources opened by brands-a, 2026-10-20', '',
       "Every page opened, in order. 'script' = curl from scripts/fetch.sh (a generic browser User-Agent, nothing personal); 'fetcher' = the harness's WebFetch; 'search' = the harness's WebSearch (leads only, never a record). Status is the final HTTP status; 000 = no response (DNS or TLS). Downloads are in downloads/ under the name shown.", '']
n = 0
for line in open(f'{B}/fetchlog.tsv', encoding='utf-8'):
    d, name, url, res = line.rstrip('\n').split('\t')
    code = res.split()[0]; final = res.split()[-1]
    n += 1
    g = gave.get(name, {'403': 'Refused (403): could not reach.', '404': 'Not found (404).', '000': 'No response: could not reach.', '500': 'Server error (500).'}.get(code, ''))
    redir = f' (final URL {final})' if final != url and final.startswith('http') else ''
    out.append(f'{n}. script, {code}: {url}{redir} → downloads/{name}.html. {g}')
extra = [
 ('search', 'adidas.com shoe size chart', 'Leads: adidas.com/us/help/size_charts/men-shoes, /women-shoes, /shoes, adidas.com/kw/en and /qa/en; third-party copies (runrepeat.com, scheels.com, size.ly) not used.'),
 ('search', 'us.puma.com size chart', 'Third-party copies only; not used.'),
 ('search', 'underarmour.com footwear size chart', 'Third-party copies only (scheels.com, runrepeat.com); not used.'),
 ('search', 'reebok.com shoe size chart', 'Third-party copies only; not used.'),
 ('fetcher', 'https://www.adidas.com/us/help/size_charts/men-shoes', '403: could not reach.'),
 ('fetcher', 'https://www.newbalance.com/size-chart/', '403: could not reach.'),
 ('fetcher', 'https://www.asics.com/us/en-us/size-chart', '404 (the fetcher was let through but the path does not exist).'),
 ('fetcher', 'https://www.converse.com/size-chart', '403: could not reach.'),
 ('fetcher', 'https://www.vans.com/en-us/size-chart', '403: could not reach.'),
 ('search', 'asics.com size chart (asics.com only)', 'Leads: asics.com/sg, /my, /nz, /th, /vn, /za, /ph, /ae, me.asics.com.'),
 ('search', 'converse size chart (converse.com only)', 'Lead: converse.com/size-chart-guide.'),
 ('search', 'vans shoe size chart (vans domains only)', 'Leads: vans.com/en-us/help/size-charts, en-ca, en-se, en-cz, vans.co.uk, vans.eu.'),
 ('search', 'new balance shoe size chart (NB domains only)', "Leads: newbalance.com kids guide, women's sizing PDF, newbalance.co.uk/size-guide.html, ee.newbalance.eu, support.newbalance.com."),
 ('fetcher', 'https://www.vans.com/en-us/help/size-charts', '403: could not reach.'),
 ('fetcher', 'https://www.converse.com/size-chart-guide', '403: could not reach.'),
 ('fetcher', 'https://www.newbalance.co.uk/size-guide.html', '403: could not reach.'),
 ('search', 'asics US size chart', 'Leads only (me.asics.com; third-party copies runrepeat, scheels, kohls, bergfreunde, looksize not used).'),
 ('search', 'puma size guide (puma domains)', 'Leads: au.puma.com, nz.puma.com, us.puma.com/us/en/size-charts.html, id/ph/vn/mx/ae.puma.com.'),
 ('search', 'under armour size chart (UA domains)', 'Leads: underarmour.com/en-us/t/size-guide/{mens,womens,boys}-footwear/, .co.uk, .com.au.'),
 ('search', 'reebok size chart (reebok domains)', 'Leads: reebok.com/pages/size-guides, unisex, special-unisex, kids; reebok.ca pages.'),
 ('search', 'PUMA size guide (puma EU/UK/US)', 'Leads: eu.puma.com/{de,lt,ch,...}/en/help/size-guide, eu.puma.com/en_GB/size-charts.html.'),
 ('fetcher', 'https://help.us.puma.com/hc/en-us/articles/38820194903963-Contact-US', '403: could not reach.'),
 ('fetcher', 'https://www.adidas.co.uk/help/size_charts', '403: could not reach.'),
 ('fetcher', 'https://support.newbalance.com/hc/en-us/articles/211241357-How-do-New-Balance-shoes-fit-', 'TLS error: could not reach.'),
 ('fetcher', 'https://www.vans.eu/en_dk/help/size-charts/vans_size_infant_shoes.html', '403: could not reach.'),
 ('search', 'ASICS size chart (asics.com only)', 'Leads only.'),
 ('fetcher', 'https://www.asics.com/sg/en-sg/customer-service/size-fit-guide/size-fit-guide.html', "200 to the fetcher (the script was refused): Men's/Unisex, Women's, Kids' charts, US, EU, CM, UK, transcribed by the fetcher's model from column-by-column text; recorded, flagged for a checker."),
 ('fetcher', 'https://www.asics.com/us/en-us/size-charts', '404.'),
 ('search', 'adidas size chart (adidas domains)', 'Leads: adidas.co.uk men-shoes, adidas.com/us kids-shoes, dtbsupport.whs.adidas.com static size chart; the search summary\'s cells are a lead, not a record.'),
 ('fetcher', 'https://dtbsupport.whs.adidas.com/static-content/size-charts/en_GB/footwear/size-shoes.html', 'DNS: host no longer resolves; could not reach.'),
 ('script', 'https://digital-assets.skechers.com/skechers/new-site/kids-size-chart.pdf', "200, application/pdf → downloads/skechers_kids_size_chart.pdf: SHOE FIT GUIDE, a printable foot gauge with Infant, Toddler (1-3 years old), Little Kids (4-8 years old), Big Kids (8-10 years old) charts (USA, UK, EU); read from its text layer (pdftotext)."),
 ('script', 'https://www.newbalance.com/on/demandware.static/-/Library-Sites-NBUS-NBCA/default/dwc8bbcac1/pdf/Womens_Printable_Sizing_Tool.pdf', '403: could not reach.'),
]
out += ['', '## The harness\'s fetcher and search, and two direct downloads, in the order made (interleaved with the script requests above)', '']
for i, (tool, url, g) in enumerate(extra, 1):
    out.append(f'{i}. {tool}: {url} → {g}')
cells = collections.Counter()
for f in glob.glob(f'{B}/cells/*.json'):
    for r in json.load(open(f, encoding='utf-8')): cells[(r['brand'], r['site'])] += 1
out += ['', '## Cells recorded, by brand and site', ''] + [f'- {b}, {s}: {n}' for (b, s), n in sorted(cells.items())]
open(f'{B}/sources.md', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(len(out))
