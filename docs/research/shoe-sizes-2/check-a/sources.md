## Nike (fetched 2026-10-20T22:28Z, curl then python -I)

1. https://www.nike.com/size-fit/mens-footwear -> 200, downloads/nike_us_mens.html. Men's Footwear Size Chart in **NEXT_DATA** (appData.cards[8d48ee84...].sizeCharts[0].data: US - Men, US - Women, US - Kids, UK, CM / JP, EU, Foot Length (in), Foot Length (cm); 38 sizes, 3.5-22) and one server-rendered table (the same rows except Foot Length (cm), the Imperial view). The CM-label note and How To Measure text in the page text. Rows A01-A11, A20, A21.
2. https://www.nike.com/size-fit/kids-footwear -> 200, downloads/nike_us_kids.html. Three charts in JSON and rendered (Big Kids (1Y - 7Y), Little Kids (8C - 3Y), Babies & Toddlers (1C - 10C)); Big Kids' rendered rows equal the JSON's; Foot Length (cm) JSON only. Rows A12-A17.
3. https://www.nike.com/gb/size-fit/mens-footwear -> 200, downloads/nike_gb_mens.html. Same chart structure, every row identical to the US chart's, no US - Kids row. Rows A18-A19.

## Asics New Zealand (fetched 2026-10-20T22:28Z, curl then python -I)

4. https://www.asics.com/nz/en-nz/size-guide -> 200, downloads/asics_nz.html. 14 server-rendered tables; table 0 Men's/Unisex Shoe Sizes (US | UK | EU | CM | US Women, 22 data rows, US 4, 5, 5.5 ... 14, 15, 16: no 4.5, no 14.5), table 1 Men's Work Boot Sizes, table 2 Women's Shoe Sizes (US | UK | EU | CM | US Men, 17 rows, US 5-13; US 5 = 22 cm, 5.5 = 22.5), table 4 Kid's Shoe Sizes; the rest clothing. Rows A22-A31, and the NZ half of A41.
5. https://www.asics.com/sg/en-sg/customer-service/size-fit-guide/size-fit-guide.html by script -> 403 Access Denied (Akamai edgesuite, Reference #18.510ed217.1792535330.2826269e), downloads/asics_sg.html kept; next read through the fetcher.

## Asics Singapore (2026-10-20, fetcher)

6. Same SG URL through the fetcher (WebFetch), read 1: a transcription by rows of Men's/Unisex Sizes (23 rows, US 4-15 with H half sizes) and Women's Sizes (19 rows, US 4-13); the fetcher said it matched rows by position across flattened column lists. Summary kept in downloads/asics_sg_fetcher_rows.txt.
7. Same URL, fetcher read 2: the men's chart quoted in page order, four column lists (US, EU, CM, UK) of 23 entries each, kept in downloads/asics_sg_fetcher_raw_lists.txt; rows A32-A40 checked from it by position, A41 with the NZ page. The worker's saved copy was not opened (the fetcher did not fail).

## Converse Canada (fetched 2026-10-20T22:28Z, curl then python -I)

8. https://converse.ca/pages/size-guide -> 200, downloads/converse_ca.html. 14 server-rendered tables in four panels (Women, Men, Gender-Free, Kids); men's Chuck Taylor All Star (index 5) and Standard Sneakers (index 6) charts, US Men's | US Women's | UK | EU | cm | in; the fit sentences in the page text. Rows A42-A50.

## Puma (fetched 2026-10-20T22:28Z, curl then python -I)

9. https://au.puma.com/au/en/help/size-guide -> 200, downloads/puma_au.html. 18 server-rendered tables: Unisex shoes (AU | US Men | US Women | UK | FR), Men's shoes (US | UK | EU | Length cm, US 4-18), Women's shoes (US | UK | EU | Length cm, US 4-11), Kids shoes (Age Group | US | UK | EU), clothing and socks. Rows A51-A60, AU half of A67.
10. https://eu.puma.com/de/en/help/size-guide -> 200, downloads/puma_eu_de_en.html. 15 tables, all DE | UK | FR | IT | ES | US; first, Women's shoes, 11 rows (US 5.5-11, no 6.5). Rows A61-A63, A67.
11. https://eu.puma.com/en_GB/size-charts.html -> 200, downloads/puma_eu_en_gb.html. 17 tables; first, Women's shoes, 12 rows (US 5.5-11 with 6.5); differs from de/en at US 6.5-9.5. Rows A64-A66.

## Reebok (fetched 2026-10-20T22:28Z, curl then python -I)

12. https://reebok.ca/pages/mens-and-womens-footwear-size-chart -> 200, downloads/reebok_ca_mw.html. One transposed chart (Heel-toe measurement, US - Men, US - Women; sizes across), winter boots tables, How to measure. Rows A68-A69.
13. https://reebok.ca/pages/unisex-footwear-size-chart -> 200, downloads/reebok_ca_unisex.html. The same transposed chart, identical but for US - Men at position 4 (4.5 against 3.5). Rows A70-A71.
14. https://www.reebok.com/pages/unisex-shoe-size-guide -> 200, downloads/reebok_com_unisex.html. U.S. Men Size | U.S. Women Size | Heel-Toe Measurement (in), men 2-18.5, women = men + 1.5. Rows A72-A73.
15. https://www.reebok.com/pages/special-unisex-shoe-size-guide -> 200, downloads/reebok_com_special.html. Table headed Unisex Shoes Size Guide, same columns, women = men + 1, inches equal to the other guide's. Rows A74-A75.
16. https://www.reebok.com/pages/size-guides -> 200, downloads/reebok_com_guides.html. Men's, women's, unisex shoe charts and the three-step How to Measure. Row A76.

## Skechers (fetched 2026-10-20T22:28Z, curl then python -I)

17. https://www.skechers.com/size-chart/ -> 200, downloads/skechers_us.html. Four tab tables (USA | UK | EU) in panels toggle-womens-, toggle-mens-, toggle-kids-, toggle-toddlers-sizechart. Rows A77-A82, A89.
18. https://www.skechers.co.uk/size-chart/ -> 200, downloads/skechers_uk.html. The same four tables; identical to the US page's but for men's US 9 (EU 42 against 42.5) and US 10 (43 against 42.5). Rows A83-A88.

## Under Armour (fetched 2026-10-20T22:28Z, curl then python -I)

19. https://www.underarmour.com/en-us/t/size-guide/mens-footwear/ -> 200, downloads/ua_us_mens.html. One table, US Men | Inches | CM | Euro | UK, US 7-16; the HOW TO MEASURE text. Rows A90-A100, A105.
20. https://www.underarmour.com/en-us/t/size-guide/womens-footwear/ -> 200, downloads/ua_us_womens.html. US Women | Inches | CM | Euro | UK, US 5-12. Rows A101-A102.
21. https://www.underarmour.co.uk/en-gb/t/size-guide/womens-footwear/ -> 200, downloads/ua_uk_womens.html. CM | Euro | UK | US Women, US 5-12, no inches; Against the US site, CM 0.5 lower at US 5-6, equal at 6.5-7, 0.5 higher at 7.5-12 (the UK site climbs 0.5 per half size, 22 to 29; the US site repeats 23.5 and 24); UK 0.5 lower at US 5-8, equal from 8.5; Euro equal throughout. Rows A103-A104.

## Extra page for A21 (fetched 2026-10-20T22:37Z, curl then python -I)

22. https://www.nike.com/size-fit/womens-footwear -> 200, downloads/nike_us_womens.html. The same CM-label note and the same between-sizes advice as the men's page. Row A21 (women).
