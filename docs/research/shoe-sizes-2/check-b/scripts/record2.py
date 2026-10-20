import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common

S = 'script (python urllib: fetch.py; parsed with html.parser: parse_html.py, explore2.py)'
F = 'fetcher (WebFetch: its model transcription of the page, not a parse)'
AU = 'https://clarks.com.au/pages/size-guide | check-b/downloads/clarks_au_sizeguide.html'
DRU = 'https://www.drmartens.com/us/en/about/size-guide (fetcher; the script got a 403 bot check: check-b/downloads/drm_us_sizeguide_script.html)'
DRK = 'https://www.drmartens.com/dk/en_eu/shoe-size-guide (fetcher; the script got a 403 bot check: check-b/downloads/drm_dk_sizeguide_script.html)'
PDF = 'https://www.birkenstock.com/on/demandware.static/-/Library-Sites-birkenstock-amer/default/dwa81bfd9b/documents/Measurement_Template_US_A4.pdf | check-b/downloads/birk_template_us_a4.pdf (text: birk_template-raw.txt, birk_template-table.txt, birk_template_layout.txt)'
CJ = 'https://www.crocs.com/size-chart/default.json | check-b/downloads/crocs_default.json (and crocs_gb.json)'
CP = 'https://www.crocs.com/size-chart | check-b/downloads/crocs_sizechart.html and check-b/downloads/crocs_js/37cn2zrwdt121.js'
SAL = 'https://www.salomon.com/en-us/sizingchart | check-b/downloads/salomon_us_sizingchart.html (Next.js flight data)'
ST = 'script (python urllib; the self.__next_f flight chunks decoded and parsed with json: explore3.py, explore5.py, explore6.py)'

au = ("Womens tab (div id='Womens', second of the tabs Mens, Womens, Kids), data row 5: UK 4 | EU 37 | US 6.5 | CM 22.9. "
      "Aside: the Mens table has no CM column; its fourth heading reads UK and repeats the UK sizes.")
row5 = ("Row 5 as the fetcher gives it: Foot length 25.5 | Foot width 9.2 | UK 6.5 | EU 40 | 8.5 | [blank]. The foot length and EU are unambiguous by position and by value. "
        "The fetcher says on a second reading that its source is flattened text with no cell boundaries, so the blank's column cannot be read (B21, B22).")
row9 = ("Row 9 as the fetcher gives it: Foot length 28.5 | Foot width 9.8 | UK 9.5 | EU 44 | 11.5 | [blank]. The foot length and EU are unambiguous; the blank's column cannot be read (B25, B26).")
blank = ("Could not reach the cell's column. The row holds one value ({v}) and one blank between US Men's and US Women's. The fetcher's first reading put {v} under US Men's and the blank under US Women's, as the worker did; "
         "asked again, it said its source is flattened text, 'The source does not show which position is empty'. A script gets Cloudflare's 403 bot check, and the worker's saved copy (opened only after the fetcher could not tell) "
         "is that bot-check page ('Help us verify real visitors'), with no chart. Not a reading but worth knowing: in every full row US Men's = UK + 1 and US Women's = UK + 2, by which {v} at UK {uk} fits US Women's and the blank would be US Men's.")
row6 = ("Row 6, a full row: Foot length 26 | Foot width 9.3 | UK 7 | EU 41 | US Men's 8 | US Women's 9. Headings: Foot length, Foot width, UK, EU, US Men's, US Women's; "
        "the fetcher reports that the Foot length (and Foot width) heading carries no unit.")
dk = ("Heading 'DR. MARTENS SIZING GUIDE'; columns UK, EUR, US WOMEN, US MEN, JAPAN (women before men, unlike the US page); row 5: UK 7 | EUR 41 | US WOMEN 9 | US MEN 8 | JAPAN 26. "
      "The fetcher's source was flattened, but with no blank cell its 65 values fall into 13 rows of five without ambiguity. Whole sizes only (UK 3 to 15); EUR skips 40 and 44.")
pdf = ("Read from the PDF's text layer with Xpdf pdftotext 4.06. -raw gives each row in stream order after its label: EU 24 ... 50 (27); US Children 6-6.5 ... 3-3.5 (11); US Ladies 4-4.5 ... 11-11.5 (8); "
       "US Men 7-7.5 ... 17-17.5 (11); UK 7,0 ... 14,5 (27); MM 150 ... 325 (27). -table places each value by its position on the page: US Children under EU 24-34, US Ladies under EU 35-42 (9-9.5 under 40), "
       "US Men under EU 40-50 (7-7.5 under 40). EU 40 is the 17th column: MM 260, UK 7,0. Both modes agree with the worker's reading of which US row is which. "
       "No page image was rendered: this machine has no PDF renderer (no pdftoppm, pdftopng, Ghostscript, ImageMagick, MuPDF, or Python PDF library).")
