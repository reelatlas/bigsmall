"""Write sources.md: the source profiles first, then every page opened (from fetchlog.csv) and what it gave."""
import csv, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROFILES = """# Leads worker: third-party sources on the twenty brands' sizing (read 2026-10-21)

Every row here is a lead in the sense of docs/RESEARCH.md §3 unless the orchestrator decides otherwise. No figure of ours, no average, no verdict.
Tool: `script` = our own urllib request saved to downloads/ and parsed (the words were found in the file); `fetcher` = none used for a recorded claim (the one fetcher attempt, Reddit, was refused).

## Source profiles

| Source | Publisher | What the page is | How it says it was made | Foot length per brand size? | Commercial interest | Date on page | Cited by others met |
|---|---|---|---|---|---|---|---|
| RunRepeat size-chart pages (16 brands) | RunRepeat (running-shoe review and lab-testing site, Denmark) | per-brand size guide with a cross-brand comparison table | "We used the data from 40+ brand shoe size charts"; "Based on the charts provided on the brand's official website"; separately says it measures internal length in its lab for reviews; the main charts are PNG images, not text | the comparison tables print mm per size, headed variously "Shoe length (MM)", "Foot length (mm)", or "MM" (the same kind of table, three labels) | affiliate links to retailers (shop buttons) | dateModified 2024-08-16 to 2026-02-09 per page | yes: surfaced by most searches; footwearmagazine and others repeat its lines |
| Scheels brand size charts (11 brands reached) | Scheels (US sporting-goods retailer) | retailer's brand chart pages | unstated; one (Clarks) says "*Foot Length measured in CENTIMETERS"; others say "Length (in.)", "Inches", "CM" without saying foot or shoe | yes for adidas, Timberland, Clarks, HOKA (labelled foot); length unlabelled for NB, Asics, Converse, Vans, Crocs, Dr. Martens (*Inches) | sells the shoes | none printed | appeared in searches; not cited by others |
| SportsShoes.com size guides (8 brands) | SportsShoes.com (UK running retailer) | retailer's brand size-guide pages | unstated | adidas "HEEL-TOE", Asics "CM", NB "Length (cm)", Salomon "Heel - Toe", UA "CM"; Nike, Brooks, Skechers no length | sells the shoes | none printed | appeared in searches |
| Outsole.nl size charts (13 brands) | Outsole (Dutch sneaker shop; its own Air Max 1 range is its reference) | retailer's brand chart + fit text per brand | unstated; "With our experience as a sneaker shop"; text compares each brand with its own Air Max 1 range | CM column, not labelled foot or shoe | sells sneakers and laces | datePublished 2026-04-09, dateModified 2026-09-03 | surfaced in searches; not cited by others |
| Foot Locker UK Birkenstock guide | Foot Locker UK (retailer) | brand size guide with chart | unstated; "Use your foot measurement in centimeters (CM)" | CM and Inches per size (adult and kids) | sells the shoes | none found | cited by search summaries; other Foot Locker brand guides at the guessed URLs were empty shells |
| LookSize brand charts (Dr. Martens, Clarks, Crocs) | LookSize (Ukrainian size-chart SaaS vendor, "Size Chart Management") | compiled brand chart pages | unstated ("Brand size charts letter A-Z") | yes, "Foot length" row (Dr. Martens, Clarks); Crocs only a "Japanese" row | sells sizing software to stores | none printed | appeared in searches; one search summary noted its Dr. Martens US 7 = 26.3 cm against Bergfreunde's 25 cm |
| AlpinStore UGG guide | AlpinStore (French ski/mountain retailer) | retailer guide, charts plus per-model advice table | "Sources: official UGG size charts (help.ugg.com, ugg.com)"; advice "Multiple returns confirm..." (its own returns, uncounted) | yes, "Foot Length (cm)" | sells UGG | none printed | no |
| size.ly converter pages (5 pairs) | size.ly (sizing tools/SDK company for shops) | brand-to-brand converter with tables | "Matched by foot length from both brands' published size charts · Updated July 2026"; "Of 210 tracked Nike models, 27 run small" (tracking method unstated) | yes, "Foot (cm)" with each brand's size beside | sells sizing tools; affiliate program link | Updated July 2026 | surfaced in one search |
| Zappos customer fit ratings (40 products + 3) | Zappos (US retailer, Amazon-owned) | product review pages; the page data carries `sizeRatingCounts`, customers' answers ("Felt true to size", "Felt a half size larger than marked", ...) | customers' reports, aggregated by Zappos; per product, not per brand; the count of size answers is often far below totalReviews (e.g. Reebok Club C 85: 3655 reviews, 167 size answers) | no | sells the shoes | live | Zappos reviews surfaced in several searches |
| Zappos shoe size conversion | Zappos | one generic chart (US/UK/EU/Inches/Centimeters), no brand | unstated; not labelled foot | inches/cm, generic | sells shoes | none | copies circulate as spam PDFs |
| Flight Club size guide | Flight Club (resale; "owned and operated by GOAT Group") | one generic US/UK/EU/CM chart, men's and women's, no brand named | unstated | CM column, generic | resells sneakers | none | no |
| StockX help article | StockX (resale) | help article | gives no fit data; points to manufacturers and per-product charts | no | resells | live | no |
| Hibbett blog | Hibbett (US retailer) | "Do Nike Shoes Run Small?" guide | unstated, retailer advice | no | sells Nike | datePublished 2025-07-07 | surfaced in searches |
| Man of Many | Man of Many (Australian men's lifestyle magazine) | sneaker sizing guide | quotes a retailer fitter (Kish Kash); internally inconsistent on Nike | no | affiliate links | published 2016-10-22, modified 2023-08-22 | repeated by search summaries |
| Stridewise | Stridewise (shoe-review blog) | "Do Dr Martens run big?", "Do Timberland boots run big?" | author's own Brannock reading and pair (one person) | no | affiliate links | DM: modified 2024-09-04 | surfaced in searches |
| SoleFeed | SoleFeed (review aggregator, AI-style summaries of owner threads) | model guides (Timberland 6-inch, UGG Classic Mini, Clarks Wallabee) | summarises owner reports; cites r/ugg threads without links counted | no | shop links | 2026-03 to 2026-05 | no |
| Bootspy | Bootspy (boot review blog) | Clarks sizing guide | unstated, author advice | no | affiliate | modified 2024-03-15 | surfaced in searches |
| Captain Creps | Captain Creps (UK sneaker blog) | NB, Converse, Puma sizing guides | unstated; quotes cm figures without source; self-contradictory on NB vs Nike | no (prose cm only) | affiliate | 2022 to 2023 | surfaced in many searches |
| OPUMO Magazine | OPUMO (UK fashion retailer's magazine) | Converse sizing guide | unstated | no | sells | modified 2023-03-15 | no |
| Footwear Magazine | footwearmagazine.com (sizing-comparison site) | Hoka vs Nike / Brooks comparisons | "Size charts reviewed September 6, 2026"; says its rows compare size labels, "not measured-foot-length equivalents"; lists official charts as sources | no | ads | published 2024-08-10, reviewed 2026-09-06 | surfaced in searches |
| Fit2Run | Fit2Run (US running retailer) | HOKA fit guide | unstated, staff advice | no | sells HOKA | none found | surfaced in a search |
| Road Runner Sports | Road Runner Sports (US running retailer) | women-to-men conversion article (.md) | generic; "Foot length is approximate and varies slightly by brand" | generic inches | sells | none | no |
| Tom's Guide | Tom's Guide (consumer-tech publication) | first-person Cloudmonster review | one runner's experience | no | affiliate | not parsed | no |
| Slickdeals | Slickdeals (deal forum) | thread on a Crocs deal | a few users' posts | no | affiliate deal site | 2024-08-09 (thread title) | no |

## Could not reach (nothing bypassed)

- Reddit (r/RunningShoeGeeks, r/Sneakers, r/goodyearwelt, r/Birkenstocks, r/Crocs, r/ugg): www.reddit.com search JSON answered 403 with a "blocked" page; old.reddit.com answered a "Welcome to Reddit" interstitial with no data; the harness fetcher said it is "unable to fetch from www.reddit.com". Web searches restricted to reddit.com returned no Reddit pages.
- QVC community Birkenstock thread: Cloudflare "Just a moment..." page (403).
- The Iconic (UGG size guide said to be provided by UGG): Cloudflare "Just a moment..." page (403).
- eBay sneakers page: 503 error page.
- GOAT: /size-guide is 404; /faq holds no sizing guide. Stadium Goods: /pages/size-guide 404 (its size guide lives inside product pages, not read).
- JD Sports UK /page/size-guide/: 404.
- RunRepeat has no page for Birkenstock, Crocs, UGG, Dr. Martens, Clarks (404).
- Scheels has no chart at the guessed URL for Nike, Skechers, Reebok, Under Armour, Birkenstock, UGG, On, Salomon (generic "Size Chart" page, no table).
- Foot Locker UK: guessed guide URLs for 16 other brands return an empty shell page (soft 404); only Birkenstock's guide exists among those tried.
- SportsShoes.com: Puma, HOKA, On, Reebok guides 404.
- size.ly: no pages for Birkenstock, Crocs, UGG, Dr. Martens (404).
- Solereview, Believe in the Run, Doctors of Running, RoadTrailRun, Sneaker News, Complex: searches returned no brand-level sizing page of theirs; Doctors of Running's general fit article was saved but gives no brand figure. Nordstrom size-charts page saved but holds no table. Running Warehouse's fit guide holds only tips (its charts are not text).
- Bergfreunde Dr. Martens chart: saved (200) but not parsed for lack of budget; named in a search summary as printing EU 39 / US 7 at 25 cm.

## Pages opened and what each gave
"""

