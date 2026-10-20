import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
record([dict(id='A76', result='confirmed', found_value='',
  exact_words='How to Measure, Step 1: "Place a piece of paper on a hard floor with one end to the wall. Stand on the piece of paper with the heel slightly touching the wall." Step 2: "Mark the end of your longest toe with a pencil for both feet. Tip: it\'s easier if you let someone help you with this." Step 3: "Measure your markings in inches. Take the larger of the two foot length values and compare it with our sizing chart." Chart columns: "Heel-Toe Measurement (in)".',
  url_or_file='https://www.reebok.com/pages/size-guides ; downloads/reebok_com_guides.html', tool='script (curl, then python -I html.parser)',
  note="The worker's quote ends mid-word (\"Take the l\"); the page's Step 3 continues \"larger of the two foot length values and compare it with our sizing chart.\" The page calls the length a foot length in Step 3, measured heel (at the wall) to the end of the longest toe, in inches; the men's, women's, and unisex charts on it all head the column Heel-Toe Measurement (in).")])
source('''## Reebok (fetched 2026-10-20T22:28Z, curl then python -I)
12. https://reebok.ca/pages/mens-and-womens-footwear-size-chart -> 200, downloads/reebok_ca_mw.html. One transposed chart (Heel-toe measurement, US - Men, US - Women; sizes across), winter boots tables, How to measure. Rows A68-A69.
13. https://reebok.ca/pages/unisex-footwear-size-chart -> 200, downloads/reebok_ca_unisex.html. The same transposed chart, identical but for US - Men at position 4 (4.5 against 3.5). Rows A70-A71.
14. https://www.reebok.com/pages/unisex-shoe-size-guide -> 200, downloads/reebok_com_unisex.html. U.S. Men Size | U.S. Women Size | Heel-Toe Measurement (in), men 2-18.5, women = men + 1.5. Rows A72-A73.
15. https://www.reebok.com/pages/special-unisex-shoe-size-guide -> 200, downloads/reebok_com_special.html. Table headed Unisex Shoes Size Guide, same columns, women = men + 1, inches equal to the other guide's. Rows A74-A75.
16. https://www.reebok.com/pages/size-guides -> 200, downloads/reebok_com_guides.html. Men's, women's, unisex shoe charts and the three-step How to Measure. Row A76.''')
