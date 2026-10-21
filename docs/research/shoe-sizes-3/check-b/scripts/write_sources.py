"""Checker B: write sources.md, every page opened, its status, and what each saved file holds,
with RunRepeat's own words on how internal length is measured, each quote verified against the saved copy.

Usage: python -I write_sources.py <rows.csv> <fetch_log.csv> <parsed.csv> <downloads_dir> <out_sources.md>
"""
import csv
import os
import re
import sys
from collections import Counter
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding="utf-8")
rows_csv, log_csv, parsed_csv, down_dir, out_md = sys.argv[1:6]


class Visible(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript", "template"):
            self.skip += 1
        if tag in ("p", "div", "li", "tr", "br", "h1", "h2", "h3", "h4", "td", "th", "figcaption", "section"):
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "template") and self.skip:
            self.skip -= 1
        if tag in ("p", "div", "li", "tr", "h1", "h2", "h3", "h4", "td", "th", "figcaption", "section"):
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


def flat_text(path):
    v = Visible()
    v.feed(open(path, "rb").read().decode("utf-8", errors="replace"))
    return re.sub(r"\s+", " ", "".join(v.parts))


rows = list(csv.DictReader(open(rows_csv, newline="", encoding="utf-8-sig")))
log = list(csv.DictReader(open(log_csv, newline="", encoding="utf-8")))
parsed = {r["file"]: r for r in csv.DictReader(open(parsed_csv, newline="", encoding="utf-8"))}

OTHER = {
    "guides__how-to-measure-shoe-size.html": "RunRepeat guide 'how to measure shoe size': the sentence of B-C001 and B-S005 (255 to 281 mm over 1000+ shoes in the same US size 9), the figure caption of B-C002 (three ASICS shoes, men's US 9), the TIP paragraph of B-C003 (Mondopoint/CM/CH/JP sizes are the insole or internal length, at least 5 mm over the foot), and the gel-mold width passage (850+ molds in a men's US size 9).",
    "size-charts__adidas.html": "RunRepeat's adidas size-chart page: the sentence of B-C004 (adidas internal lengths in men's US size 9 from 260.1 mm to 280.4 mm).",
    "size-charts__converse.html": "RunRepeat's Converse size-chart page: the sentence of B-C005 (Chuck 70 toebox 8-10 mm narrower in the big toe area) and of B-S004 (gel molds; cut open to measure the internal length with a caliper).",
    "size-charts__timberland.html": "RunRepeat's Timberland size-chart page: the sentence of B-C006 (some models run shorter or longer than the expected internal length) and 'we measure the internal length as well as the toebox dimensions of each model in our lab'.",
    "testing-methodology.html": "RunRepeat's testing methodology: 'We always test in men's US 9' and the buying rule (B-S001), the lab conditions (B-S002), the stack-height passage with the 12% and 75% marks (B-S003), the cut-in-half procedure, and the weight rule (men's US size 9, calculated from a US 8 or 8½ where US 9 cannot be had).",
}

ids_by_url = {}
for r in rows:
    ids_by_url.setdefault(r["url"], []).append(r["id"])

QUOTES = [
    ("https://runrepeat.com/testing-methodology", "testing-methodology.html", [
        "Shoes come in pairs. One shoe we keep whole. The other one we tear apart by first cutting its upper so that it's completely detached from the bottom and then using a band saw to cut the midsole in half lengthwise. We do this because some tests need a shoe to be cut in half for them to be properly done.",
        "The black lines visible on the midsole mark 12% and 75% of the shoe's internal length, which is exactly where we measure the heel and forefoot stack height and where we test the energy return and shock absorption.",
        "Heel stack height is measured at 12% of the shoe’s internal length.",
        "Forefoot stack height is measured at 75% of the shoe’s internal length.",
        "To achieve this, the shoe must be cut in half. After measuring the internal length, we mark both places on the foam itself at 12% and 75% of the length. You can see the straight lines in our images, it’s where we pressed our caliper to measure the heel stack height and forefoot stack height.",
        "To make our data consistent, we measure every shoe’s weight in a men’s US 9. That’s because it is the most common shoe size and brands often provide shoe weight in this particular size.",
        "However, in the rare cases where we cannot get US 9, we buy US 8 or 8½ and use a proprietary formula to calculate for US 9.",
        "We now pour a proprietary liquid into each shoe and put it in the fridge for 2 hours to retrieve a gel mold of the interiors.",
    ]),
    ("https://runrepeat.com/size-charts/converse", "size-charts__converse.html", [
        "We create gel molds of each shoe's interior to measure its widest area, toebox width, and height, and even cut it open to measure the internal length with a caliper.",
    ]),
    ("https://runrepeat.com/size-charts/timberland", "size-charts__timberland.html", [
        "To help you know exactly what kind of fit to expect from a given Timbs pair, we measure the internal length as well as the toebox dimensions of each model in our lab.",
    ]),
    ("https://runrepeat.com/guides/how-to-measure-shoe-size", "guides__how-to-measure-shoe-size.html", [
        "Having measured 850+ shoe molds in a men's US size 9 (Medium D width), we found that the average width comes in at 94.4 mm, but the range goes from 86.2 mm to 102.4 mm!",
    ]),
    ("https://runrepeat.com/brooks-ghost-16", "brooks-ghost-16.html", [
        "Note: Our testing shows that internal length is not a great measure of fit. But, as many users have requested this specific test, we've decided to add it for those interested.",
    ]),
    ("https://runrepeat.com/timberland-euro-hiker", "timberland-euro-hiker.html", [
        "In a men's US size 7.5, we measured the internal length of the boot at 257.9 mm.",
    ]),
]

