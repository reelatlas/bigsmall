"""Build measurements.csv from the transcribed RTINGS results-table rows (twenty brands only)."""
import csv, re, sys
from pathlib import Path

OUT = Path(sys.argv[1])
rows_file = OUT / "pages" / "results-table-rows.txt"
TABLE_URL = ("https://www.rtings.com/running-shoes/tools/table?c=general:product,general:test_bench,"
             "test:26247,test:26249,test:26248&f=general:test_bench=recent&o=usage:32330=desc&s=normal")

# brand prefix as the table names it -> brand as bigsmall names it
BRANDS = [("New Balance", "New Balance"), ("Under Armour", "Under Armour"), ("Dr. Martens", "Dr. Martens"),
          ("adidas", "adidas"), ("Nike", "Nike"), ("PUMA", "Puma"), ("ASICS", "Asics"), ("Converse", "Converse"),
          ("Vans", "Vans"), ("Skechers", "Skechers"), ("Reebok", "Reebok"), ("Clarks", "Clarks"),
          ("Birkenstock", "Birkenstock"), ("Timberland", "Timberland"), ("UGG", "UGG"), ("Crocs", "Crocs"),
          ("HOKA", "HOKA"), ("On", "On"), ("Brooks", "Brooks"), ("Salomon", "Salomon")]

# shoes the Test Bench 0.10 changelog lists as reviewed before it and retested (twenty brands' ones matter)
TB010 = set("""361 Flame 4|adidas Adizero Adios 9|adidas Adizero Adios Pro 3|adidas Adizero Adios Pro 4|adidas Adizero Adios Pro Evo 1|adidas Adizero Adios Pro Evo 2|adidas Adizero Boston 12|adidas Adizero Boston 13|adidas Adizero Evo SL|adidas Adizero Prime X 2.0 STRUNG|adidas Adizero Prime X3 STRUNG|adidas Supernova Rise|adidas Ultraboost 5X|ASICS GEL-KAYANO 31|ASICS GEL-KAYANO 32|ASICS GEL-NIMBUS 26|ASICS GEL-NIMBUS 27|ASICS GEL-NIMBUS 28|ASICS GLIDERIDE MAX|ASICS GLIDERIDE MAX 2|ASICS GT-2000 13|ASICS GT-2000 14|ASICS MAGIC SPEED 4|ASICS MAGIC SPEED 5|ASICS MEGABLAST|ASICS METASPEED EDGE PARIS|ASICS METASPEED EDGE TOKYO|ASICS METASPEED RAY|ASICS METASPEED SKY PARIS|ASICS METASPEED SKY TOKYO|ASICS NOVABLAST 4|ASICS NOVABLAST 5|ASICS SONICBLAST|ASICS SUPERBLAST 2|Brooks Adrenaline GTS 23|Brooks Adrenaline GTS 24|Brooks Adrenaline GTS 25|Brooks Ghost 16|Brooks Ghost 17|Brooks Glycerin 22|Brooks Glycerin Max|Brooks Glycerin Max 2|Brooks Hyperion 2|Brooks Hyperion 3|Brooks Hyperion Elite 5|Brooks Hyperion Max 2|Brooks Hyperion Max 3|Brooks Launch 12|HOKA Bondi 9|HOKA Cielo X1 2.0|HOKA Cielo X1 3.0|HOKA Clifton 10|HOKA Clifton 9|HOKA Mach 6|HOKA Mach X 2|HOKA Mach X 3|HOKA Rocket X 3|HOKA Skyward X|New Balance 1080v15|New Balance Fresh Foam X 1080v14|New Balance Fresh Foam X 880v15|New Balance FuelCell Propel v5|New Balance FuelCell Rebel v4|New Balance FuelCell Rebel v5|New Balance FuelCell SuperComp Elite v4|New Balance FuelCell SuperComp Elite v5|New Balance FuelCell SuperComp Trainer v3|Nike Alphafly 3|Nike Downshifter 13|Nike Invincible 3|Nike Pegasus 41|Nike Pegasus Plus|Nike Pegasus Premium|Nike Revolution 8|Nike Streakfly 2|Nike Structure 26|Nike Vaporfly 3|Nike Vaporfly 4|Nike Vomero 17|Nike Vomero 18|Nike Vomero Plus|Nike Vomero Premium|Nike Winflo 11|Nike Zoom Fly 6|On Cloudboom Max|On Cloudboom Strike|On Cloudboom Zone|On Cloudmonster 2|On Cloudmonster Hyper|On Cloudrunner 2|On Cloudsurfer 2|On Cloudsurfer Max|PUMA Deviate NITRO 3|PUMA Deviate NITRO 4|PUMA Deviate NITRO Elite 3|PUMA Fast-R NITRO Elite 3|PUMA ForeverRUN NITRO 2|PUMA MagMax NITRO|PUMA MagMax NITRO 2|PUMA Magnify NITRO 3|PUMA Velocity NITRO 4|Salomon Aero Blaze 3|Salomon Aero Glide 3|Skechers Aero Tempo""".split("|"))