cr = ("default.json, adults, row 9: inches 10 3/8 | cm 28 | mm 280 | us_women 12 | us_men 10 | uk_women 10 | uk_men 9 | eu 43-44 | jp 28 | kr 290mm. "
      "At this row the cm and mm fields agree. They differ by a centimetre in rows 1-6 (cm 20-25 against mm 210-260) and by half a centimetre in row 7 (26 against 265), then agree from row 8. "
      "The Korea field runs a centimetre above cm in every row (290mm here). The page shows inches or cm, never this file's mm field (B48).")
kids = ("default.json, kids, row 6: us C6 | cm 13.2 | mm 132 | uk 6 | eu 21-22 | jp 14 | kr 130. gb.json, kids, row 6: us C6 | cm 13.2 | uk 6 | eu 22-23 | jp 14 | kr 155. "
        "gb.json's EU runs above default's from C6 on (one size at C6, two at C10, three at J1), and its Korea is higher from C4 to C13 (140 against 115 at C4) and the same from J1.")
sal = ("Entry 'Unisex Footwear' (subtitle 'Calculate your own measurements, then select your product size'; gender men and women; slug unisex-footwear) in the page's Next.js flight data. "
       "Header: FOOT LENGTH (CM) (inch view: FOOT LENGTH (INCH)) | UK | EUR | US | JP. Row 12: 27 (inch 10,6) | 9 | 43 1/3 | 9.5 M / 10.5 W | 27,5. "
       "JP is the foot length plus 0.5 in this row and in all 23. The server HTML holds no table; the chart renders from this data.")

