# Checker A: recompute GOST R 57425-2017 (= ISO/TS 19407:2015) Table 2 from the standard's own formulas.
# UK adult = (lf + 2*su)/su - 25 ; EUR = (lf + 2*se)/se ; US men = UK + 1 ; US women = UK + 2
# Mondopoint rounded to 5 mm, the rest to the half size; each grading from its own column.
import sys, re, math, json
sys.stdout.reconfigure(encoding="utf-8")
txt = open(sys.argv[1], encoding="utf-8").read().splitlines()
start = next(i for i, l in enumerate(txt) if l.startswith("Т а б л и ц а 2"))
end = next(i for i, l in enumerate(txt) if l.startswith("Т а б л и ц а 3"))
num = re.compile(r"^\d+(,\d+)?$")
mondo, eur, uk = [], [], []
for l in txt[start:end]:
    t = l.split()
    if not t or not all(num.match(x) for x in t):
        continue
    v = [float(x.replace(",", ".")) for x in t]
    if len(v) == 15:
        mondo.append(v[0:5]); eur.append(v[5:10]); uk.append(v[10:15])
    elif len(v) == 10:
        eur.append(v[0:5]); uk.append(v[5:10])
    elif len(v) == 5:
        eur.append(v[0:5])
    else:
        print("UNPARSED", l)
print("rows: mondo", len(mondo), "eur", len(eur), "uk", len(uk))
# sanity: the grading columns step evenly
def steps(col, d):
    return all(abs(col[i+1] - col[i] - d) < 1e-9 for i in range(len(col)-1))
print("mondo grading 215..320 step 5:", [r[0] for r in mondo][0], [r[0] for r in mondo][-1], steps([r[0] for r in mondo], 5))
print("eur grading step 0.5:", eur[0][0], eur[-1][0], steps([r[0] for r in eur], 0.5))
print("uk grading step 0.5:", uk[0][0], uk[-1][0], steps([r[0] for r in uk], 0.5))
STEPS = {"rounded": (8.47, 6.67), "exact": (25.4/3, 20/3)}
def rnd(x, q):
    """nearest multiple of q; returns (value, tie, dist_to_boundary_in_units_of_q)"""
    y = x / q
    f = y - math.floor(y)
    tie = abs(f - 0.5) < 1e-9
    lo, hi = math.floor(y) * q, (math.floor(y) + 1) * q
    val = hi if f > 0.5 else lo
    return val, tie, (lo, hi), abs(f - 0.5)
def compute(block, row, su, se):
    g = row[0]
    out = {}
    if block == "mondo":
        lf = g
        out["EUR"] = rnd((lf + 2*se)/se, 0.5)
        u = (lf + 2*su)/su - 25
        out["UK"] = rnd(u, 0.5); out["USm"] = rnd(u + 1, 0.5); out["USw"] = rnd(u + 2, 0.5)
        cols = ["EUR", "UK", "USm", "USw"]
    elif block == "eur":
        lf = (g - 2) * se
        out["Mondo"] = rnd(lf, 5)
        u = (lf + 2*su)/su - 25
        out["UK"] = rnd(u, 0.5); out["USm"] = rnd(u + 1, 0.5); out["USw"] = rnd(u + 2, 0.5)
        cols = ["Mondo", "UK", "USm", "USw"]
    else:
        lf = (g + 23) * su
        out["Mondo"] = rnd(lf, 5)
        out["EUR"] = rnd((lf + 2*se)/se, 0.5)
        out["USm"] = rnd(g + 1, 0.5); out["USw"] = rnd(g + 2, 0.5)
        cols = ["Mondo", "EUR", "USm", "USw"]
    return cols, out
total = 0
res = {"rounded": 0, "exact_nearest_or_tie": 0, "union": 0}
misses = {"rounded": [], "exact": [], "union": []}
ties = []
for block, rows in (("mondo", mondo), ("eur", eur), ("uk", uk)):
    for row in rows:
        cr, outr = compute(block, row, *STEPS["rounded"])
        ce, oute = compute(block, row, *STEPS["exact"])
        for j, c in enumerate(cr):
            table = row[j+1]
            total += 1
            vr, tr, (lor, hir), dr = outr[c]
            ve, te, (loe, hie), de = oute[c]
            ok_r = abs(vr - table) < 1e-9 or (tr and (abs(lor-table) < 1e-9 or abs(hir-table) < 1e-9))
            ok_e = abs(ve - table) < 1e-9 or (te and (abs(loe-table) < 1e-9 or abs(hie-table) < 1e-9))
            if te:
                ties.append((block, row[0], c, "tie %g|%g" % (loe, hie), "table", table, "down" if abs(loe-table) < 1e-9 else ("up" if abs(hie-table) < 1e-9 else "neither")))
            res["rounded"] += ok_r
            res["exact_nearest_or_tie"] += ok_e
            res["union"] += (ok_r or ok_e)
            if not ok_r: misses["rounded"].append((block, row[0], c, "table", table, "calc", vr, "dist_to_boundary(units of rounding step)", round(dr, 4)))
            if not ok_e: misses["exact"].append((block, row[0], c, "table", table, "calc", ve, "dist", round(de, 4)))
            if not (ok_r or ok_e): misses["union"].append((block, row[0], c, table))
print("TOTAL values", total)
for k, v in res.items(): print("match", k, v, "/", total)
for k in misses:
    print("MISSES", k, len(misses[k]))
    for m in misses[k]: print("   ", m)
print("EXACT-STEP TIES (exact steps put the value exactly on a rounding boundary):", len(ties))
for t in ties: print("   ", t)
