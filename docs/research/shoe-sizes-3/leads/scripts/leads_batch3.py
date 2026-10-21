"""Batch 3: claims from size.ly, Zappos customer fit ratings, AlpinStore, SoleFeed, Bootspy, OPUMO,
Captain Creps (Converse, Puma), Tom's Guide, Road Runner Sports, LookSize; plus Flight Club's
generic chart (div layout, read from the text lines) into charts.csv."""
import csv, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rec import add_lead, add_chart_rows  # noqa: E402
from extract import text_of  # noqa: E402

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SZ = "https://www.size.ly/shoe-size-recommender/"
L = [
 ("Skechers", "size.ly (sizing-tool company)", "converter compiled from brand charts", "Skechers a full size bigger than Nike by the two charts",
  "A Nike US 10 is about a Skechers US 9 (EU 42) in men's sizes . Skechers fits about a full size bigger at the same printed size, so expect to take about a full size down in Skechers, based on both brands' official size charts.",
  SZ + "nike-to-skechers", "script", "", "", "yes (Foot (cm))"),
 ("Under Armour", "size.ly (sizing-tool company)", "converter compiled from brand charts", "UA 10 = Nike 11 by the two charts",
  "An Under Armour US 10 is about a Nike US 11 (EU 45) in men's sizes . Nike fits about 1.5 sizes smaller at the same printed size, so expect to take about 1.5 sizes up in Nike, based on both brands' official size charts.",
  SZ + "under-armour-to-nike", "script", "", "", "yes (Foot (cm))"),
 ("Puma", "size.ly (sizing-tool company)", "converter compiled from brand charts", "Puma 10 = Nike 11 by the two charts",
  "A Puma US 10 is about a Nike US 11 (EU 45) in men's sizes . Nike fits about a full size smaller at the same printed size, so expect to take about a full size up in Nike, based on both brands' official size charts.",
  SZ + "puma-to-nike", "script", "", "", "yes (Foot (cm))"),
 ("New Balance", "size.ly (sizing-tool company)", "converter compiled from brand charts", "NB a full size bigger than Nike by the two charts",
  "A Nike US 10 is about a New Balance US 9 (EU 42.5) in men's sizes . New Balance fits about a full size bigger at the same printed size, so expect to take about a full size down in New Balance, based on both brands' official size charts.",
  SZ + "nike-to-new-balance", "script", "", "", "yes (Foot (cm))"),
 ("Nike", "size.ly (sizing-tool company)", "converter compiled from brand charts", "27 of 210 tracked Nike models run small (tracking method unstated)",
  "Of 210 tracked Nike models, 27 run small . The rest fit true to the chart.",
  SZ + "nike-to-adidas", "script", "", "", "no"),
 # AlpinStore
 ("UGG", "AlpinStore (retailer)", "retailer guide citing UGG's charts", "Classic boots run large; half to full size down",
  "Classic boots (Mini, Short, Tall, Ultra Mini) run large. The UGG rule: go down half a size, or even a full size, from your usual size.",
  "https://www.alpinstore.com/en/content/555-size-guide-ugg", "script", "", "", "yes (Foot Length (cm))"),
 ("UGG", "AlpinStore (retailer)", "retailer guide citing UGG's charts", "foot lengths taken from UGG's official charts",
  "Sources: official UGG size charts (help.ugg.com, ugg.com). Foot lengths are in cm (measured from heel to the longest toe).",
  "https://www.alpinstore.com/en/content/555-size-guide-ugg", "script", "", "", "yes"),
 ("UGG", "AlpinStore (retailer)", "retailer guide citing UGG's charts", "Classic Mini Platform: returns confirm a full size too large is common",
  "Classic Mini Platform | Runs large — go down -0.5 to -1 | Multiple returns confirm that a full size too large is common.",
  "https://www.alpinstore.com/en/content/555-size-guide-ugg", "script", "", "", "no"),
 # SoleFeed
 ("UGG", "SoleFeed (review aggregator)", "aggregated owner reports (cites r/ugg)", "Classic Mini half size large",
  "Yes, size down half a size from your normal sneaker size — that is the consistent fit takeaway across r/ugg buyer threads.",
  "https://solefeed.com/guide/ugg/classic-mini", "script", "", "", "no"),
 ("Clarks", "SoleFeed (review aggregator)", "aggregated owner reports", "Wallabee often runs large",
  "It often runs large, and going down half a size is common, but check the specific material and retailer guidance before ordering.",
  "https://solefeed.com/guide/clarks/wallabee-boot", "script", "", "", "no"),
 # Bootspy
 ("Clarks", "Bootspy (boot review blog)", "reviewer guide", "Clarks run larger than Nike or Vans; half size smaller",
  "Clarks run larger than shoe brands like Nike or Vans. Most American brands go by standard sneaker or dress shoe sizing, which tends to fit smaller and more snug.",
  "https://bootspy.com/clarks-sizing-guide/", "script", "", "", "no"),
 ("Clarks", "Bootspy (boot review blog)", "reviewer guide", "Wallabees at least half size smaller",
  "When you're buying your Wallabees, make sure you order at least a half size smaller than your regular sneaker or dress shoe size.",
  "https://bootspy.com/clarks-sizing-guide/", "script", "", "", "no"),
 # OPUMO
 ("Converse", "OPUMO Magazine (retailer magazine)", "magazine guide", "Chuck Taylor and Chuck 70 half size down",
  "Chuck Taylor All Stars and Chuck 70 sneakers run large, so we'd recommend opting for a half size down.",
  "https://www.opumo.com/magazine/converse-sizing-guide", "script", "", "", "no"),
 # Captain Creps
 ("Converse", "Captain Creps (sneaker blog)", "blog guide", "Converse slightly bigger than average",
  "In general Converse shoes tend to fit slightly bigger than your average shoe.",
  "https://captaincreps.com/how-do-converse-fit-compared-to-nike/", "script", "", "", "no"),
 ("Puma", "Captain Creps (sneaker blog)", "blog guide", "Puma slightly smaller than Nike, yet same size",
  "Generally, Puma runs slightly smaller than Nike but there are definitely exceptions depending if you wear a Men's or Women's shoe.",
  "https://captaincreps.com/puma-shoes-run-smaller-than-nike/", "script", "", "", "no"),
 # Tom's Guide
 ("On", "Tom's Guide (tech/consumer reviewer)", "reviewer first-person", "Cloudmonster snug; went up half a size",
  "I realized that the shoe had a snugger fit than I would have liked. So I went up a half size, which felt miles better.",
  "https://www.tomsguide.com/opinion/i-ran-300-miles-in-the-on-cloudmonsters-heres-how-i-rate-them", "script", "", "", "no"),
 # Road Runner Sports
 ("all brands", "Road Runner Sports (running retailer blog)", "retailer guide", "women's = men's + 1.5; foot length varies by brand",
  "Foot length is approximate and varies slightly by brand. When you are between sizes, size up for running shoes.",
  "https://www.roadrunnersports.com/blog/women-to-men-shoe-size.md", "script", "", "", "yes (Foot length (in), generic)"),
 # LookSize
 ("Dr. Martens", "LookSize (size-chart site)", "size-chart compilation", "foot length per Dr. Martens size (men's US 7 = 26.3)",
  "Category (gender) : Shoes (male) ... US | 4 | 5 | 6 | 7 ... Foot length | 23.7 | 24.6 | 25.4 | 26.3",
  "https://www.looksize.com/brand-size-chart/dr-martens", "script", "", "", "yes"),
 ("Clarks", "LookSize (size-chart site)", "size-chart compilation", "foot length per Clarks size",
  "Category (gender) : Shoes (male) ... US | 6 | ... Foot length | 23.7 | 24.1 | 24.6",
  "https://www.looksize.com/brand-size-chart/clarks", "script", "", "", "yes"),
]
for row in L:
    add_lead(*row)

