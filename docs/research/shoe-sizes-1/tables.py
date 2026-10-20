"""ISO/TS 19407:2015, "Footwear -- Sizing -- Conversion of sizing systems", Tables 2 and 3 as
printed, and the rule that reproduces Table 2 (docs/research/shoe-sizes-1.md; ADR 0027).

Read from the page images of GOST R 57425-2017, the standard's Russian adoption, which changes
only its references (its foreword): pages 5 to 7 of the PDF at
https://files.stroyinf.ru/Data2/1/4293746/4293746756.pdf, rendered to PNG and read by eye, with
the PDF's text layer (its digits survive, its Cyrillic does not) as a second reading, and a blind
transcription by a checker as the third (the doc, "The check"). A blank cell is None.

This file is the data: `write_tables.py` writes core's copies from it, so nothing is typed twice.
Run it with `python -I tables.py` to recompute Table 2 from the standard's own formulas and print
what reproduces and what does not.
"""

from __future__ import annotations

# Table 2, "Adults' recommended shoe size marking (simplified)": three gradings side by side,
# each from its own size (bold in the standard) to the other systems, rounded to the half size
# (Mondopoint to 5 mm). US men's and US women's are unisex UK + 1 and UK + 2 throughout.

# Mondopoint grading: (mondopoint, eur, uk, us_men, us_women)
MONDO_GRADING: list[tuple[float, float, float, float, float]] = [
    (215, 34, 2.5, 3.5, 4.5),
    (220, 35, 3, 4, 5),
    (225, 35.5, 3.5, 4.5, 5.5),
    (230, 36.5, 4, 5, 6),
    (235, 37, 4.5, 5.5, 6.5),
    (240, 38, 5.5, 6.5, 7.5),
    (245, 38.5, 6, 7, 8),
    (250, 39.5, 6.5, 7.5, 8.5),
    (255, 40, 7, 8, 9),
    (260, 41, 7.5, 8.5, 9.5),
    (265, 41.5, 8.5, 9.5, 10.5),
    (270, 42.5, 9, 10, 11),
    (275, 43, 9.5, 10.5, 11.5),
    (280, 44, 10, 11, 12),
    (285, 44.5, 10.5, 11.5, 12.5),
    (290, 45.5, 11, 12, 13),
    (295, 46, 12, 13, 14),
    (300, 47, 12.5, 13.5, 14.5),
    (305, 47.5, 13, 14, 15),
    (310, 48.5, 13.5, 14.5, 15.5),
    (315, 49, 14, 15, 16),
    (320, 50, 15, 16, 17),
]

# European grading: (eur, mondopoint, uk, us_men, us_women)
EUR_GRADING: list[tuple[float, float, float, float, float]] = [
    (34, 215, 2, 3, 4),
    (34.5, 215, 2.5, 3.5, 4.5),
    (35, 220, 3, 4, 5),
    (35.5, 225, 3.5, 4.5, 5.5),
    (36, 225, 4, 5, 6),
    (36.5, 230, 4, 5, 6),
    (37, 235, 4.5, 5.5, 6.5),
    (37.5, 235, 5, 6, 7),
    (38, 240, 5.5, 6.5, 7.5),
    (38.5, 245, 5.5, 6.5, 7.5),
    (39, 245, 6, 7, 8),
    (39.5, 250, 6.5, 7.5, 8.5),
    (40, 255, 7, 8, 9),
    (40.5, 255, 7.5, 8.5, 9.5),
    (41, 260, 7.5, 8.5, 9.5),
    (41.5, 265, 8, 9, 10),
    (42, 265, 8.5, 9.5, 10.5),
    (42.5, 270, 9, 10, 11),
    (43, 275, 9.5, 10.5, 11.5),
    (43.5, 275, 9.5, 10.5, 11.5),
    (44, 280, 10, 11, 12),
    (44.5, 285, 10.5, 11.5, 12.5),
    (45, 285, 11, 12, 13),
    (45.5, 290, 11.5, 12.5, 13.5),
    (46, 295, 11.5, 12.5, 13.5),
    (46.5, 295, 12, 13, 14),
    (47, 300, 12.5, 13.5, 14.5),
    (47.5, 305, 13, 14, 15),
    (48, 305, 13, 14, 15),
    (48.5, 310, 13.5, 14.5, 15.5),
    (49, 315, 14, 15, 16),
    (49.5, 315, 14.5, 15.5, 16.5),
]

