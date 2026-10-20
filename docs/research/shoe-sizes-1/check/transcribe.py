"""Transcription of GOST R 57425-2017 (ISO/TS 19407:2015) Tables 2 and 3,
read by eye from the rendered pages p08, p09, p10 (standard pages 5, 6, 7).

Values are kept exactly as printed (decimal commas); the writer converts
them to decimal points. A blank cell is written as "-" in the source blocks.
"""
import csv
import os
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))

# ---- Table 2: Mondopoint grading (p08 rows 215..265, p09 rows 270..320) ----
# mondo eur uk us_men us_women
T2_MONDO = """
215 34 2,5 3,5 4,5
220 35 3 4 5
225 35,5 3,5 4,5 5,5
230 36,5 4 5 6
235 37 4,5 5,5 6,5
240 38 5,5 6,5 7,5
245 38,5 6 7 8
250 39,5 6,5 7,5 8,5
255 40 7 8 9
260 41 7,5 8,5 9,5
265 41,5 8,5 9,5 10,5
270 42,5 9 10 11
275 43 9,5 10,5 11,5
280 44 10 11 12
285 44,5 10,5 11,5 12,5
290 45,5 11 12 13
295 46 12 13 14
300 47 12,5 13,5 14,5
305 47,5 13 14 15
310 48,5 13,5 14,5 15,5
315 49 14 15 16
320 50 15 16 17
"""

# ---- Table 2: European grading (p08 rows 34..39, p09 rows 39,5..49,5) ----
# eur mondo uk us_men us_women
T2_EUR = """
34 215 2 3 4
34,5 215 2,5 3,5 4,5
35 220 3 4 5
35,5 225 3,5 4,5 5,5
36 225 4 5 6
36,5 230 4 5 6
37 235 4,5 5,5 6,5
37,5 235 5 6 7
38 240 5,5 6,5 7,5
38,5 245 5,5 6,5 7,5
39 245 6 7 8
39,5 250 6,5 7,5 8,5
40 255 7 8 9
40,5 255 7,5 8,5 9,5
41 260 7,5 8,5 9,5
41,5 265 8 9 10
42 265 8,5 9,5 10,5
42,5 270 9 10 11
43 275 9,5 10,5 11,5
43,5 275 9,5 10,5 11,5
44 280 10 11 12
44,5 285 10,5 11,5 12,5
45 285 11 12 13
45,5 290 11,5 12,5 13,5
46 295 11,5 12,5 13,5
46,5 295 12 13 14
47 300 12,5 13,5 14,5
47,5 305 13 14 15
48 305 13 14 15
48,5 310 13,5 14,5 15,5
49 315 14 15 16
49,5 315 14,5 15,5 16,5
"""

# ---- Table 2: UK grading (p08 rows 2..7, p09 rows 7,5..15) ----
# uk mondo eur us_men us_women
T2_UK = """
2 210 34 3 4
2,5 215 34,5 3,5 4,5
3 220 35 4 5
3,5 225 35,5 4,5 5,5
4 230 36,5 5 6
4,5 235 37 5,5 6,5
5 235 37,5 6 7
5,5 240 38 6,5 7,5
6 245 39 7 8
6,5 250 39,5 7,5 8,5
7 255 40 8 9
7,5 260 40,5 8,5 9,5
8 260 41,5 9 10
8,5 265 42 9,5 10,5
9 270 42,5 10 11
9,5 275 43,5 10,5 11,5
10 280 44 11 12
10,5 285 44,5 11,5 12,5
11 290 45 12 13
11,5 290 46 12,5 13,5
12 295 46,5 13 14
12,5 300 47 13,5 14,5
13 305 47,5 14 15
13,5 310 48,5 14,5 15,5
14 315 49 15 16
14,5 320 49,5 15,5 16,5
15 320 50 16 17
"""

# ---- Table 3: children (p09 rows 120..157, p10 rows 160..236) ----
# foot_mm mondopoint eur uk us last_min last_max   ("-" = blank cell)
T3 = """
120 120 19,5 3,5 4 130 136
123 125 20 4 4,5 133 139
127 - 20,5 4,5 5 137 143
130 130 21 5 5,5 140 146
133 - 21,5 5,5 6 143 149
135 135 22 - - 147 153
138 140 22,5 6 6,5 150 156
142 - 23 6,5 7 153 159
146 145 23,5 7 7,5 157 163
148 - 24 - - 160 166
150 150 24,5 7,5 8 163 169
154 155 25 8 8,5 167 173
157 - 25,5 8,5 9 170 176
160 160 26 9 9,5 173 179
164 - 26,5 - - 177 183
166 165 27 9,5 10 180 186
169 170 27,5 10 10,5 183 189
173 - 28 10,5 11 187 193
176 175 28,5 11 11,5 190 196
179 180 29 11,5 12 193 199
182 - 29,5 - - 197 203
185 185 30 12 12,5 200 206
188 - 30,5 12,5 13 203 209
192 190 31 13 13,5 207 213
195 195 31,5 13,5 1 210 216
198 - 32 - - 213 219
200 200 32,5 1 1,5 217 223
204 205 33 1,5 2 220 226
207 - 33,5 - - 223 229
210 210 34 2 2,5 227 233
213 - 34,5 2,5 3 230 236
217 215 35 3 3,5 233 239
220 220 35,5 3,5 4 237 243
224 - 36 - - 240 246
226 225 36,5 4 4,5 243 249
230 230 37 4,5 5 247 253
232 - 37,5 - - 250 256
236 235 38 5 - 253 259
"""


