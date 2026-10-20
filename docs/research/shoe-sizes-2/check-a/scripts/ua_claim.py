import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from common import *
record([dict(id='A105', result='confirmed', found_value='',
  exact_words="HOW TO MEASURE: \"FOOT: We start with the true foot, which means we measure from heel to toe. That measurement (in centimeters) is then translated into our standard sizes. To find your foot measurement closely trace your entire foot onto a piece of paper and measure from heel to toe. If your measurement is between chart numbers, we recommend sizing up.\"",
  url_or_file='https://www.underarmour.com/en-us/t/size-guide/mens-footwear/ ; downloads/ua_us_mens.html', tool='script (curl, then python -I)',
  note="The worker's words are on the page as quoted. The page does not name the CM column in them; that the chart's numbers are foot measurements rests on 'If your measurement is between chart numbers, we recommend sizing up'. Caveat: the chart's Inches column does not match its CM column: converted, the inches fall 3.9 mm (US 7) to 18.8 mm (US 15) short of the CM, then 1.6 mm (15.5); so the two length columns cannot both be the same foot.")])
source('''## Under Armour (fetched 2026-10-20T22:28Z, curl then python -I)
19. https://www.underarmour.com/en-us/t/size-guide/mens-footwear/ -> 200, downloads/ua_us_mens.html. One table, US Men | Inches | CM | Euro | UK, US 7-16; the HOW TO MEASURE text. Rows A90-A100, A105.
20. https://www.underarmour.com/en-us/t/size-guide/womens-footwear/ -> 200, downloads/ua_us_womens.html. US Women | Inches | CM | Euro | UK, US 5-12. Rows A101-A102.
21. https://www.underarmour.co.uk/en-gb/t/size-guide/womens-footwear/ -> 200, downloads/ua_uk_womens.html. CM | Euro | UK | US Women, US 5-12, no inches; CM 0.5 above the US site's at US 5-6 and 7.5-12, equal at 6.5-7; UK 0.5 below at US 5-8, equal from 8.5; Euro equal throughout. Rows A103-A104.''')