# UK grading: (uk, mondopoint, eur, us_men, us_women)
UK_GRADING: list[tuple[float, float, float, float, float]] = [
    (2, 210, 34, 3, 4),
    (2.5, 215, 34.5, 3.5, 4.5),
    (3, 220, 35, 4, 5),
    (3.5, 225, 35.5, 4.5, 5.5),
    (4, 230, 36.5, 5, 6),
    (4.5, 235, 37, 5.5, 6.5),
    (5, 235, 37.5, 6, 7),
    (5.5, 240, 38, 6.5, 7.5),
    (6, 245, 39, 7, 8),
    (6.5, 250, 39.5, 7.5, 8.5),
    (7, 255, 40, 8, 9),
    (7.5, 260, 40.5, 8.5, 9.5),
    (8, 260, 41.5, 9, 10),
    (8.5, 265, 42, 9.5, 10.5),
    (9, 270, 42.5, 10, 11),
    (9.5, 275, 43.5, 10.5, 11.5),
    (10, 280, 44, 11, 12),
    (10.5, 285, 44.5, 11.5, 12.5),
    (11, 290, 45, 12, 13),
    (11.5, 290, 46, 12.5, 13.5),
    (12, 295, 46.5, 13, 14),
    (12.5, 300, 47, 13.5, 14.5),
    (13, 305, 47.5, 14, 15),
    (13.5, 310, 48.5, 14.5, 15.5),
    (14, 315, 49, 15, 16),
    (14.5, 320, 49.5, 15.5, 16.5),
    (15, 320, 50, 16, 17),
]

# Table 3, "Children's shoe size conversion": graded by the European half size, with the foot
# length each row stands for, Mondopoint where a 5 mm size falls in the row, the UK and US sizes
# where a half size falls in the row (the UK scale restarts at 1 after 13.5, and the US at 1 after
# its 13.5, the US a half size above the UK), and the typical last's length, smallest and largest.
# (foot_mm, mondopoint, eur, uk, us, last_min, last_max)
Cell = float | None
CHILDREN: list[tuple[float, Cell, float, Cell, Cell, float, float]] = [
    (120, 120, 19.5, 3.5, 4, 130, 136),
    (123, 125, 20, 4, 4.5, 133, 139),
    (127, None, 20.5, 4.5, 5, 137, 143),
    (130, 130, 21, 5, 5.5, 140, 146),
    (133, None, 21.5, 5.5, 6, 143, 149),
    (135, 135, 22, None, None, 147, 153),
    (138, 140, 22.5, 6, 6.5, 150, 156),
    (142, None, 23, 6.5, 7, 153, 159),
    (146, 145, 23.5, 7, 7.5, 157, 163),
    (148, None, 24, None, None, 160, 166),
    (150, 150, 24.5, 7.5, 8, 163, 169),
    (154, 155, 25, 8, 8.5, 167, 173),
    (157, None, 25.5, 8.5, 9, 170, 176),
    (160, 160, 26, 9, 9.5, 173, 179),
    (164, None, 26.5, None, None, 177, 183),
    (166, 165, 27, 9.5, 10, 180, 186),
    (169, 170, 27.5, 10, 10.5, 183, 189),
    (173, None, 28, 10.5, 11, 187, 193),
    (176, 175, 28.5, 11, 11.5, 190, 196),
    (179, 180, 29, 11.5, 12, 193, 199),
    (182, None, 29.5, None, None, 197, 203),
    (185, 185, 30, 12, 12.5, 200, 206),
    (188, None, 30.5, 12.5, 13, 203, 209),
    (192, 190, 31, 13, 13.5, 207, 213),
    (195, 195, 31.5, 13.5, 1, 210, 216),
    (198, None, 32, None, None, 213, 219),
    (200, 200, 32.5, 1, 1.5, 217, 223),
    (204, 205, 33, 1.5, 2, 220, 226),
    (207, None, 33.5, None, None, 223, 229),
    (210, 210, 34, 2, 2.5, 227, 233),
    (213, None, 34.5, 2.5, 3, 230, 236),
    (217, 215, 35, 3, 3.5, 233, 239),
    (220, 220, 35.5, 3.5, 4, 237, 243),
    (224, None, 36, None, None, 240, 246),
    (226, 225, 36.5, 4, 4.5, 243, 249),
    (230, 230, 37, 4.5, 5, 247, 253),
    (232, None, 37.5, None, None, 250, 256),
    (236, 235, 38, 5, None, 253, 259),
]

