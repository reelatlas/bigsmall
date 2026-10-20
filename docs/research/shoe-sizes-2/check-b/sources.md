# Checker B: sources opened, in order

Wave 2 of the brands' charts research (shoe sizes 2), checker B, 2026-10-20.

1. **Clarks GB fit guide**: https://www.clarks.com/en-gb/fitguide
   - tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/clarks_gb_fitguide.html
   - gave: 200, server-rendered HTML tables: women, men, kids and babies (sizes and widths); B01-B07
2. **Clarks IE fit guide**: https://www.clarks.com/en-ie/fitguide
   - tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/clarks_ie_fitguide.html
   - gave: 200, same tables as GB; the foot-gauge sentence; B08
3. **Clarks US men's fit guide**: https://www.clarks.com/en-us/fit-guide/mens
   - tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/clarks_us_mens.html
   - gave: 200, HTML table US/UK/inches; B09-B14
4. **Clarks US women's fit guide**: https://www.clarks.com/en-us/fit-guide/womens
   - tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/clarks_us_womens.html
   - gave: 200, HTML table; the swelling advice; B15
5. **Clarks AU size guide**: https://clarks.com.au/pages/size-guide
   - tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/clarks_au_sizeguide.html
   - gave: 200, five HTML tables; B16-B18
6. **Dr. Martens US size guide (script attempt)**: https://www.drmartens.com/us/en/about/size-guide
   - tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/drm_us_sizeguide_script.html
   - gave: 403 from Cloudflare to the script, as for the worker; re-read through the fetcher
7. **Dr. Martens DK/EU size guide (script attempt)**: https://www.drmartens.com/dk/en_eu/shoe-size-guide
   - tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/drm_dk_sizeguide_script.html
   - gave: 403 from Cloudflare to the script; re-read through the fetcher
8. **Birkenstock US fit guide**: https://www.birkenstock.com/us/fit-guide/
   - tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/birk_us_fitguide.html
   - gave: 200 after a redirect to /us/us-service-fittingguide.html; conversion table and the formula; B34-B36
9. **Birkenstock GB size chart**: https://www.birkenstock.com/gb/fit-guide-size-chart.html
   - tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/birk_gb_sizechart.html
   - gave: 200, Adults and Kids tables in mm; B37-B38
10. **Birkenstock US printable template A4 (PDF)**: https://www.birkenstock.com/on/demandware.static/-/Library-Sites-birkenstock-amer/default/dwa81bfd9b/documents/Measurement_Template_US_A4.pdf

- tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/birk_template_us_a4.pdf
- gave: 200, application/pdf, 693,592 bytes; B39-B42

11. **Crocs default.json**: https://www.crocs.com/size-chart/default.json

- tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/crocs_default.json
- gave: 200 JSON; B43-B47, B49-B50

12. **Crocs gb.json**: https://www.crocs.com/size-chart/gb.json

- tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/crocs_gb.json
- gave: 200 JSON; the comparison for B49

13. **Crocs size chart page**: https://www.crocs.com/size-chart

- tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/crocs_sizechart.html
- gave: 200, Next.js page, no server-rendered table; B48, B51

14. **Salomon US sizing chart**: https://www.salomon.com/en-us/sizingchart

- tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/salomon_us_sizingchart.html
- gave: 200 (Vercel), chart in Next.js flight data; B52-B57

15. **Salomon SG men's size guide**: https://sg.salomon.com/pages/men-size-guide

- tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/salomon_sg_men.html
- gave: 200, HTML table; B58-B60

16. **Brooks Australia size conversion chart**: https://support.brooksrunning.com.au/hc/en-us/articles/360047594793-Size-Conversion-Chart

- tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/brooks_au_conversion.html
- gave: 200, one HTML table with a blank row and a repeated header mid-table; B61-B67

17. **Brooks Australia: How do I know my shoe size?**: https://support.brooksrunning.com.au/hc/en-us/articles/360046951054-How-do-I-know-my-shoe-size

- tool: script (python urllib, 2026-10-20 15:29); file: check-b/downloads/brooks_au_howknow.html
- gave: 200, article text; B68

18. **Dr. Martens US size guide, first reading**: https://www.drmartens.com/us/en/about/size-guide

- tool: fetcher (WebFetch); file:
- gave: the size guide table (15 rows; blanks on the 25.5 and 28.5 rows, placed under US Women's), the socks table, the silhouettes sentence; B19-B29, B33

19. **Dr. Martens DK/EU size guide**: https://www.drmartens.com/dk/en_eu/shoe-size-guide

- tool: fetcher (WebFetch); file:
- gave: heading DR. MARTENS SIZING GUIDE, 13 rows of five, no blanks; B30-B32

20. **Crocs page scripts (42 chunks)**: https://www.crocs.com/_next/static/immutable/chunks/*.js

- tool: script (python urllib); file: check-b/downloads/crocs_js/
- gave: 42 of 42 fetched (200); 37cn2zrwdt121.js holds the region-file map, the fetch, the unit rules and the table renderer; no measuring steps in any; B48, B51

21. **Birkenstock template PDF, text layer**: as above

- tool: Xpdf pdftotext 4.06 (-layout, -raw, -table) on my own download; file: check-b/downloads/birk_template-raw.txt, birk_template-table.txt, birk_template_layout.txt
- gave: the size table rows with labels (raw) and by position (table); no renderer for a page image; B39-B42

22. **Dr. Martens US size guide, second reading**: https://www.drmartens.com/us/en/about/size-guide

- tool: fetcher (WebFetch); file:
- gave: its source is flattened text with no cell boundaries; it cannot tell which column is blank on the 25.5 and 28.5 rows; B21, B22, B25, B26

23. **Worker's saved copy of the Dr. Martens US page**: n/a

- tool: worker's saved copy (opened only after the fetcher could not tell the blank column); file: scratchpad\shoe-sizes-2\brands-b\downloads\drm_us_sizeguide.html
- gave: Cloudflare's 'Help us verify real visitors' page, 51,910 characters, no table: no help; the UK saved copy not opened

24. **Crocs size chart page**: https://www.crocs.com/size-chart

- tool: fetcher (WebFetch); file:
- gave: no measuring instructions; the chart shows 'Loading...' (client-rendered); B51

25. **Crocs i18n module (590327) in 3y8l25oymy2hd.js**: https://www.crocs.com/_next/static/immutable/chunks/3y8l25oymy2hd.js

- tool: script (already downloaded; read as text); file: check-b/downloads/crocs_js/3y8l25oymy2hd.js
- gave: the locale hook the region map is keyed on is the i18n library, so the key is the page locale; B48 note made precise
