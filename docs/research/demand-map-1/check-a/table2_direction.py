# Checker A: in which direction does ISO Table 2 round? Compares each table value with the unrounded
# formula value (ISO's printed steps 8.47 / 6.67 and the exact steps 25.4/3 / 20/3). US columns are
# skipped here (they are UK + 1 / + 2, so they repeat the UK column's direction).
import sys, re
sys.stdout.reconfigure(encoding="utf-8")
txt = open(sys.argv[1], encoding="utf-8").read().splitlines()
s = next(i for i, l in enumerate(txt) if l.startswith("Т а б л и ц а 2")); e = next(i for i, l in enumerate(txt) if l.startswith("Т а б л и ц а 3"))
num = re.compile(r"^\d+(,\d+)?$"); mondo, eur, uk = [], [], []
for l in txt[s:e]:
    t = l.split()
    if t and all(num.match(x) for x in t):
        v = [float(x.replace(",", ".")) for x in t]
        if len(v) == 15: mondo.append(v[0:5]); eur.append(v[5:10]); uk.append(v[10:15])
        elif len(v) == 10: eur.append(v[0:5]); uk.append(v[5:10])
        elif len(v) == 5: eur.append(v[0:5])
for name, (su, se) in {"printed steps 8.47/6.67": (8.47, 6.67), "exact steps 25.4/3, 20/3": (25.4/3, 20/3)}.items():
    up = down = same = 0; ex = []
    def tally(tab, raw, label):
        global up, down, same
        if abs(tab - raw) < 1e-9: same += 1
        elif tab > raw: up += 1
        else: down += 1; ex.append(label)
    for r in mondo:
        lf = r[0]; tally(r[1], (lf + 2*se)/se, f"Mondo {r[0]:g}->EUR"); tally(r[2], (lf + 2*su)/su - 25, f"Mondo {r[0]:g}->UK")
    for r in eur:
        lf = (r[0] - 2)*se; tally(r[1], lf, f"EUR {r[0]:g}->Mondo"); tally(r[2], (lf + 2*su)/su - 25, f"EUR {r[0]:g}->UK")
    for r in uk:
        lf = (r[0] + 23)*su; tally(r[1], lf, f"UK {r[0]:g}->Mondo"); tally(r[2], (lf + 2*se)/se, f"UK {r[0]:g}->EUR")
    print(f"{name}: of {up+down+same} non-US values, table above formula {up}, below {down}, equal {same}")
    print("   examples below:", ex[:12])
