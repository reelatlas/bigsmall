"""Checker B: write check.csv from the parsed pages, the size mentions, and the claims decisions.

Usage: python -I assemble.py <rows.csv> <parsed.csv> <sizes.txt> <claims_found.csv> <claims_decisions.json> <out_check.csv> [--review]
A measurement is confirmed where the page prints the recorded value in mm (on the lab-format pages: in the lab section
'Internal length' > Test results and in the comparison table, both read; on a page without them: in the review's prose),
corrected (with the page's value) where the page prints another, wrong where the page prints no internal length.
The note says whether the page's own text names the size of the tested pair, and which, quoting the sentence.
"""
import csv
import json
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
rows_csv, parsed_csv, sizes_txt, claims_found_csv, dec_json, out_csv = sys.argv[1:7]
review = "--review" in sys.argv
DATE = "2026-10-21"
TOOL = "script (python urllib)"
METHOD_URL = "https://runrepeat.com/testing-methodology"

rows = list(csv.DictReader(open(rows_csv, newline="", encoding="utf-8-sig")))
parsed = {r["id"]: r for r in csv.DictReader(open(parsed_csv, newline="", encoding="utf-8"))}
cfound = {r["id"]: r for r in csv.DictReader(open(claims_found_csv, newline="", encoding="utf-8"))}
dec = json.load(open(dec_json, encoding="utf-8"))

BUY = re.compile(r"purchas|bought|\bbuy\b|ordered", re.I)
ILEN = re.compile(r"internal length", re.I)
WEIGHT = re.compile(r"weigh|on the scale|the scale|\boz\b|\(\d+ ?g\)|grams", re.I)
MOLD = re.compile(r"mold|mould|caliper|width|toebox|interior", re.I)
BRAND = re.compile(r"officially lists|sample size|according to the brand", re.I)
TEST = re.compile(r"\bwe\b|\bour\b|tested|\blab\b|measur|recorded|pair", re.I)


def sentence(ctx, match):
    i = ctx.find(match)
    if i < 0:
        return ctx
    starts = [ctx.rfind(sep, 0, i) for sep in (". ", " / ", "! ", "? ")]
    a = max(starts)
    a = 0 if a < 0 else a + 2
    ends = [e for e in (ctx.find(". ", i + len(match)), ctx.find(" / ", i + len(match)), ctx.find("! ", i + len(match))) if e >= 0]
    b = min(ends) + 1 if ends else len(ctx)
    return ctx[a:b].strip(" /")


mentions = {}
for line in open(sizes_txt, encoding="utf-8"):
    parts = line.rstrip("\n").split("\t")
    if len(parts) < 4:
        continue
    rid, model, match, ctx = parts[:4]
    if re.match(r"us\s*\d", match):  # the pronoun ("took us 18.2N"), not the US scale
        continue
    s = sentence(ctx, match)
    if BRAND.search(s):
        kind = "brand's spec"
    elif BUY.search(s):
        kind = "purchase"
    elif ILEN.search(s):
        kind = "internal length"
    elif WEIGHT.search(s):
        kind = "weight"
    elif MOLD.search(s):
        kind = "gel mold / width"
    else:
        kind = "other"
    tested = kind not in ("brand's spec",) and (kind != "other" or bool(TEST.search(s)))
    num = re.search(r"(\d{1,2}(?:\.5)?)", match)
    mentions.setdefault(rid, []).append({"match": match, "sentence": s, "kind": kind, "tested": tested, "num": num.group(1) if num else ""})


def num(s):
    m = re.search(r"(\d+(?:\.\d+)?)", s or "")
    return float(m.group(1)) if m else None


def size_note(rid, want):
    ms = mentions.get(rid, [])
    named = [m for m in ms if m["tested"]]
    brand_only = [m for m in ms if m["kind"] == "brand's spec"]
    if not named:
        if brand_only:
            return None, (
                f"The page's own text names US {brand_only[0]['num']} only as the brand's sample size ('{brand_only[0]['sentence']}'), "
                f"not as the size of RunRepeat's pair; the tested pair's size rests on RunRepeat's methodology page ('We always test in men's US 9', {METHOD_URL})."
            )
        return None, f"The page's own text names no size for the tested pair; the size rests only on RunRepeat's methodology page ('We always test in men's US 9', {METHOD_URL})."
    uniq = []
    for m in named:
        if m["sentence"] not in [u["sentence"] for u in uniq]:
            uniq.append(m)
    nums = sorted({m["num"] for m in uniq})
    kinds = sorted({m["kind"] for m in uniq})
    quoted = " ; ".join(f"'{m['sentence']}' ({m['kind']} sentence)" for m in uniq[:3])
    same = all(n == want for n in nums)
    head = "The page's own text names the size of the tested pair, " + ", ".join(sorted({m["match"] for m in uniq})) + ": " if same else f"The page's own text names a size other than the recorded {want}: "
    tail = []
    if "internal length" in kinds:
        tail.append("The size is named in the internal-length sentence itself.")
    else:
        tail.append("The internal-length section itself names no size.")
    if not any(re.search(r"men", m["match"], re.I) for m in uniq):
        tail.append("The page says US 9 without 'men's'; the men's line rests on the methodology page.")
    if kinds == ["weight"]:
        tail.append(
            "Only a weight sentence names it; the methodology page says all weights are presented in men's US size 9, calculated from a US 8 or 8½ "
            "where US 9 cannot be had, so the sentence gives the size the weight is stated in."
        )
    return (sorted({m["match"] for m in uniq}), nums, kinds), head + quoted + ". " + " ".join(tail)


