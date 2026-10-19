import sys,re,os,glob,collections,html
sys.stdout.reconfigure(encoding="utf-8")
N={'cm':'cm','centimeter':'cm','centimeters':'cm','centimetre':'cm','in':'in','inch':'in','inches':'in','"':'in',
'ft':'ft','feet':'ft','foot':'ft','m':'m','meter':'m','meters':'m','metre':'m','metres':'m','mm':'mm','millimeter':'mm','millimeters':'mm',
'km':'km','kilometer':'km','kilometers':'km','kilometre':'km','mi':'mi','mile':'mi','miles':'mi','yd':'yd','yard':'yd','yards':'yd',
'kg':'kg','kilogram':'kg','kilograms':'kg','kilo':'kg','kilos':'kg','lb':'lb','lbs':'lb','pound':'lb','pounds':'lb','g':'g','gram':'g','grams':'g',
'oz':'oz','ounce':'oz','ounces':'oz','stone':'st','st':'st','stones':'st',
'c':'C','celsius':'C','f':'F','fahrenheit':'F','k':'K','kelvin':'K',
'l':'L','liter':'L','liters':'L','litre':'L','litres':'L','ml':'mL','milliliter':'mL','milliliters':'mL','gallon':'gal','gallons':'gal','gal':'gal',
'cup':'cup','cups':'cup','tbsp':'tbsp','tablespoon':'tbsp','tablespoons':'tbsp','tsp':'tsp','teaspoon':'tsp','teaspoons':'tsp','floz':'fl oz','fl-oz':'fl oz','fluid-ounce':'fl oz','fluid-ounces':'fl oz',
'mph':'mph','kph':'km/h','kmh':'km/h','km-h':'km/h','kmph':'km/h','knot':'kn','knots':'kn',
'sqft':'ft2','square-feet':'ft2','square-foot':'ft2','sq-ft':'ft2','sqm':'m2','square-meters':'m2','square-meter':'m2','sq-m':'m2','acre':'ac','acres':'ac','hectare':'ha','hectares':'ha',
'nm':'N·m','newton-meter':'N·m','newton-meters':'N·m','ft-lb':'ft·lbf','ft-lbs':'ft·lbf','foot-pounds':'ft·lbf','foot-pound':'ft·lbf',
'psi':'psi','bar':'bar','kpa':'kPa','pa':'Pa','atm':'atm','kw':'kW','hp':'hp','horsepower':'hp','kilowatts':'kW','kilowatt':'kW',
'joule':'J','joules':'J','j':'J','calorie':'cal','calories':'cal','kcal':'kcal','kj':'kJ','btu':'BTU','watt':'W','watts':'W',
'mb':'MB','gb':'GB','kb':'KB','tb':'TB','mpg':'mpg'}
def norm(t):
    t=t.lower().strip(' .-_+')
    t=t.replace(' ','-')
    return N.get(t)
sites=collections.defaultdict(set)
for f in sorted(glob.glob(sys.argv[1]+'/*.html')):
    s=open(f,encoding='utf-8',errors='replace').read()
    site=os.path.basename(f).split('_')[1]
    cands=[]
    for href,txt in re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>',s,re.S):
        txt=html.unescape(re.sub('<[^>]+>','',txt)).strip()
        for src in (txt, re.sub(r'\.(html?|php)$','',href.rstrip('/').split('/')[-1]), '/'.join(href.rstrip('/').split('/')[-3:])):
            m=re.search(r'([A-Za-z"°\- ]{1,22}?)\s*(?:-to-|\s+to\s+|/to/|→)\s*([A-Za-z"°\- ]{1,22})$',src.replace('/from/','').strip(),re.I)
            if m:
                a,b=norm(m.group(1).replace('°','')),norm(m.group(2).replace('°',''))
                if a and b and a!=b: sites[(a,b)].add(site); break
cnt=sorted(sites.items(),key=lambda kv:(-len(kv[1]),kv[0]))
nsites=len(set(os.path.basename(f).split('_')[1] for f in glob.glob(sys.argv[1]+'/*.html')))
print('sites',nsites)
for (a,b),ss in cnt[:45]: print(f"{a} to {b}\t{len(ss)}\t{','.join(sorted(ss))}")
