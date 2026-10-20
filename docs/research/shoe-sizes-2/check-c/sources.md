# Checker C, sources opened, in order (2026-10-20)

Paths under docs/research/shoe-sizes-2/manual/sources/ unless given in full. Nothing fetched from the web; no file of the repository edited; the ruled-out files (manual/README.md, brand-charts-check.html, checks.py, brands-a/, brands-b/, docs/research/shoe-sizes-2.md) not opened.

1. docs/RESEARCH.md §4 (lines 39-62): the process and the safety rules.
2. docs/research/shoe-sizes-2/wave2-check.csv, filtered to checker C by scripts/rows.py, scripts/compact.py, scripts/claimbytes.py: 114 rows (112 cells, 2 claims) over adidas, New Balance, Vans, UGG, HOKA, Timberland, On. Claim C78's "M7\xbd" is a ½ (checked with ascii()).
3. The sources folder listed; screenshot sizes read from their PNG headers (scripts/pngdims.py) to tell full pages from table crops.
4. adidas/pasted-text.txt: the kids cm tables (0-3, 4-7, 8-16) and the adult table twice (men's page, women's page, identical). Gave C01-C11.
5. new-balance/size-guide-page-text.txt and width-guide-page-text.txt: the men's/unisex, women's, babies, little kid and big kid size tables, and the width tables. Gave C12-C26.
6. vans/pasted-text.txt: unisex adult, kids, toddlers, infants, youth, each in inches and cm. Gave C27-C39.
7. ugg/pasted-text.txt: women's, women's wide, men's, men's wide, all-gender, big kids, toddlers, baby, and the paste's own transcription of the kids PDF (labelled as transcribed, not pasted: not used as a source; screenshot-10 read instead). Gave C40-C55, C60-C62.
8. hoka/pasted-text.txt: women, men and all-gender, regular and wide, in and cm; kids in and cm. Inch cells wrap over two lines. Gave C63-C80 but the alignment in C78.
9. timberland/pasted-text.txt: men's, women's, infant, toddler, youth, junior, PRO men's, PRO women's, each inch then cm. Gave C81-C97.
10. on/pasted-text.txt: kids cm and inches, men's, women's, the kids panel text. Gave C98-C114.
11. adidas/screenshot-01.png: reading mode, "adidas Size Chart for Mens Shoes", the adult table with the inch header and the cm row. Confirmed C01-C08.
12. hoka/screenshot-01.png: hoka.com Sizing Information, Women, Footwear, Regular, in (full page). Confirmed C63, C65-C67, C76.
13. on/screenshot-01.png: Size & Fit, kids panel, Inches toggle, with "How to measure your kid's feet". Confirmed C110-C113; C114.
14. new-balance/Size_Guide_-_New_Balance.pdf: the Read tool could not render it (pdftoppm not installed). Its text extracted by scripts/pdftext.py (pure Python: zlib streams, ToUnicode maps, glyphs merged into cells by x gap) into check-c/nb-size-pdf.txt: 4 pages, the same tables as the page text. Confirmed C12-C23. A first attempt to write the script through a shell heredoc failed on the shell's quoting; the script was then written as a file.
15. new-balance/Size_Guide_width_-_New_Balance.pdf: the same, into check-c/nb-width-pdf.txt: 4 pages. Confirmed C24-C26.
16. ugg/screenshot-10.png: UGG KID'S SHOE FIT GUIDE (PDF in a viewer), the table by INFANTS, TODDLERS, LITTLE KIDS, BIG KIDS. Confirmed C56-C59.
17. on/screenshot-06.png: Size & Fit, "True to size.", Size Guide - Womens Shoes (scrolled right), then SHIPPING & RETURNS. Confirmed C104-C108; C114.
18. hoka/screenshot-09.png: All Gender, Footwear, Regular, cm, scrolled left. C78.
19. hoka/screenshot-15.png: Men, Footwear, Regular, in, scrolled left. Confirmed C69, C71-C73, C75.
20. hoka/screenshot-10.png: All Gender, Footwear, Regular, cm, scrolled right to M15/W16. C78.
21. on/screenshot-03.png: Size & Fit, "True to size.", Size Guide - Mens Shoes, scrolled left. Confirmed C98-C103; C114.
22. timberland/screenshot-17.png: Women's PRO Footwear, Inch toggle. Confirmed C88, C90, C91.
23. vans/screenshot-05.png: Toddlers' Shoes, Inch toggle. Confirmed C33, C35, C36.
24. vans/screenshot-06.png: Toddlers' Shoes, Cm toggle. Confirmed C34.
25. timberland/screenshot-18.png: Women's PRO Footwear, Cm toggle. Confirmed C89.
26. hoka/screenshot-05.png: Women, Footwear, Wide, in. Confirmed C77 (and C63's length repeated).
27. hoka/screenshot-07.png: All Gender, Footwear, Regular, in, scrolled left. C78.
28. on/screenshot-04.png: Size & Fit, "True to size.", Size Guide - Mens Shoes, scrolled right, a divider under the table. Confirmed C98-C103; C114.
29. hoka/pasted-text.txt again, by scripts/hoka_inch.py: every inch value (whole line plus fraction line) converted at 25.4 mm against its cm or mm row; the all-gender rows against the men's. For C63-C75, C78.
30. timberland/pasted-text.txt again, by scripts/timb_pro.py: the PRO women's inch copy converted against its cm copy. For C88-C89.

Not opened, because the pasted text covered the row and agreed and no check asked for a picture: adidas screenshots 02-06; New Balance screenshots 01-05 (the printable tools); Vans 01-04, 07-12; UGG 01-09; HOKA 02-04, 06, 08, 11-14, 16-22; Timberland 01-16; On 02, 05.