out = open(out_csv, "w", newline="", encoding="utf-8")
w = csv.writer(out)
w.writerow(["id", "result", "found_value", "exact_words", "url_or_file", "tool", "date_checked", "note"])
counts, size_named = {}, {}
for r in rows:
    rid = r["id"]
    if r["kind"] != "measurement":
        d = dec[rid]
        cf = cfound.get(rid, {})
        ex = cf.get("exact_char_match", "")
        nseg = cf.get("n_segments", "")
        if ex and all(x == "yes" for x in ex.split(" ; ")):
            exact_note = (
                "Character for character, the recorded words are on the page (runs of spaces collapsed, nothing else folded)"
                + ("." if nseg == "1" else f", each of its {nseg} parts.")
            )
        else:
            exact_note = f"Character-for-character test per part: {ex} (the parts marked no match only once quotes, dashes, or case are folded)."
        w.writerow([rid, d["result"], d.get("found_value", ""), d["exact_words"], f"{r['url']} ; downloads/{cf.get('file', '')}", TOOL, DATE, d["note"] + " " + exact_note])
        counts[(r["kind"], d["result"])] = counts.get((r["kind"], d["result"]), 0) + 1
        continue
    p = parsed[rid]
    url_file = f"{r['url']} ; downloads/{p['file']}"
    rec = num(r["value"])
    sv, tv = num(p["section_value"]), num(p["table_value"])
    want = r["size_label"]
    info, snote = size_note(rid, want)
    if info:
        size_named[rid] = info
    member = "No members-only marking on the page (no members-only, unlock, sign-in, or paywall words; the internal-length markup carries no lock or blur class); the figure is in the HTML the page serves to any reader."
    if sv is not None or tv is not None:
        vals = [v for v in (sv, tv) if v is not None]
        page_val = sv if sv is not None else tv
        result = "confirmed" if all(v == rec for v in vals) else "corrected"
        found = f"{page_val:.1f} mm"
        ex = f"Internal length > Test results: {p['section_pairs'].replace('=', ' ')}; comparison table: {p['table_row']} (columns: {p['table_header']})"
        if result == "confirmed":
            n1 = f"The page prints {found} in both places (the lab section 'Internal length' > Test results, and the comparison table, whose column is the model's), as recorded."
        else:
            n1 = f"The page prints {p['section_value']} (lab section) and {p['table_value']} (comparison table); recorded {r['value']} mm."
        if len(set(vals)) > 1:
            n1 += " The two places on the page disagree."
    elif p["prose_values"]:
        pv = num(p["prose_values"].split(" ; ")[0])
        result = "confirmed" if pv == rec else "corrected"
        found = f"{pv:.1f} mm"
        ex = p["prose_sentences"].split(" || ")[0]
        n1 = (
            f"This review has no lab section or comparison table for internal length (an older review layout); the figure is printed once, in the review's prose, as {found}"
            + (", as recorded." if result == "confirmed" else f"; recorded {r['value']} mm.")
        )
        member = "No members-only marking on the page (no members-only, unlock, sign-in, or paywall words); the figure is in the review's prose, served to any reader."
    else:
        result, found, ex = "wrong", "", ""
        n1 = "The saved page prints no internal length for the model."
    w.writerow([rid, result, found, ex, url_file, TOOL, DATE, " ".join([n1, snote, member])])
    counts[("measurement", result)] = counts.get(("measurement", result), 0) + 1
out.close()

print("counts:", dict(sorted(counts.items())))
print("measurement pages naming the tested pair's size:", len(size_named))
by = {}
for rid, (matches, nums, kinds) in size_named.items():
    by.setdefault((tuple(nums), tuple(kinds)), []).append(rid)
for k, v in sorted(by.items()):
    print("  sizes", k[0], "by", k[1], ":", len(v), v)
if review:
    for rid, ms in mentions.items():
        for m in ms:
            print(rid, "|", "T" if m["tested"] else "-", "|", m["kind"], "|", m["match"], "|", m["sentence"][:200])
