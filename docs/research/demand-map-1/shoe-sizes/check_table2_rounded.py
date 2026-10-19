"""Recompute ISO/TS 19407:2015 Table 2 (via GOST R 57425-2017) from its own formulas.

Usage: python -I check_table2.py <gost.txt from pdftotext -raw>
Foot length lf in mm. Exact steps: barleycorn 25.4/3 mm, Paris point 20/3 mm.
UK = lf/b + 2 - 25 ; EUR = lf/p + 2 ; US men = UK + 1 ; US women = UK + 2.
Each grading gives a nominal foot length from its own size, then rounds the others:
Mondopoint to 5 mm, EUR/UK/US to the half size. Ties reported separately.
"""
import re
import sys
from fractions import Fraction as F
from pathlib import Path

B = F("8.47")   # ISO rounded step
P = F("6.67")   # ISO rounded step


def uk_of(lf):
    return lf / B + 2 - 25


def eur_of(lf):
    return lf / P + 2


def foot_of_uk(uk):
    return (uk + 23) * B


def foot_of_eur(eur):
    return (eur - 2) * P


def rnd(x, step):
    q = x / step
    lo = int(q // 1)
    frac = q - lo
    tie = frac == F(1, 2)
    n = lo + (1 if frac > F(1, 2) else 0)
    return n * step, tie, (lo + 1) * step


text = Path(sys.argv[1]).read_text(encoding="utf-8")
start = text.index("Т а б л и ц а 2")
end = text.index("Т а б л и ц а 3")
rows = []
for line in text[start:end].splitlines():
    nums = re.findall(r"\d+(?:,\d+)?", line)
    if len(nums) >= 5 and all(re.fullmatch(r"\d+(,\d+)?", n) for n in nums):
        rows.append([F(n.replace(",", ".")) for n in nums])

half = F(1, 2)
checked = mism = ties = 0
report = []
for r in rows:
    groups = []
    if len(r) == 15:
        groups = [("Mondo", r[0:5]), ("EUR", r[5:10]), ("UK", r[10:15])]
    elif len(r) == 10:  # rows where the Mondopoint grading has ended
        groups = [("EUR", r[0:5]), ("UK", r[5:10])]
    elif len(r) == 5:
        groups = [("EUR", r[0:5])]
    for g, v in groups:
        if g == "Mondo":
            lf = v[0]
            calc = {"EUR": rnd(eur_of(lf), half), "UK": rnd(uk_of(lf), half)}
            given = {"EUR": v[1], "UK": v[2], "USm": v[3], "USw": v[4]}
        elif g == "EUR":
            lf = foot_of_eur(v[0])
            calc = {"Mondo": rnd(lf, 5), "UK": rnd(uk_of(lf), half)}
            given = {"Mondo": v[1], "UK": v[2], "USm": v[3], "USw": v[4]}
        else:
            lf = foot_of_uk(v[0])
            calc = {"Mondo": rnd(lf, 5), "EUR": rnd(eur_of(lf), half)}
            given = {"Mondo": v[1], "EUR": v[2], "USm": v[3], "USw": v[4]}
        uk_given = v[0] if g == "UK" else given["UK"]
        for k, (val, tie, up) in calc.items():
            checked += 1
            ok = given[k] == val or (tie and given[k] == up)
            if tie:
                ties += 1
                report.append(f"tie   {g} {float(v[0])}: {k} given {float(given[k])}, down {float(val)} up {float(up)}")
            if not ok:
                mism += 1
                report.append(f"MISS  {g} {float(v[0])}: {k} given {float(given[k])}, formula {float(val)}")
        for k, off in (("USm", 1), ("USw", 2)):
            checked += 1
            if given[k] != uk_given + off:
                mism += 1
                report.append(f"MISS  {g} {float(v[0])}: {k} given {float(given[k])}, UK+{off} {float(uk_given + off)}")

print(f"rows {len(rows)}, values checked {checked}, mismatches {mism}, ties {ties}")
print("\n".join(report))