def cell(token):
    """Document cell -> CSV field: decimal comma to point, '-' to empty."""
    return "" if token == "-" else token.replace(",", ".")


def parse(block, width):
    rows = []
    for line in block.strip().splitlines():
        toks = line.split()
        assert len(toks) == width, f"bad row width {len(toks)}: {line!r}"
        rows.append([cell(t) for t in toks])
    return rows


def num(field):
    return Fraction(field) if field != "" else None


def write(name, header, rows):
    path = os.path.join(HERE, name)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(header)
        w.writerows(rows)
    print(f"wrote {path}: {len(rows)} rows")
    return path


mondo = parse(T2_MONDO, 5)
eur = parse(T2_EUR, 5)
uk = parse(T2_UK, 5)
t3 = parse(T3, 7)

write("table2_mondo.csv", ["mondo", "eur", "uk", "us_men", "us_women"], mondo)
write("table2_eur.csv", ["eur", "mondo", "uk", "us_men", "us_women"], eur)
write("table2_uk.csv", ["uk", "mondo", "eur", "us_men", "us_women"], uk)
write("table3.csv", ["foot_mm", "mondopoint", "eur", "uk", "us", "last_min", "last_max"], t3)

# ---------------- self-checks: Table 2 ----------------
failures = 0


def check_grading(label, rows, uk_col, men_col, women_col, step):
    global failures
    for i, r in enumerate(rows):
        key, ukv, men, women = num(r[0]), num(r[uk_col]), num(r[men_col]), num(r[women_col])
        if men != ukv + 1:
            failures += 1
            print(f"FAIL {label} row {r[0]}: US men {r[men_col]} != UK {r[uk_col]} + 1")
        if women != ukv + 2:
            failures += 1
            print(f"FAIL {label} row {r[0]}: US women {r[women_col]} != UK {r[uk_col]} + 2")
        if i > 0 and key - num(rows[i - 1][0]) != step:
            failures += 1
            print(f"FAIL {label} row {r[0]}: bold column step from {rows[i-1][0]} is not {step}")
    print(f"{label}: {len(rows)} rows, bold column {rows[0][0]} .. {rows[-1][0]} by {step}")


check_grading("Mondo grading", mondo, uk_col=2, men_col=3, women_col=4, step=Fraction(5))
check_grading("EUR grading", eur, uk_col=2, men_col=3, women_col=4, step=Fraction(1, 2))
check_grading("UK grading", uk, uk_col=0, men_col=3, women_col=4, step=Fraction(1, 2))
print("Table 2 self-check:", "PASSED" if failures == 0 else f"{failures} FAILURE(S)")

# ---------------- self-checks: Table 3 ----------------
header3 = ["foot_mm", "mondopoint", "eur", "uk", "us", "last_min", "last_max"]
print(f"Table 3: {len(t3)} rows")
for j, name in enumerate(header3):
    blanks = sum(1 for r in t3 if r[j] == "")
    print(f"  blank cells in {name}: {blanks}")

# Extra arithmetic checks (informational; each flags a likely misread digit)
notes = 0
for i, r in enumerate(t3):
    foot, mp, e, u, us, lo, hi = (num(x) for x in r)
    if hi - lo != 6:
        notes += 1
        print(f"NOTE row {r[0]}: last range width {hi - lo} (every other row is 6)")
    if i > 0 and e - num(t3[i - 1][2]) != Fraction(1, 2):
        notes += 1
        print(f"NOTE row {r[0]}: EUR step from {t3[i-1][2]} is not 0.5")
    if i > 0 and foot <= num(t3[i - 1][0]):
        notes += 1
        print(f"NOTE row {r[0]}: foot length not increasing")
    if u is not None and us is not None and us - u != Fraction(1, 2) and not (u == Fraction(27, 2) and us == 1):
        notes += 1
        print(f"NOTE row {r[0]}: US {r[4]} is not UK {r[3]} + 0.5")
    if mp is not None and abs(mp - foot) > Fraction(5, 2):
        notes += 1
        print(f"NOTE row {r[0]}: Mondopoint {r[1]} is more than 2.5 mm from the foot length")
    expect_lo = round(e * 20 / 3)
    if lo != expect_lo:
        notes += 1
        print(f"NOTE row {r[0]}: last_min {r[5]} differs from round(EUR x 6.667) = {expect_lo}")
print("Table 3 extra checks:", "no notes" if notes == 0 else f"{notes} note(s)")
