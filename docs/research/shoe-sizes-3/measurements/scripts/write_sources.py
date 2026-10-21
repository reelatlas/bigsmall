"""Append the late claims and leads, then write sources.md: the source profiles first, then
every page opened (from pages_log.csv) and what it gave. Run after build_leads_claims.py."""
import csv, html, os, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def text(p):
    t = open(p, encoding="utf-8", errors="replace").read()
    t = re.sub(r"<script.*?</script>", " ", t, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    return html.unescape(re.sub(r"\s+", " ", t))


# late claim, verified against the saved copy
w8 = ("Provided that there should be a few millimeters of extra space between your toes and the edge "
      "of the shoe, the Euro Hiker runs true to the Timberland footwear size chart.")
ok = w8 in text(os.path.join(BASE, "downloads", "rr", "timberland-euro-hiker.html"))
claims = list(csv.reader(open(os.path.join(BASE, "claims.csv"), encoding="utf-8")))
if not any("Euro Hiker" in c[3] for c in claims[1:]):
    claims.append([str(len(claims)), "RunRepeat", "Timberland",
                   "Euro Hiker (internal length 257.9 mm at men's US 7.5) runs true to Timberland's chart",
                   w8, "https://runrepeat.com/timberland-euro-hiker", "2026-10-21" + ("" if ok else " (NOT FOUND)")])
    csv.writer(open(os.path.join(BASE, "claims.csv"), "w", newline="", encoding="utf-8")).writerows(claims)

leads = list(csv.reader(open(os.path.join(BASE, "leads.csv"), encoding="utf-8")))
extra = [
    ["(all)", "SATRA", "SATRA STD 225 internal shoe size gauge (inserted to the toe, slider to the heel; mm version STD 225M): a method for in-shoe length, no figures", "https://satra.com/test_equipment/machine.php?id=31", "2026-10-21"],
    ["(all)", "ISO (record on sidalc.net)", "'Footwear sizing. In-shoe measurement. Part 1: Shoe length' (ISO/TS 19408-1 by its title): the standard method for a shoe's inside length; not opened", "https://sidalc.net/search/Record/unfao:856987", "2026-10-21"],
    ["(all)", "RunRepeat", "World Athletics named as the base standard for RunRepeat's internal length, with RunRepeat's modifications", "https://runrepeat.com/footwear-testing-services", "2026-10-21"],
]
for e in extra:
    if e not in leads:
        leads.append(e)
csv.writer(open(os.path.join(BASE, "leads.csv"), "w", newline="", encoding="utf-8")).writerows(leads)

log = list(csv.reader(open(os.path.join(BASE, "pages_log.csv"), encoding="utf-8")))[1:]
seen, uniq = set(), []
for u, st, gave in log:
    if (u, gave) in seen:
        continue
    seen.add((u, gave))
    uniq.append((u, st, gave))

P = """# Sources: measured inside length of shoes, by model (worker: measurements, 2026-10-21)

All pages read 2026-10-21. Tool: a Python script (urllib, User-Agent "bigsmall-research-script/1.0"),
reading the saved HTML; no row comes from the harness's fetcher.

## 1. RunRepeat lab (runrepeat.com) - counted

- **Publisher:** RunRepeat, a shoe-review site with its own lab that buys shoes, cuts them in half and
  measures them ("Cut in half: <model> Review" pages).
- **What it measures and how it names it:** "Internal length", in mm to 0.1, shown on each lab review
  under "Size and fit" as "Test results <model> <x> mm Average <y> mm" beside the lab's average and a
  distribution over the category; the same figure appears again in the page's comparison table
  ("Size and fit Size ... Internal length <x> mm <y> mm"). The script read both and they agreed for
  every row that has both (164 of 164; 3 pages lack the table).
- **Method, in its own words:**
  - Methodology page (https://runrepeat.com/testing-methodology): "We always test in men's US 9";
    "We buy the shoes in men's US 9. If not available in that size, we wait until it is.";
    "Conditions are always 20°C/68°F ± 1°C and 55% ± 5% humidity, in both our lab and storage";
    on stack heights: "After measuring the internal length, we mark both places on the foam itself at
    12% and 75% of the length" (the internal length is measured on the shoe cut in half lengthwise:
    "The other one we tear apart by first cutting its upper so that it's completely detached from the
    bottom and then using a band saw to cut the midsole in half lengthwise.").
  - Testing services page (https://runrepeat.com/footwear-testing-services): "Stack heights, drop and
    internal length: World Athletics" (listed among "the base standards that we follow, though with
    modifications").
  - Converse size-chart page (https://runrepeat.com/size-charts/converse): "We create gel molds of each
    shoe's interior to measure its widest area, toebox width, and height, and even cut it open to
    measure the internal length with a caliper."
  - Salomon size-chart page (https://runrepeat.com/size-charts/salomon): "We use a caliper to
    meticulously measure the internal length and toebox dimensions of each shoe and boot to let you
    know what kind of fit to expect."
  - Each review's own note: "Our testing shows that internal length is not a great measure of fit.
    But, as many users have requested this specific test, we've decided to add it for those interested."
- **The size measured:** men's US 9 for every shoe by the methodology page; 23 of the review pages
  also name men's US 9 in their own text (weight, toebox or tennis sections), none names another
  size beside a recorded figure; one old-format review states its own size in the sentence that gives
  the figure (Timberland Euro Hiker, men's US 7.5: "In a men's US size 7.5, we measured the internal
  length of the boot at 257.9 mm."). The pages do not say whether a women's-only model is measured in
  a women's size; every model recorded is sold in men's sizes.
- **Pairs and variance:** one pair per model (one shoe kept whole, the other cut); no repeat
  measurements or variance stated. The heel and toe reference points and whether the insole is in
  place are not stated beyond "cut it open to measure the internal length with a caliper".
- **Coverage:** running, trail, hiking, tennis, basketball, training and sneaker pages exist; the
  internal-length result appears only on reviews tested under the newer methodology (older reviews
  carry the test's name in their data but no result). No lab reviews at all for Clarks, Dr. Martens,
  Birkenstock, UGG or Crocs (catalog and guessed product URLs 404); Timberland's only review with a
  figure is the old-format Euro Hiker.
- **Its size-chart pages** (runrepeat.com/size-charts/<brand>) carry copies of the brands' charts and
  cross-brand "Shoe length (mm)" comparison tables built from the brands' charts: copies, no cell
  recorded. Only their sentences about the lab's measurements were taken (claims.csv).

## 2. RTINGS (rtings.com/running-shoes) - could not reach (paywall), nothing recorded

- **Publisher:** RTINGS, a product-testing site; running shoes since 2025 ("Test Bench" versions
  0.8 to 0.16).
- **What it measures:** "Internal Length", with "Internal Heel Width" and "Internal Forefoot Width",
  in an "Internal Shape" group with a "3D Model Internal" (its 3D compare tool says the shoes were
  "bought & scanned using the ARTEC Space Spider 3D scanner", per a search summary). Each full review
  states its tested size, e.g. "We bought and tested the Brooks Glycerin Flex in men's US size 9, as
  noted on the label for our pair."; database-only pages name the reviewed SKU ("Men - US 9").
- **Why not recorded:** the field is marked insider_only, the value sits in an element of class
  "ld-paywall" and the page's JSON-LD says "isAccessibleForFree": "False". The HTML served to an
  anonymous request carries the numbers for search engines, but the publisher marks them paywalled;
  reading them would bypass the paywall. 79 rows first written by the script were deleted with the
  saved review pages; pages_log.csv lists each URL as paywalled. A member's or licensed read is the
  lead (leads.csv). No step-by-step method for the internal length was found on its free pages
  (how-we-test, changelogs 0-8 to 0-16 read).

## 3. Screened and set aside

- **Sportano** (sportano.com product pages): a Converse "AB Insole length (cm)" table by EU size, the
  same on every Converse product, with instructions for measuring your own insole; no statement that
  Sportano measured: a brand-level chart, a copy. No cell recorded.
- **Scheels, Footshop**: Dr. Martens charts with an insole column (search summaries; charts; leads).
- **Volumental / 3DBODY.TECH 2021 abstract; 3DBODY.TECH 2011 paper; SATRA STD 225; ISO/TS 19408-1;
  CN103504723B patent**: methods or population findings, no per-model figures (leads.csv).
- **Zappos, Walmart, Birkenstock regional sites, Skechers regional sites**: brand charts or customer
  reviews seen in search summaries; reviews' words are leads only, none opened as a source.
- Searches in English, Japanese and Chinese for any other publisher of a measured inside length per
  model (a retailer that measures, a running magazine's lab, a fit-technology company's data) found
  none beyond RunRepeat and RTINGS.

## 4. Every page opened, and what it gave

| URL | status | gave |
| --- | --- | --- |
"""
for u, st, gave in uniq:
    P += f"| {u} | {st} | {gave.replace('|', '/')} |\n"
P += """
Also opened, outside the scripts' log: https://runrepeat.com/brooks-ghost-16 (first probe, curl);
https://runrepeat.com/testing-methodology; https://runrepeat.com/footwear-testing-services;
https://runrepeat.com/guides/how-to-measure-shoe-size;
https://runrepeat.com/guides/why-cutting-running-shoes-in-half-is-key-to-measuring-midsole-softness
(no internal-length method in it); https://runrepeat.com/sitemap.xml (redirects to a 404 index);
https://www.rtings.com/running-shoes/learn/how-we-test and changelogs 0-8, 0-10, 0-14, 0-15, 0-16 (free
pages, no internal-length method); https://www.rtings.com/early-access/running-shoes/reviews/r-a-d/mallow
(paywalled value, deleted); https://www.rtings.com/running-shoes/reviews (index) and
https://www.rtings.com/sitemap.xml (for the URL list); four guessed RTINGS test-article URLs (404);
https://sportano.com/p/327631/converse-chuck-taylor-all-star-ox-light-twine-white-black-trainers
(a chart, set aside).
"""
open(os.path.join(BASE, "sources.md"), "w", encoding="utf-8").write(P)
print("sources.md written,", len(uniq), "log rows")