# the lab section's shape across the review pages: its text with the model's label and the numbers taken out
templates = Counter()
compared = Counter()
for f, p in parsed.items():
    st = p["section_text"]
    if not st:
        continue
    t = st
    lab = p["section_pairs"].split("=")[0]
    if lab:
        t = t.replace(lab, "<model>")
    t = re.sub(r"\[alt: [^\]]*Internal length[^\]]*\]", "[an image whose alt text is the brand, the model, and 'Internal length']", t)
    t = re.sub(r"Compared to ([\d,]+) [a-z ]+?(?= / Number of shoes)", r"Compared to \1 <the shoe's category>", t)
    t = re.sub(r"\d[\d,.]*", "#", t)
    templates[t] += 1
    m = re.search(r"Compared to ([\d,]+) (.+?) / Number of shoes / ([\d.]+ mm) / Internal length / ([\d.]+ mm)", st)
    if m:
        compared[m.group(2)] += 1

L = []
L.append("# Checker B: sources opened (RunRepeat), 2026-10-21\n")
L.append("Checker B of the sources pass (docs/research/shoe-sizes-3), wave 2: every row of wave2-check-b.csv (168 measurements, 8 claims, 5 method statements) read against RunRepeat's own pages.\n")
L.append("**How the pages were read.** Every distinct page in the file (173) downloaded once by `scripts/fetch_pages.py` (Python urllib, User-Agent `bigsmall-research-script/1.0 (checker; shoe-size fact check)`, no cookies, no personal data, nothing posted, a 1.2 s pause between requests), saved in `downloads/` and logged in `fetch_log.csv`; read by `scripts/parse_measurements.py` (the lab section `<section id=\"internal-length\">` and the comparison table's `Internal length` row, the size mentions, members-only wording), `scripts/check_claims.py` (each claim's words in the page's visible text, character for character and folded), and `scripts/assemble.py` (check.csv). Every reader run with `python -I`. The worker's files were not opened.\n")
st = Counter(r["status"] for r in log)
redirects = sum(1 for r in log if r["final_url"] and r["final_url"] != r["url"])
L.append(f"**Statuses.** {len(log)} pages: " + ", ".join(f"{n} answered {k}" for k, n in st.items()) + f"; {redirects} redirected. No bot check, CAPTCHA, login wall, or paywall met; the harness's fetcher was not needed (every page answered the script).\n")
L.append("**Members-only.** No page marks a figure members-only. A search of every saved page's visible text for members-only, unlock, sign-in-to-see, paywall, premium-member, and subscribers-only wording found none, and the internal-length section's markup carries no lock, blur, member, premium, paywall, or restricted word on any of the 167 lab-layout pages. A looser first search's hits were shoe descriptions ('this premium price point', 'a highly secure and locked-in feel') and the page's newsletter and price-alert state in its script data ('subscribedMessage', 'subscriptions').\n")
L.append("## RunRepeat's words on how internal length is measured, beyond the recorded statements\n")
L.append("Each quote below was found in the saved copy by `write_sources.py` (spaces collapsed only); a quote it could not find would say NOT FOUND.\n")
for url, fn, qs in QUOTES:
    ft = flat_text(os.path.join(down_dir, fn))
    L.append(f"- {url}")
    for q in qs:
        ok = re.sub(r"\s+", " ", q) in ft
        L.append(f"  - \"{q}\"" + ("" if ok else " **(NOT FOUND in the saved copy)**"))
L.append("")
# every other sentence on the 168 review pages that speaks of internal length (the section's note and labels left out)
NOTE = ("Our testing shows that internal length is not a great measure of fit", "as many users have requested this specific test")
il = Counter()
il_pages = {}
for f in parsed:
    ft = flat_text(os.path.join(down_dir, f))
    for s in re.split(r"(?<=[.!?])\s+(?=[A-Z\[])", ft):
        # the lab section's figures and axis, and the comparison table's row, are not sentences: left out
        s = re.sub(r"Number of shoes [\d.,]+ mm Internal length [\d.,]+ mm", " ", s)
        s = re.sub(r"Internal length [\d.,]+ mm [\d.,]+ mm", " ", s)
        if re.search(r"internal length|internal shoe length|insole length", s, re.I) and not any(n in s for n in NOTE):
            s2 = re.sub(r"\s+", " ", s).strip()
            if len(s2) > 200:
                i = s2.lower().find("internal")
                s2 = "…" + s2[max(0, i - 120): i + 160] + "…"
            il[s2] += 1
            il_pages.setdefault(s2, []).append(f)
