import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from csvlib import Brand, HERE
b = Brand('Brooks')
T = 'script (curl), saved HTML parsed by tables.py'
AU = 'https://support.brooksrunning.com.au/hc/en-us/articles/360047594793-Size-Conversion-Chart'
AUQ = 'https://support.brooksrunning.com.au/hc/en-us/articles/360046951054-How-do-I-know-my-shoe-size'
t = json.load(open(os.path.join(HERE, 'brooks_au_chart.json'), encoding='utf-8'))[0]['rows']
b.table('support.brooksrunning.com.au (Brooks Running Australia help centre)', 'Size Conversion Chart', t[0], t[1:], AU, T,
        'every row kept as printed, including the empty row 12 and the repeated header in row 13 where the page splits the table; no foot length column; Japan columns marked (cm)')
b.claim('Brooks Australia shows sizes in US only, with a conversion chart for the rest', 'asserted by the page', AU, 'Sizing on Brooksrunning.com.au is displayed in US sizes only. For international sizes, please see conversion chart, below.')
b.claim('Brooks Australia says any 2D measure only approximates shoe size and that lasts differ', 'asserted by the page', AUQ, 'Because the foot is three-dimensional, any two-dimensional measuring tool, such as a ruler or Brannock device® can only approximate your true shoe size. Please also keep in mind that manufacturers use different lasts to construct their shoes, and sizing may vary accordingly.')
b.claim('Brooks Australia: running shoes in US sizes, larger than UK; no Australian sizing', 'asserted by the page', AUQ, 'Brooks works in USA sizing, which is larger than UK sizing. There is no "Australian" sizing , however people often mean UK sizing then referring to "Australian".')
b.claim('Brooks Australia: sizing varies between brands and models', 'asserted by the page', AUQ, 'Running shoes are built on different shapes, therefore sizing/fit may vary between brands and between models within the same brand.')
b.claim('Brooks Australia chart: US Women = US Men + 1.5 and UK Women = UK Men + 0.5 on most rows, but UK Women runs 12, 13, 14, 15 against UK Men 11.5, 12, 13, 14 at the top (offset 0.5 then 1)', 'measured', AU, '12.5 |  | 11.5 | 12 | 46.5 | 30.5 | ; 13 |  | 12 | 13 | 47.5 | 31 |')
b.claim('Brooks Australia chart Japan (cm) columns repeat or skip: Japan Men 23 at US M 4 and 4.5, 25 at 6.5 and 7; Japan Women jumps 27 to 28 between W 10 and W 10.5', 'measured', AU, '4 | 5.5 | 3 | 3.5 | 36 | 23 | 22.5 ; 4.5 | 6 | 3.5 | 4 | 36.5 | 23 | 23 ; 8.5 | 10 | 7.5 | 8 | 42 | 26.5 | 27 ; 9 | 10.5 | 8 | 8.5 | 42.5 | 27 | 28')
b.claim('Brooks brooksrunning.com size chart pages (en_us unisex, mens, womens; en_gb, en_fr unisex) refused a script (HTTP 403 Access Denied) and the harness fetcher (403): could not reach; the search engine summary quoted the en_us page ("We recommend ordering Brooks running shoes 1/2 to one size larger than your dress shoe", "Unisex sizes match men\'s sizes per industry standard", women minus 1.5 = men), a lead only, unread', 'measured', 'https://www.brooksrunning.com/en_us/unisex-footwear-size-chart.html', '(curl: 403 "Access Denied"; WebFetch: 403)')
b.save()