# Zappos customer fit ratings, one lead per product, the counts as printed in the page data
for r in csv.DictReader(open(os.path.join(BASE, "zappos_fit.csv"), encoding="utf-8")):
    if not r["true_to_size"] and not r["half_larger"]:
        continue
    ex = (f"sizeRatingCounts: Felt true to size {r['true_to_size'] or 0}; Felt a half size larger than marked {r['half_larger'] or 0}; "
          f"Felt a full size larger than marked {r['full_larger'] or 0}; Felt a half size smaller than marked {r['half_smaller'] or 0}; "
          f"Felt a full size smaller than marked {r['full_smaller'] or 0} (totalReviews {r['total_reviews']})")
    b = {"PUMA": "Puma", "ASICS": "Asics", "SKECHERS": "Skechers", "Hoka": "HOKA"}.get(r["brand"], r["brand"])
    add_lead(b, "Zappos (retailer) customer reviews", "customer fit survey per product",
             f"customers' fit answers for {r['product']} (one product, not the brand)", ex, r["review_url"], "script",
             r["true_to_size"] or "0",
             str(sum(int(r[k] or 0) for k in ("half_larger", "full_larger", "half_smaller", "full_smaller"))), "no")

# Flight Club generic chart: lines after 'Men Women | US | UK | EU | CM' come in fours
lines = [l.strip() for l in text_of(open(os.path.join(BASE, "downloads", "flightclub_sizing.html"), encoding="utf-8", errors="replace").read()).split("\n") if l.strip()]
out = []
for label, start, end in (("Men", 106, 190), ("Women", 284, 384)):
    cells = lines[start:end]
    for k in range(0, len(cells) - 3, 4):
        us, uk, eu, cm = cells[k:k + 4]
        for col, v in (("UK", uk), ("EU", eu), ("CM", cm)):
            out.append(("generic (no brand)", "Flight Club (resale, GOAT Group)", f"Size Guide: {label}", col, f"US={us}", v,
                        "https://www.flightclub.com/size-guide", "script"))
print("flight club cells", add_chart_rows(out, flag="third-party generic chart, no brand named"))
print("leads now", sum(1 for _ in open(os.path.join(BASE, "leads.csv"), encoding="utf-8")) - 1)