L.append(f"Other sentences on the 168 review pages that speak of internal length, besides the section's note ({len(il)} distinct):\n")
for s, n in il.most_common():
    L.append(f"- {n} page(s) ({', '.join(il_pages[s][:3])}{'…' if n > 3 else ''}): \"{s}\"")
L.append("")
print("other internal-length sentences on review pages:", len(il))
for s, n in il.most_common():
    print(" ", n, s[:330])
L.append("What the pages do not say: none of them describes the internal-length measurement itself (where the caliper meets the shoe, heel to toe on which surface, how many readings); the methodology page has no internal-length test of its own, only the stack-height passage that measures the internal length first and marks 12% and 75% of it, and it gives the US 8 or 8½ conversion for weight alone. The review pages' lab section prints the figure, the average, and a distribution, with no method text beyond the note; on 76 of the 167 lab-layout pages it also carries an image whose alt text is the brand, the model, and 'Internal length' (likely a photograph of the measurement; the images were not read). On 26 of the 168 review pages the page's own text names the size of the tested pair (25 at US 9, 21 of them only in a weight sentence; the Euro Hiker at men's US size 7.5, in its internal-length sentence); on the other 142 the size rests on the methodology page (check.csv, each row's note).\n")
L.append(f"The lab section's text has {len(templates)} shape(s) across the 167 lab-layout review pages once the model's label and the numbers are taken out:\n")
for t, n in templates.most_common():
    L.append(f"- {n} pages: `{t}`")
L.append("")
L.append("The distribution each section compares the shoe with: " + "; ".join(f"'{k}' on {n} pages" for k, n in compared.most_common()) + ".\n")
L.append("## Every page opened\n")
L.append("| # | URL | rows | status | bytes | saved file | what it holds |")
L.append("|---|---|---|---|---|---|---|")
for i, r in enumerate(log, 1):
    fn = r["file"]
    if fn in OTHER:
        what = OTHER[fn]
    else:
        p = parsed.get(fn, {})
        if p.get("section_value"):
            m = re.search(r"Compared to ([\d,]+) (.+?) / Number of shoes / ([\d.]+ mm) / Internal length / ([\d.]+ mm)", p["section_text"])
            dist = f"; compared to {m.group(1)} {m.group(2)}, axis {m.group(3)} to {m.group(4)}" if m else ""
            what = f"RunRepeat lab review, {p['brand']} {p['model']}: lab section 'Internal length', Test results {p['section_value']} (Average {p['section_avg']}{dist}); comparison table row 'Internal length' {p['table_value']} (column '{p['table_header'].split(' | ')[1] if ' | ' in p['table_header'] else ''}')."
        elif p.get("prose_values"):
            what = f"RunRepeat review, older layout, {p['brand']} {p['model']}: no lab section or comparison table; internal length in prose: '{p['prose_sentences'].split(' || ')[0]}'"
        else:
            what = "no internal length found"
        if fn == "brooks-ghost-16.html":
            what += " Also the note of B-C007."
        if fn == "timberland-euro-hiker.html":
            what += " Also the sentence of B-C008."
    L.append(f"| {i} | {r['url']} | {r['row_ids'].replace(',', ', ')} | {r['status']} | {r['bytes']} | downloads/{fn} | {what} |")
L.append("")
L.append("## Files of this check\n")
for f, d in [
    ("check.csv", "one row per row of wave2-check-b.csv: id, result, found_value, exact_words, url_or_file, tool, date_checked, note"),
    ("sources.md", "this file"),
    ("fetch_log.csv", "each page's URL, rows, saved file, HTTP status, bytes, final URL, content type, time fetched (UTC)"),
    ("fetch_run1.txt", "the download run's console log"),
    ("parsed.csv", "per measurement page: the lab section's Test results rows, the comparison table's header and Internal length row, size mentions, members-only hits, the section's text, prose sentences"),
    ("sizes.txt", "every size mention in the review pages' visible text, with its context"),
    ("claims_found.csv", "per claim and method statement: each part of the recorded words found or not, where, the page's own line, the character-for-character test"),
    ("claims_decisions.json", "the result, the page's own sentence, and the note for each claim and method statement, read from check_claims.py's output"),
    ("method_contexts.txt", "every line of the claim pages that speaks of internal length, insole length, calipers, cutting, or molds"),
    ("downloads/", "the 173 saved pages"),
    ("scripts/", "read_rows.py, fetch_pages.py, inspect_page.py, parse_measurements.py, check_claims.py, assemble.py, write_sources.py, urls.tsv"),
]:
    L.append(f"- `{f}`: {d}")
open(out_md, "w", encoding="utf-8").write("\n".join(L) + "\n")
print("templates:", len(templates))
for t, n in templates.most_common():
    print(n, t[:400])
print("compared:", compared.most_common())
print("quotes NOT FOUND:", sum(1 for l in L if "NOT FOUND in the saved copy" in l))
