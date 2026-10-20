"""Write core's copies of ISO/TS 19407:2015's tables from `tables.py` (ADR 0027): the children's
table for the engine, and Table 2 for the test that holds the engine's formulas to the standard.
Run from the repository root: `python -I docs/research/shoe-sizes-1/write_tables.py`, then
`pnpm format`."""

from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from tables import CHILDREN, EUR_GRADING, MONDO_GRADING, UK_GRADING  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[3]
HEADER = (
    "// Written by docs/research/shoe-sizes-1/write_tables.py from tables.py, the transcription of\n"
    "// ISO/TS 19407:2015's tables (docs/research/shoe-sizes-1.md): edit the data there, never here.\n"
)


def number(value: float | None) -> str:
    if value is None:
        return "null"
    return f"{value:g}"


def write_children() -> None:
    rows = ",\n".join(
        "  { foot: %s, mondopoint: %s, eu: %s, uk: %s, us: %s, last: [%s, %s] }"
        % tuple(number(cell) for cell in row)
        for row in CHILDREN
    )
    text = f"""{HEADER}
/**
 * A row of ISO/TS 19407:2015's Table 3, the children's conversion: the foot length it stands for
 * in mm, Mondopoint where a 5 mm size falls in the row, the European half size the table is graded
 * by, the UK and US sizes where a half size falls in the row (null where none does; the UK scale
 * restarts at 1 after 13.5, and the US at 1 after its 13.5), and the typical last's length,
 * smallest and largest, in mm.
 */
export interface ChildrenRow {{
  foot: number;
  mondopoint: number | null;
  eu: number;
  uk: number | null;
  us: number | null;
  last: readonly [number, number];
}}

/** ISO/TS 19407:2015, Table 3, as printed (read through GOST R 57425-2017, pages 6 and 7). */
export const CHILDREN_TABLE: readonly ChildrenRow[] = [
{rows},
];
"""
    (ROOT / "packages/core/src/units/shoe-size-tables.ts").write_text(text, encoding="utf-8")


def write_table2() -> None:
    def grading(rows: list[tuple[float, float, float, float, float]]) -> str:
        return ",\n".join("  [%s]" % ", ".join(number(cell) for cell in row) for row in rows)

    text = f"""{HEADER}
/**
 * ISO/TS 19407:2015, Table 2, "Adults' recommended shoe size marking (simplified)", as printed
 * (read through GOST R 57425-2017, pages 5 and 6): three gradings, each from its own size to the
 * others, rounded to the half size and Mondopoint to 5 mm; US men's is UK + 1 and US women's
 * UK + 2 throughout.
 */
export type GradingRow = readonly [number, number, number, number, number];

/** Mondopoint grading: mondopoint, eu, uk, usMen, usWomen. */
export const MONDO_GRADING: readonly GradingRow[] = [
{grading(MONDO_GRADING)},
];

/** European grading: eu, mondopoint, uk, usMen, usWomen. */
export const EUR_GRADING: readonly GradingRow[] = [
{grading(EUR_GRADING)},
];

/** UK grading: uk, mondopoint, eu, usMen, usWomen. */
export const UK_GRADING: readonly GradingRow[] = [
{grading(UK_GRADING)},
];
"""
    (ROOT / "packages/core/test/iso-19407-table2.ts").write_text(text, encoding="utf-8")


if __name__ == "__main__":
    write_children()
    write_table2()
    print("written: packages/core/src/units/shoe-size-tables.ts, packages/core/test/iso-19407-table2.ts")