GAVE = {
    "runrepeat": "narrative claims + cross-brand mm table -> leads.csv, charts.csv",
    "scheels_": "brand chart -> charts.csv; notes -> leads.csv (where a table existed)",
    "sportsshoes_": "footwear tables -> charts.csv (where found)",
    "outsole_": "brand chart (CM) -> charts.csv; fit text -> leads.csv",
    "sizely_": "foot-length converter tables -> charts.csv; claims -> leads.csv",
    "zappos_review": "customer fit counts -> zappos_fit.csv and leads.csv",
    "zappos_search": "product ids for the review pages",
    "looksize_": "compiled brand chart -> charts.csv (Dr. Martens, Clarks); Crocs has no foot row",
    "footlockeruk_birkenstock": "chart (CM, Inches) -> charts.csv; claims -> leads.csv",
    "footlockeruk_": "empty shell page (soft 404), nothing",
}
rows = list(csv.DictReader(open(os.path.join(BASE, "fetchlog.csv"), encoding="utf-8")))
# zappos.py fetched without logging: list its saved files too
zfiles = sorted(f for f in os.listdir(os.path.join(BASE, "downloads")) if f.startswith(("zappos_search_", "zappos_review_")))
with open(os.path.join(BASE, "sources.md"), "w", encoding="utf-8") as f:
    f.write(PROFILES)
    f.write("\n| file | url | status | verdict | gave |\n|---|---|---|---|---|\n")
    for r in rows:
        g = ""
        for k, v in GAVE.items():
            if r["name"].startswith(k):
                g = v
                if k != "footlockeruk_":
                    break
        if r["name"] == "footlockeruk_birkenstock":
            g = GAVE["footlockeruk_birkenstock"]
        if r["verdict"] != "ok":
            g = "could not reach / not found" + (f" ({r['bot_markers']})" if r["bot_markers"] else "")
        f.write(f"| {r['name']} | {r['url']} | {r['status']} | {r['verdict']} | {g or 'claims read by extract.py; see leads.csv'} |\n")
    f.write("\nZappos pages fetched by scripts/zappos.py (status 200 unless its run printed ERR; none did):\n\n")
    for z in zfiles:
        f.write(f"- downloads/{z}\n")
print("sources.md written,", len(rows), "logged pages,", len(zfiles), "zappos files")
