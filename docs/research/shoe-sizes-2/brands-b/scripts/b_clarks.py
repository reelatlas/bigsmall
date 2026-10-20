import sys,os,json; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from csvlib import Brand,HERE
b=Brand('Clarks')
def J(n): return json.load(open(os.path.join(HERE,n),encoding='utf-8'))
def strip_shop(t):
    h=t['rows'][0]; keep=[i for i,c in enumerate(h) if not c.lower().startswith('shop') and not c.endswith('Clarks Shoe Sizes')]
    rows=[[r[i] if i<len(r) else '' for i in keep] for r in t['rows'][1:]]
    return [h[i] for i in keep],rows
T='script (curl), saved HTML parsed by tables.py'
NOTE='the "Shop" link column dropped'
for js,site,url in(('clarks_ie.json','clarks.com/en-ie','https://www.clarks.com/en-ie/fitguide'),('clarks_gb.json','clarks.com/en-gb','https://www.clarks.com/en-gb/fitguide')):
    t=J(js)
    for idx,chart in((0,'Womens Clarks Shoe Sizes'),(2,'Mens Clarks Shoe Sizes'),(4,'Kids & Babies Clarks Shoe Sizes')):
        h,r=strip_shop(t[idx]); b.table(site,chart,h,r,url,T,NOTE+('; kids rows run UK 2 to 13½ then 1 to 10 (the page\'s own order)' if idx==4 else ''))
for js,site,url,chart in(('clarks_us_womens.json','clarks.com/en-us','https://www.clarks.com/en-us/fit-guide/womens','Women\'s Shoe Size Chart (US & UK)'),('clarks_us_mens.json','clarks.com/en-us','https://www.clarks.com/en-us/fit-guide/mens','Men\'s Shoe Size Chart')):
    h,r=strip_shop(J(js)[0]); b.table(site,chart,h,r,url,T,NOTE)
au=J('clarks_au.json'); url='https://clarks.com.au/pages/size-guide'
names=['Mens','Womens','Kids: Baby/Toddler','Kids: Junior Kids','Kids: Senior Kids']
for t,n in zip(au,names):
    h=t['rows'][0]; rows=[r[:len(h)] for r in t['rows'][1:]]
    note='the "Shop US n" link cell dropped; the site is Clarks Australia (clarks.com.au, "© 2026 Clarks")'
    if n=='Mens': note+='; the fourth column is headed "UK" in the markup and repeats the UK value: no length column on the men\'s chart'
    if n.startswith('Kids'): note+='; kids tabs on the page are "0-2 years", "3-8 years", "8+ Years" beside "Baby/Toddler", "Junior Kids", "Senior Kids"; leading zeros (04.5, 010) as printed'
    b.table('clarks.com.au',n,h,rows,url,T,note)
IE='https://www.clarks.com/en-ie/fitguide'
b.claim('Clarks (IE and GB) charts give the foot length in millimetres per size, for women, men, and kids, and the length is the foot measured with a ruler','asserted by the page',IE,'Place a ruler beside your foot touching the straight edge your heel is also touching, then take the length in millimetres from the tip of your longest toe to your heel.')
b.claim('Clarks says its mm chart does not match measuring with its own foot gauge','asserted by the page',IE,'*These measurements do not correlate to measuring with a Clarks foot gauge.')
b.claim('Clarks prints its own EU size beside a "Standard EU Size", the two differing on several rows (e.g. UK 3: Clarks EU 35½, Standard EU 36; UK 10: 44½ against 45; UK 14: 49½ against 49)','asserted by the page',IE,'Clarks UK Size | Clarks EU Size | Standard EU Size | Foot Length (Millimetres) (MMs)')
b.claim('Clarks en-gb and en-ie fit guides print identical charts (all six tables equal cell for cell)','measured','https://www.clarks.com/en-gb/fitguide','(compared by script: 6 of 6 tables equal)')
b.claim('Clarks women\'s and men\'s mm columns are the same length at the same UK size (UK 5 to 9: 237, 241, 246, 250, 254, 258, 263, 267, 272 in both)','measured',IE,'Womens: 5 | 38 | 38 | 237 ... Mens: 5 | 38 | 38 | 237')
b.claim('Clarks kids chart gives a different length from the adult chart at the same UK size (kids UK 5 = 236 mm, women UK 5 = 237 mm; kids UK 10 = 278 mm, men UK 10 = 280 mm)','measured',IE,'Kids: 5 | 38 | 236 ; Womens: 5 | 38 | 38 | 237')
b.claim('Clarks offers widths (women D, E, EE; men G, H; kids E, F, G, H on IE/GB; US women C, D, E, EE and men G, H, XW): not charted here','asserted by the page',IE,'Width | Description ... D | Standard Fit | E | Wide Fit | EE | Extra Wide Fit')
b.claim('Clarks US charts give foot length in inches to one decimal against US and UK only (no EU), US women = UK + 2½ and US men = UK + 1 on every row','measured','https://www.clarks.com/en-us/fit-guide/womens','US Size | UK Size | Foot Length (IN) ... 5 | 2½ | 8.5')
b.claim('Clarks US advises sizing up slightly for swelling','asserted by the page','https://www.clarks.com/en-us/fit-guide/womens','Consider sizing up slightly to accommodate potential swelling and ensure comfort throughout the day.')
b.claim('Clarks US hub page https://www.clarks.com/en-us/fit-guide served no chart table in its HTML (the charts are on /womens and /mens); /en-us/fitguide and /en-us/fit-guide/kids returned 404: no US kids chart found','measured','https://www.clarks.com/en-us/fit-guide','(curl: 200 with no <table>; /en-us/fit-guide/kids 404)')
AU='https://clarks.com.au/pages/size-guide'
b.claim('Clarks Australia calls its chart approximate and its cm foot length','asserted by the page',AU,'* Please note: there is no true conversion available. Therefore this chart is an approximate only. CM Measurements are for Foot Length, not Shoe Length.')
b.claim('Clarks Australia men\'s chart has no length column (its fourth column is headed UK and repeats UK); the women\'s and kids\' charts give cm to one decimal','measured',AU,'<th>UK</th> <th>EU</th> <th>US</th> <th>UK<br></th>')
b.claim("Clarks Australia women's US column runs US = UK + 2½ (UK 4 = US 6.5) while its senior kids chart puts UK 4 at US 5 and UK 3.5 at US 4; its women's cm equal the IE women's mm / 10 on all thirteen shared sizes (UK 3 to 9)",'measured',AU,'Womens: 4 | 37 | 6.5 | 22.9 ; Senior Kids: 4 | 37 | 5 | 22.9 ; IE Womens: 4 | 37 | 37 | 229')
b.save()