# The standard's formulas (its 2.2), over the foot length lf in mm, with the steps as it prints
# them: UK adult = (lf + 2 * 8.47) / 8.47 - 25 and EUR = (lf + 2 * 6.67) / 6.67, the shoe two sizes
# longer than the foot; US men's = UK + 1 and US women's = UK + 2 (its 2.2 d).
UK_STEP = 8.47
EUR_STEP = 6.67


def foot_of(system: str, size: float) -> float:
    if system == "mondo":
        return size
    if system == "eur":
        return (size - 2) * EUR_STEP
    if system == "uk":
        return (size + 23) * UK_STEP
    raise ValueError(system)


def size_of(system: str, foot: float) -> float:
    if system == "mondo":
        return foot
    if system == "eur":
        return foot / EUR_STEP + 2
    if system == "uk":
        return foot / UK_STEP - 23
    raise ValueError(system)


def to_step(value: float, step: float) -> float:
    """The nearest multiple of the step, a tie away from zero (the project's rounding)."""
    scaled = value / step
    whole = int(abs(scaled))
    rest = abs(scaled) - whole
    count = whole + (1 if rest >= 0.5 - 1e-9 else 0)
    return (count if scaled >= 0 else -count) * step


STEP = {"mondo": 5, "eur": 0.5, "uk": 0.5}


def check_table2() -> tuple[int, int, list[str]]:
    """Recompute every converted value of Table 2 from its grading's size: how many values were
    checked, how many the formulas reproduce, and the misses with their distance to a rounding
    boundary in steps."""
    gradings = [
        ("mondo", MONDO_GRADING, ("eur", "uk")),
        ("eur", EUR_GRADING, ("mondo", "uk")),
        ("uk", UK_GRADING, ("mondo", "eur")),
    ]
    checked = 0
    matched = 0
    misses: list[str] = []
    for system, rows, others in gradings:
        for row in rows:
            size, first, second, us_men, us_women = row
            foot = foot_of(system, size)
            given = dict(zip(others, (first, second)))
            uk = size if system == "uk" else given["uk"]
            for other in others:
                checked += 1
                exact = size_of(other, foot)
                rounded = to_step(exact, STEP[other])
                if abs(rounded - given[other]) < 1e-9:
                    matched += 1
                else:
                    boundary = abs((exact / STEP[other]) % 1 - 0.5)
                    misses.append(
                        f"{system} {size:g}: {other} printed {given[other]:g}, the formula gives "
                        f"{exact:.3f}, which rounds to {rounded:g} ({boundary:.4f} steps from the boundary)"
                    )
            for name, offset, value in (("US men's", 1, us_men), ("US women's", 2, us_women)):
                checked += 1
                if abs(value - (uk + offset)) < 1e-9:
                    matched += 1
                else:
                    misses.append(f"{system} {size:g}: {name} printed {value:g}, UK + {offset} is {uk + offset:g}")
    return checked, matched, misses


def children_pairs(column: str) -> list[tuple[float, float]]:
    """A children's scale's (foot length, size) pairs from Table 3, the scale's own rows only:
    for the UK and the US, the rows before the scale restarts at 1."""
    index = {"eur": 2, "uk": 3, "us": 4}[column]
    pairs: list[tuple[float, float]] = []
    for row in CHILDREN:
        size = row[index]
        if size is None:
            continue
        if pairs and size < pairs[-1][1]:
            break
        pairs.append((row[0], size))
    return pairs


if __name__ == "__main__":
    checked, matched, misses = check_table2()
    print(f"Table 2: {checked} values, {matched} reproduced by the formulas with the printed steps")
    for miss in misses:
        print(f"  miss: {miss}")
    print(f"Table 3: {len(CHILDREN)} rows")
    for column in ("eur", "uk", "us"):
        pairs = children_pairs(column)
        print(f"  {column}: {len(pairs)} sizes, {pairs[0][1]:g} at {pairs[0][0]:g} mm to {pairs[-1][1]:g} at {pairs[-1][0]:g} mm")
