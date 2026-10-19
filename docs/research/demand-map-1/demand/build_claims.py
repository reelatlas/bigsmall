# Build claims_core.csv from the autocomplete probes and the hand-entered volume readings.
import csv, json, os, sys, urllib.parse
root = sys.argv[1]; dl = os.path.join(root, "downloads")
DATE = "2026-10-19"
SD = "https://www.seodata.dev/keyword/"
SR = "https://www.semrush.com/website/%s/overview/"
# (query, group, volume, url, exact words). Google Ads monthly US averages as mirrored (seodata.dev) or Semrush's US database (Sep 2026).
VOL = [
 ("kg to lbs","Weight",1830000,SD+"kg-to-lbs",'Monthly search volume for "kg to lbs" is 1,830,000 ... Monthly average for US, from the Google Ads API'),
 ("cm to inches","Length",1500000,SD+"cm-to-inches",'Monthly search volume for "cm to inches" is 1,500,000 (updated 2026-05-30)'),
 ("cm to inches","Length",1500000,SR%"unitconverters.net","cm to inches | I | 1 | 1,500,000 | 3.06% (United States, Sep 2026)"),
 ("mm to inches","Length",1220000,SD+"mm-to-inches",'Monthly search volume for "mm to inches" is 1,220,000 (updated 2026-06-12)'),
 ("mm to inches","Length",823000,SR%"unitconverters.net","mm to inches | I | 1 | 823,000 | 1.68%"),
 ("celsius to fahrenheit","Temperature",823000,SD+"celsius-to-fahrenheit","Monthly US search volume: 823,000 (updated 2026-06-22)"),
 ("c to f","Temperature",450000,SD+"celsius-to-fahrenheit","related: c to f: 450,000, overlap 20/20"),
 ("inches to cm","Length",673000,SD+"inches-to-cm",'Monthly search volume for "inches to cm" is 673,000 (updated 2026-06-29)'),
 ("inches to cm","Length",246000,SR%"unitconverters.net","inches to cm | I | 1 | 246,000 | 0.8%"),
 ("km to miles","Length",673000,SD+"km-to-miles",'Monthly search volume for "km to miles" is 673,000 (updated 2026-09-02)'),
 ("meters to feet","Length",550000,SD+"meters-to-feet",'Monthly search volume for "meters to feet" is 550,000 (updated 2026-06-29)'),
 ("ml to oz","Volume",368000,SD+"ml-to-oz","Monthly US search volume: 368,000 (updated 2026-10-19)"),
 ("1 ml is how many oz","Volume",201000,SD+"ml-to-oz","related: 1 ml is how many oz | 201,000 | 20/20"),
 ("inches to mm","Length",368000,SD+"inches-to-mm",'Monthly search volume for "inches to mm" is 368,000 (updated 2026-06-25)'),
 ("lbs to kg","Weight",368000,SR%"metric-conversions.org","lbs to kg | I | 12 | 368,000 | 0.01 | 0.4%"),
 ("miles to km","Length",301000,SD+"miles-to-km",'Monthly search volume for "miles to km" is 301,000 (updated 2026-08-19)'),
 ("feet to meters","Length",201000,SD+"feet-to-meters",'Monthly search volume for "feet to meters" is 201,000 (updated 2026-06-08)'),
 ("how many mm in an inch","Length",90500,SD+"inches-to-mm","related: how many mm in an inch 90500"),
 ("how many feet are in a meter","Length",135000,SD+"meters-to-feet","related: how many feet are in a meter 135000"),
 ("unit conversion","Control",823000,SR%"unitconverters.net","unit conversion | I | 1 | 823,000 | 2.7%"),
 ("metric conversion","Control",823000,SR%"metric-conversions.org","metric conversion | I | 2 | 823,000 | 0.56 | 24.07%"),
 ("unit converter","Control",301000,SR%"unitconverters.net","unit converter | I | 1 | 301,000 | 0.99%"),
 ("kilos to pounds","Weight",74000,SR%"lbs-to-kg.appspot.com","kilos to pounds | I | 5 | 74,000 | 0.31%"),
 ("160 lbs to kg","Weight (value)",33100,SR%"lbs-to-kg.appspot.com","160 lbs to kg | I | 2 | 33,100 | 0.3%"),
 ("95 lbs kilos","Weight (value)",27100,SR%"lbs-to-kg.appspot.com","95 lbs kilos | I | 1 | 27,100 | 0.31%"),
 ("libras a kg","Weight (Spanish)",49500,SR%"metric-conversions.org","libras a kg | C | 2 | 49,500 | 0 | 0.71%"),
 ("feet en metros","Length (Spanish)",27100,SR%"metric-conversions.org","feet en metros | I | 1 | 27,100 | 0.13 | 0.49%"),
 ("500 ml to oz","Volume (value)",60500,SR%"calculateme.com",'"500 ml to oz" | I | 2 | 60,500 | 0 | 0.21%'),
 ("60 inches to feet","Length (value)",40500,SR%"calculateme.com",'"60 inches to feet" | I | 2 | 40,500 | 0 | 0.14%'),
 ("80 inches in feet","Length (value)",33100,SR%"calculateme.com",'"80 inches in feet" | I | 2 | 33,100 | 0 | 0.11%'),
 ("oz and gallon","Volume",33100,SR%"kylesconverter.com","oz and gallon | I | 2 | 33,100 | 0.01 | 1.64%"),
 ("ha and acre","Area",14800,SR%"kylesconverter.com","ha and acre | I | 1 | 14,800 | 0 | 0.92%"),
 ("bar to psi","Pressure",40500,SD+"psi-to-bar","Also searched: bar to psi: 40,500"),
 ("psi to bar","Pressure",18100,SD+"psi-to-bar","Monthly US search volume: 18,100 (updated 2026-09-15)"),
 ("5'10 in cm","Height",90500,SD+"5-10-in-cm","H1 \"5 10 in cm\", 90,500 (updated 2026-10-12); related: 5'10 in cm | 90,500 | 20/20"),
 ("5 ft 10 in cm","Height",18100,SD+"5-10-in-cm","5 ft 10 in cm | 18,100 | 20/20; 5 foot 10 in cm | 18,100"),
 ("height comparison","Height",201000,SR%"gigacalculator.com","height comparison | C N | 3 | 201,000 | 0.82%"),
 ("cups to grams","Cooking",40500,SD+"cups-to-grams","Monthly US search volume: 40,500 (updated 2026-08-20)"),
 ("grams in a cup","Cooking",165000,SD+"cups-to-grams","grams in a cup: 165,000"),
 ("a cup in grams","Cooking",110000,SD+"cups-to-grams","a cup in grams: 110,000"),
 ("how many grams in a cup","Cooking",90500,SD+"cups-to-grams","how many grams in a cup: 90,500"),
 ("1 cup in grams","Cooking",27100,SD+"cups-to-grams","1 cup in grams: 27,100"),
 ("5/8 inch to mm","Fraction",40500,SD+"5-8-to-mm","H1 5 8 to mm, 40,500 (updated 2026-10-04); related: 5/8 inch to mm, 3 3/8 to mm, 5/16 in to mm (all 40,500): Keyword Planner groups punctuation-stripped forms"),
 ("nm to ft lbs","Torque",49500,SD+"nm-to-ft-lbs","Monthly US search volume: 49,500 (updated 2026-09-15); also searched: foot pounds to nm 49,500, ft lb to nm 49,500"),
 ("pace calculator","Pace",90500,SD+"pace-calculator","US monthly searches: 90,500 (updated 2026-07-19)"),
 ("running pace calculator","Pace",40500,SD+"pace-calculator","running pace calculator | 40,500 | 20/20; pace converter running 40,500"),
 ("shoe size converter","Shoe",40500,SD+"shoe-size-converter","Monthly US search volume: 40,500 (updated 2026-07-31)"),
]
def tier_vol(v): return "head" if v >= 200000 else ("mid" if v >= 20000 else "long")
def tier_ac(q, chars):
    if chars is None: return "long"
    first = len(q.split(" ")[0])
    if chars <= min(first, 3) or chars <= 2: return "head"
    if chars <= first + 4: return "mid"
    return "long"