# shoe links the table rendered for rows read in its accessibility tree (read_page), 2026-10-21
LINKS = {
    "HOKA Mach 7": "/running-shoes/reviews/hoka/mach-7",
    "Nike Streakfly 2": "/running-shoes/reviews/nike/streakfly-2",
    "Nike Alphafly 4": "/running-shoes/reviews/nike/alphafly-4",
    "New Balance Ellipse": "/running-shoes/reviews/new-balance/ellipse",
    "New Balance Fresh Foam 520v9": "/running-shoes/reviews/new-balance/fresh-foam-520v9",
    "New Balance AC Runner": "/running-shoes/reviews/new-balance/ac-runner",
    "ASICS GEL-NIMBUS 28": "/running-shoes/reviews/asics/gel-nimbus-28",
    "Brooks Glycerin Max 2": "/running-shoes/reviews/brooks/glycerin-max-2-running-shoe",
    "New Balance FuelCell Rebel v5": "/running-shoes/reviews/new-balance/fuelcell-rebel-v5",
    "Nike Pegasus Premium": "/running-shoes/reviews/nike/pegasus-premium-running-shoe",
    "Nike Vomero Premium": "/running-shoes/reviews/nike/vomero-premium-running-shoe",
    "HOKA Clifton 10": "/running-shoes/reviews/hoka/clifton-10",
    "Nike Pegasus 41": "/running-shoes/reviews/nike/pegasus-41",
    "adidas Adizero Boston 13": "/running-shoes/reviews/adidas/adizero-boston-13",
}
# reviews opened (redirect targets as the browser showed them)
OPENED = {
    "Nike Streakfly": "/running-shoes/reviews/nike/streakfly-running-shoe",
    "Crocs Classic Clog": "/running-shoes/reviews/crocs/classic-clog-red",
    "Brooks Ghost Max 2": "/running-shoes/reviews/brooks/ghost-max-2-running-shoe",
}

def brand_of(name):
    for prefix, b in BRANDS:
        if name == prefix or name.startswith(prefix + " "):
            return prefix, b
    return None, None

val = re.compile(r"^(\d+) mm \((\d+(?:\.\d+)?)\"\)$")
out, total, per_brand = [], 0, {}
for line in rows_file.read_text(encoding="utf-8").splitlines():
    if not line or line.startswith("#"):
        continue
    total += 1
    name, _comments, bench, length, heel, fore = [c.strip() for c in line.split(" | ")]
    prefix, brand = brand_of(name)
    if not brand:
        continue
    model = name[len(prefix):].strip()
    per_brand.setdefault(brand, []).append(int(val.match(length).group(1)))
    link = LINKS.get(name) or OPENED.get(name)
    url = ("https://www.rtings.com" + link) if link else TABLE_URL
    base_notes = [f"test methodology {bench}"]
    if not link:
        base_notes.append("shoe link not captured (the table renders only visible rows' links); url is the table's")
    if name in TB010 or bench == "v0.8.2":
        base_notes.append("reviewed before Test Bench 0.10: RTINGS says some such shoes were measured on men's US 8 or 13 "
                          "(stated for the 3D fit scans); the size of this footbed measure not confirmed per shoe")
    if name == "Nike Pegasus 41":
        base_notes.append("review states: tested in men's US size 9, as noted on the label")
    if name == "New Balance SuperComp Rebel":
        base_notes.append("heel 93 mm and forefoot 64 mm as the table shows them; likely swapped at the source")
    if name == "Nike Streakfly":
        base_notes.append("heel 34 mm as shown; far below every other row")
    if name == "Crocs Classic Clog":
        base_notes.append("a clog listed in RTINGS' running-shoe table")
    for measure, cell, measured_as in (("internal length", length, "internal length: footbed from the heel's back to the toe box's end"),
                                       ("internal heel width", heel, "internal heel width: footbed width at 12% of the internal length"),
                                       ("internal forefoot width", fore, "internal forefoot width: footbed width at 75% of the internal length")):
        m = val.match(cell)
        out.append({
            "source": "RTINGS Running Shoe Results Table", "brand": brand, "model": model,
            "line": "not stated by the table (test size men's per methodology)",
            "size_label": "9", "size_scale": "US men's", "value": m.group(1), "unit": "mm",
            "measured_as": measured_as, "url": url, "date_read": "2026-10-21", "tool": "chrome (member)",
            "notes": f"{measure}; shown as '{cell}'; " + "; ".join(base_notes),
        })

with open(OUT / "measurements.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id", "source", "brand", "model", "line", "size_label", "size_scale",
                                      "value", "unit", "measured_as", "url", "date_read", "tool", "notes"])
    w.writeheader()
    for i, r in enumerate(out, 1):
        w.writerow({"id": f"rtm-{i:04d}", **r})

print("rows in table file:", total)
print("csv rows:", len(out), "shoes:", len(out) // 3)
for b in [b for _, b in BRANDS]:
    v = per_brand.get(b, [])
    print(f"{b}: {len(v)} shoes" + (f", {min(v)}-{max(v)} mm" if v else ""))
