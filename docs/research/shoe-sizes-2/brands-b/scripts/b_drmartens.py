import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from csvlib import Brand
b = Brand('Dr. Martens')
WF = 'harness WebFetch (page converted to text by the fetcher, rows transcribed by its model; curl refused 403)'
US = 'https://www.drmartens.com/us/en/about/size-guide'
UK = 'https://www.drmartens.com/uk/en_gb/shoe-size-guide'
DK = 'https://www.drmartens.com/dk/en_eu/shoe-size-guide'

us = """22|8.4|3|36|4|5
23|8.7|4|37|5|6
24|8.9|5|38|6|7
25|9.1|6|39|7|8
25.5|9.2|6.5|40|8.5|
26|9.3|7|41|8|9
27|9.5|8|42|9|10
28|9.7|9|43|10|11
28.5|9.8|9.5|44|11.5|
29|9.9|10|45|11|12
30|10.1|11|46|12|13
31|10.3|12|47|13|14
32|10.6|13|48|14|15
33|10.8|14|49|15|16
34|11|15|50|16|17"""
b.table('drmartens.com/us', "Women's and Men's", ['Foot length', 'Foot width', 'UK', 'EU', "US Men's", "US Women's"],
        [r.split('|') for r in us.split('\n')], US, WF,
        "unit not printed in the header (values read as cm); the two half-size rows (25.5 and 28.5) carry one blank: the fetcher placed 8.5 and 11.5 under US Men's with US Women's blank, while the UK page's flattened text and the rest of the US Women's column (UK + 2) put them under US Women's: the blank's position is unconfirmed; the Foot width column is a width, noted only")
uk = """22|8.4|3|36|5
23|8.7|4|37|6
24|8.9|5|38|7
25|9.1|6|39|8
25.5|9.2|6.5|40|8.5
26|9.3|7|41|9
27|9.5|8|42|10
28|9.7|9|43|11
28.5|9.8|9.5|44|11.5
29|9.9|10|45|12
30|10.1|11|46|13
31|10.3|12|47|14
32|10.6|13|48|15
33|10.8|14|49|16
34|11|15|50|17"""
b.table('drmartens.com/uk', "Women's and Men's", ['Foot length', 'Foot width', 'UK', 'EU', "US Women's"],
        [r.split('|') for r in uk.split('\n')], UK, WF,
        "the fetcher reported the table as flattened text with these five headers and no US Men's column; whether the live page has a US Men's column hidden or absent is unconfirmed")
dk = """3|36|5|4|22
4|37|6|5|23
5|38|7|6|24
6|39|8|7|25
7|41|9|8|26
8|42|10|9|27
9|43|11|10|28
10|45|12|11|29
11|46|13|12|30
12|47|14|13|31
13|48|15|14|32
14|49|16|15|33
15|50|17|16|34"""
b.table('drmartens.com/dk/en_eu', 'DR. MARTENS SIZING GUIDE (no table heading)', ['UK', 'EUR', 'US WOMEN', 'US MEN', 'JAPAN'],
        [r.split('|') for r in dk.split('\n')], DK, WF,
        'the fetcher grouped 65 flattened values into rows of five under the five headers; no foot length column; whole sizes only')
socks = [['UK', '3-7.5', '8-13'], ['EUROPE', '36-41', '41.5-48'], ['US WOMEN', '5-10', '11-16'], ['US MEN', '4-9', '10-15']]
b.table('drmartens.com/us', 'Socks', ['Size', 'S/M', 'M/L'], socks, US, WF, 'sock sizes, same on the UK page')

b.claim('Dr. Martens: most styles run true to size, sizes differ by silhouette', 'asserted by the page', US, "The size of our boots, shoes and sandals can differ between silhouettes, but we'd say that most run true to size.")
b.claim('Dr. Martens: between sizes, take the larger with an insole; better a little big', 'asserted by the page', US, "If you are in-between sizes, you might find that using an insole in the larger size is the way to go. It's always better if the fit is a little bit bigger rather than too small. If you go with a larger size, try using an insole which adds half a size.")
b.claim('Dr. Martens: boots stretch in width, not length', 'asserted by the page', US, "With wear, DM's often stretch in width but not in length.")
b.claim("Dr. Martens: the chart's length column is headed 'Foot length' with no unit and no sentence saying it is the foot's measured length; product pages may add the shoe's inner length", 'asserted by the page', US, 'Some styles also have the inner length and inner width in the table, too, in case you want to measure up.')
b.claim("Dr. Martens: the US page's 'Kid's Sizing' tab table was not in the fetched content; the DK page has no kids table (kids ranges appear only as menu links)", 'measured', US, "(fetcher) The page has a Kid's Sizing tab, but its table is not included in the captured content.")
b.claim('Dr. Martens regions differ: the US and UK pages chart foot length in whole and half cm (22 to 34) with half sizes at UK 6.5 and 9.5, the DK/EU page charts whole sizes UK 3 to 15 with JAPAN 22 to 34 and no length; EU 40 and 44 appear only on the US/UK pages, against UK 6.5 and 9.5', 'measured', DK, 'UK | EUR | US WOMEN | US MEN | JAPAN 3 | 36 | 5 | 4 | 22')
b.claim('Dr. Martens on all three pages: UK 7 = EU 41 (US/UK pages also EU 40 = UK 6.5): EU steps 39, 40, 41 against UK 6, 6.5, 7', 'measured', US, '25 | 9.1 | 6 | 39 ... 25.5 | 9.2 | 6.5 | 40 ... 26 | 9.3 | 7 | 41')
b.claim('Dr. Martens: every page refused a script (curl, HTTP 403); read through the harness fetcher only, so cell positions in rows with a blank are the fetcher model\'s reading', 'measured', US, '(curl: 403 on /us/en/about/size-guide and /uk/en_gb/shoe-size-guide)')
b.save()