rows = []
for q, g, v, url, ex in VOL:
    rows.append({"claim": f"'{q}' has about {v:,} monthly US searches (a third-party estimate); tier {tier_vol(v)}", "layer": "figure: third-party keyword estimate (Google Ads data as mirrored, or Semrush)", "evidence": "measured (by a tool; an estimate, bucketed)", "url": url, "exact_words": ex, "date_read": DATE, "query": q, "group": g, "tier": tier_vol(v), "signal": "volume"})
summary = {}
for fn, gl in (("ac_us.json","us"),("ac_us_extra.json","us"),("ac_gb.json","gb")):
    p = os.path.join(dl, fn)
    if not os.path.exists(p): continue
    for x in json.load(open(p, encoding="utf-8")):
        h = x["hit"]; q = x["q"]
        t = tier_ac(q, h["chars"] if h else None)
        pre = h["prefix"] if h else q
        url = "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=%s&q=%s" % (gl, urllib.parse.quote(pre))
        if h:
            claim = f"Google autocomplete ({gl.upper()}) offers '{q}' at the {h['chars']}-character prefix '{pre}', rank {h['rank']} of 10; tier {t} (ordinal proxy)"
            ex = "; ".join(h["list"])
        else:
            claim = f"Google autocomplete ({gl.upper()}) never offers '{q}' before it is typed in full; tier long"
            ex = "full query completions: " + "; ".join(x["full"][:10])
        rows.append({"claim": claim, "layer": "4, in the wild: Google's own autocomplete", "evidence": "measured (ordinal proxy, not volume)", "url": url, "exact_words": ex[:400], "date_read": DATE, "query": q, "group": x["cat"], "tier": t, "signal": "autocomplete-" + gl})
        summary.setdefault(q, {})[gl] = (h["chars"] if h else None, h["rank"] if h else None, t)
        if gl == "us":
            ans = [s for s in x["full"] if s.startswith("=")]
            furl = "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=" + urllib.parse.quote(q)
            if ans:
                c2 = f"Google's calculator answers '{q}' in its suggestions with '{ans[0]}' (the converter box's engine; box assumed)"
            else:
                c2 = f"Google's suggestions for '{q}' carry no calculator answer (weak: absence is not proof the results page has no box)"
            rows.append({"claim": c2, "layer": "4, in the wild: Google's own suggest response", "evidence": "measured (one response)", "url": furl, "exact_words": ("; ".join(x["full"][:5]))[:400], "date_read": DATE, "query": q, "group": x["cat"], "tier": t, "signal": "google-answer"})
cols = ["claim","layer","evidence","url","exact_words","date_read","query","group","tier","signal"]
with open(os.path.join(root, "claims.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
json.dump(summary, open(os.path.join(root, "ac_summary.json"), "w", encoding="utf-8"), indent=0)
print(len(rows))
for q, s in summary.items():
    if "gb" in s: print(q, s)