rows = [
 dict(id='B16', result='confirmed', found_value='6.5', url_or_file=AU, tool=S, note=au),
 dict(id='B17', result='confirmed', found_value='22.9', url_or_file=AU, tool=S, note=au),
 dict(id='B18', result='confirmed', found_value='37', url_or_file=AU, tool=S, note=au),
 dict(id='B19', result='confirmed', found_value='25.5', url_or_file=DRU, tool=F, note=row5),
 dict(id='B20', result='confirmed', found_value='40', url_or_file=DRU, tool=F, note=row5),
 dict(id='B21', result='could not reach', found_value='8.5 (column not established)', url_or_file=DRU, tool=F + "; worker's saved copy opened: a bot-check page", note=blank.format(v='8.5', uk='6.5')),
 dict(id='B22', result='could not reach', found_value='a blank in one of the two US columns (column not established)', url_or_file=DRU, tool=F + "; worker's saved copy opened: a bot-check page", note=blank.format(v='8.5', uk='6.5')),
 dict(id='B23', result='confirmed', found_value='28.5', url_or_file=DRU, tool=F, note=row9),
 dict(id='B24', result='confirmed', found_value='44', url_or_file=DRU, tool=F, note=row9),
 dict(id='B25', result='could not reach', found_value='11.5 (column not established)', url_or_file=DRU, tool=F + "; worker's saved copy opened: a bot-check page", note=blank.format(v='11.5', uk='9.5')),
 dict(id='B26', result='could not reach', found_value='a blank in one of the two US columns (column not established)', url_or_file=DRU, tool=F + "; worker's saved copy opened: a bot-check page", note=blank.format(v='11.5', uk='9.5')),
 dict(id='B27', result='confirmed', found_value='26', url_or_file=DRU, tool=F, note=row6),
 dict(id='B28', result='confirmed', found_value='41', url_or_file=DRU, tool=F, note=row6),
 dict(id='B29', result='confirmed', found_value='8', url_or_file=DRU, tool=F, note=row6),
 dict(id='B30', result='confirmed', found_value='41', url_or_file=DRK, tool=F, note=dk),
 dict(id='B31', result='confirmed', found_value='8', url_or_file=DRK, tool=F, note=dk),
 dict(id='B32', result='confirmed', found_value='26', url_or_file=DRK, tool=F, note=dk),
 dict(id='B33', result='confirmed', found_value='', exact_words="The size of our boots, shoes and sandals can differ between silhouettes, but we'd say that most run true to size.", url_or_file=DRU, tool=F,
      note="As the fetcher quotes it, word for word the worker's; the page also says 'DM's can differ in size depending on the style.' The apostrophes are the fetcher's and may be curly on the page."),
 dict(id='B39', result='confirmed', found_value='260', url_or_file=PDF, tool='script (python urllib; Xpdf pdftotext 4.06 -raw, -table, -layout: explore3.py, explore6.py, explore7.py)', note=pdf),
 dict(id='B40', result='confirmed', found_value='9-9.5', url_or_file=PDF, tool='script (python urllib; Xpdf pdftotext 4.06 -raw, -table, -layout)', note=pdf),
 dict(id='B41', result='confirmed', found_value='7-7.5', url_or_file=PDF, tool='script (python urllib; Xpdf pdftotext 4.06 -raw, -table, -layout)', note=pdf),
 dict(id='B42', result='confirmed', found_value='7,0', url_or_file=PDF, tool='script (python urllib; Xpdf pdftotext 4.06 -raw, -table, -layout)', note=pdf + ' The PDF writes the UK size with a comma decimal (7,0).'),
 dict(id='B43', result='confirmed', found_value='28', url_or_file=CJ, tool='script (python urllib; parsed with json: explore3.py)', note=cr),
 dict(id='B44', result='confirmed', found_value='280', url_or_file=CJ, tool='script (python urllib; parsed with json)', note=cr),
 dict(id='B45', result='confirmed', found_value='43-44', url_or_file=CJ, tool='script (python urllib; parsed with json)', note=cr),
 dict(id='B46', result='confirmed', found_value='9', url_or_file=CJ, tool='script (python urllib; parsed with json)', note=cr),
 dict(id='B47', result='confirmed', found_value='12', url_or_file=CJ, tool='script (python urllib; parsed with json)', note=cr),
 dict(id='B48', result='confirmed', found_value='',
      exact_words='(page script 37cn2zrwdt121.js) v=((l=v||{}).KOREA="korea.json",l.JAPAN="japan.json",l.GB="gb.json",l.EMEA="emea.json",l.DEFAULT="default.json",l);let p={[x.k.KR]:"korea.json",[x.k.JP]:"japan.json",[x.k.GB]:"gb.json",...Object.fromEntries([...j.a].map(e=>[e,"emea.json"])),fallback:"default.json"} ... async function E(e){let t=await fetch(`/size-chart/${e}`) ... let y=[...j.h,x.k.AU],z={defaultUnit:"inches",showToggle:!0},C={[x.k.KR]:{defaultUnit:"mm",showToggle:!1},...Object.fromEntries(y.map(e=>[e,z])),fallback:{defaultUnit:"cm",showToggle:!1}} ... J=[S.INCHES,S.CM]',
      url_or_file=CP, tool='script (python urllib: the page and its 42 script chunks, read as text: explore3.py, explore4.py, explore5.py)',
      note=("Confirmed: the file is chosen by the storefront's locale, not by detecting the visitor: ko-KR korea.json, ja-JP japan.json, en-GB gb.json, the set de-DE, en-ES, fr-FR, fi-FI, nl-NL emea.json, "
            "every other (en-US, en-CA, fr-CA, en-AU, en-SG) default.json. Which length shows: the chart is transposed, the length heads each column as e[unit] plus the unit's suffix; "
            "en-US, en-CA, fr-CA and en-AU open in inches with a toggle to cm (the toggle offers only inches and cm), ko-KR shows mm with no toggle, every other locale cm with no toggle. "
            "So a default.json visitor sees inches or the cm field, never the mm field; mm shows only for ko-KR, from korea.json. The Korea row (kr) is a body row and shows its own values, 290mm at US M 10.")),
 dict(id='B49', result='confirmed', found_value='21-22', url_or_file=CJ, tool='script (python urllib; parsed with json)', note=kids),
 dict(id='B50', result='confirmed', found_value='130', url_or_file=CJ, tool='script (python urllib; parsed with json)', note=kids),
 dict(id='B51', result='corrected', found_value='',
      exact_words='Column label: "Heel to Toe Length" (adultLength, kidsLength, footLength). Meta description: "Find the perfect size for your Crocs shoes with our size chart. Measure your foot and find the right size for your Crocs shoes." Tip: "Tip: If you\'re in between sizes, <strong>round up</strong>. For wide feet order your normal size."',
      url_or_file=CP, tool='script (page HTML, its flight data and 42 script chunks searched) and fetcher (WebFetch)',
      note=("The worker's quoted step ('3. Measure the point from your heel to your longest toe. This is your Heel-to-Toe length.') is not on this page: no 'longest', no numbered steps, no tracing, no paper, "
            "in the HTML, the flight data with its English strings, or any of the 42 scripts, and the fetcher finds 'no numbered steps, heel-to-toe instructions, tracing or paper-based directions'. "
            "The modal's 'Learn how to measure' link points back to /size-chart itself. What stands: the length column is labelled 'Heel to Toe Length' and the description says to measure your foot; "
            "'measured by tracing the foot' has no support here.")),
 dict(id='B52', result='confirmed', found_value='27', url_or_file=SAL, tool=ST, note=sal),
 dict(id='B53', result='confirmed', found_value='43 1/3', url_or_file=SAL, tool=ST, note=sal),
 dict(id='B54', result='confirmed', found_value='9.5 M / 10.5 W', url_or_file=SAL, tool=ST, note=sal),
 dict(id='B55', result='confirmed', found_value='27,5', url_or_file=SAL, tool=ST, note=sal + ' The data writes it with a comma decimal (27,5).'),
 dict(id='B56', result='confirmed', found_value='',
      exact_words='Place a sheet of paper on the floor and against a wall | Make sure you are wearing the same socks that you would normally wear with this type of shoe | Wearing these socks, stand on the sheet of paper with your foot perpendicular to the wall and your heel against the wall. | Then use a pen to draw a line just in front of your big toe. Repeat for both feet and take the longer distance to determine your size. | Using a ruler, measure the distance between the wall and the line you drew to find your size.',
      url_or_file=SAL, tool=ST,
      note="The Unisex Footwear entry's own steps (a list; its first two items carry no full stop there). Socks, heel against the wall and the longer foot are all there."),
 dict(id='B57', result='corrected', found_value='',
      exact_words='To find out your foot width, do the same but using the outside of your foot against the wall. If the width is more than 107mm (4.21’’), your foot is wide. To have a better fit, you can: - order the wide version of the model if it available - or, you can add +0.5 to your order size.',
      url_or_file=SAL, tool=ST,
      note=("The words are on the page's data but only in two kids' charts, \"Kid's Snowboard Boots (Project BOA)\" and \"Kid's Snowboard Boots (Whipstar)\" (gender kids). "
            "The Unisex, Men's, Women's and Kid's Footwear entries say nothing of width. So the claim holds for those kids' snowboard boots, not for Salomon's footwear in general. The page writes the inch mark as two U+2019.")),
]
common.record(rows)
for what, url, f, tool, gave in [
 ('Dr. Martens US size guide, first reading', 'https://www.drmartens.com/us/en/about/size-guide', '', 'fetcher (WebFetch)', 'the size guide table (15 rows; blanks on the 25.5 and 28.5 rows, placed under US Women\'s), the socks table, the silhouettes sentence; B19-B29, B33'),
 ('Dr. Martens DK/EU size guide', 'https://www.drmartens.com/dk/en_eu/shoe-size-guide', '', 'fetcher (WebFetch)', 'heading DR. MARTENS SIZING GUIDE, 13 rows of five, no blanks; B30-B32'),
 ('Crocs page scripts (42 chunks)', 'https://www.crocs.com/_next/static/immutable/chunks/*.js', 'check-b/downloads/crocs_js/', 'script (python urllib)', '42 of 42 fetched (200); 37cn2zrwdt121.js holds the region-file map, the fetch, the unit rules and the table renderer; no measuring steps in any; B48, B51'),
 ('Birkenstock template PDF, text layer', 'as above', 'check-b/downloads/birk_template-raw.txt, birk_template-table.txt, birk_template_layout.txt', 'Xpdf pdftotext 4.06 (-layout, -raw, -table) on my own download', 'the size table rows with labels (raw) and by position (table); no renderer for a page image; B39-B42'),
 ('Dr. Martens US size guide, second reading', 'https://www.drmartens.com/us/en/about/size-guide', '', 'fetcher (WebFetch)', 'its source is flattened text with no cell boundaries; it cannot tell which column is blank on the 25.5 and 28.5 rows; B21, B22, B25, B26'),
 ("Worker's saved copy of the Dr. Martens US page", 'n/a', r'scratchpad\shoe-sizes-2\brands-b\downloads\drm_us_sizeguide.html', "worker's saved copy (opened only after the fetcher could not tell the blank column)", "Cloudflare's 'Help us verify real visitors' page, 51,910 characters, no table: no help; the UK saved copy not opened"),
 ('Crocs size chart page', 'https://www.crocs.com/size-chart', '', 'fetcher (WebFetch)', "no measuring instructions; the chart shows 'Loading...' (client-rendered); B51"),
]:
    common.log_source(dict(what=what, url=url, file=f, tool=tool, gave=gave))
print('recorded', len(rows))
