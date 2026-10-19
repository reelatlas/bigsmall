import json, sys, urllib.request, urllib.parse, time, os
out = sys.argv[1]
UA = {"User-Agent": "unit-research-script/0.1"}
def get(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
            return r.read().decode("utf-8", "replace")
    except Exception as e:
        return "ERR " + str(e)
arts = ["Shoe_size","Mondopoint","Gas_mark","Paper_size","ISO_216","Letter_(paper_size)","Blood_sugar_level","Glycated_hemoglobin",
"Bit_rate","Data-rate_units","Frequency","Hertz","Density","Volumetric_flow_rate","Acceleration","Standard_gravity",
"Point_(typography)","Pica_(typography)","Pixel_density","Dots_per_inch","US_standard_clothing_size","EN_13402","Clothing_sizes","Ring_size",
"Torque","Newton-metre","Foot-pound_(energy)","Pace_(speed)","Fahrenheit","Inch","Kilogram","Pound_(mass)","Kilowatt-hour","Fuel_economy_in_automobiles",
"Pound-force","Horsepower","Pounds_per_square_inch","Calorie","Rotations_per_minute","Angular_frequency","Viscosity","Currency_converter","Exchange_rate","Time_zone","Decibel","Roman_numerals","Binary_number","Board_foot","Lumen_(unit)","Lux"]
res = {}
for a in arts:
    u = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/%s/monthly/20251001/20260930" % urllib.parse.quote(a, safe="")
    t = get(u)
    try:
        items = json.loads(t)["items"]; res[a] = {"months": len(items), "total": sum(i["views"] for i in items)}
    except Exception:
        res[a] = {"error": t[:120]}
    time.sleep(0.2)
qs = ["shoe size conver","us shoe size to","eu shoe size","gas mark","gas mark 4 in","mg/dl to","mmol/l to","blood sugar conver","a4 size in","paper size","letter size in","mbps to","gbps to","hz to","ghz to","kg/m3 to","g/cm3 to","density conver","gpm to","cfm to","l/min to","m/s2 to","g force to","pt to px","px to","em to px","dpi to","dress size conver","uk dress size to","us size to eu","collar size","neck size in","bust size","waist size cm to","ring size conver","clothing size conver","rpm to","nm to ft lb","min per km to","kph to"]
sug = {}
for q in qs:
    u = "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=" + urllib.parse.quote(q)
    t = get(u)
    try: sug[q] = json.loads(t)[1]
    except Exception: sug[q] = ["ERR " + t[:80]]
    time.sleep(0.3)
json.dump({"wiki_pageviews_en_user_2025-10_to_2026-09": res, "google_autocomplete_us_en": sug}, open(out, "w", encoding="utf-8"), indent=1)
print("done")
