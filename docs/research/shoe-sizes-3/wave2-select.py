"""Selects wave 2's rows for the checkers (the sources pass, docs/research/shoe-sizes-3.md §4).

Checker A: every claim of worker A (the brands' own words), each with the second page it rests on
where one was read, and each lacking-scale chart at its first, middle, and last rows in every
column, with a `check` note saying what to confirm. Run from the repo's root:

    python -I docs/research/shoe-sizes-3/wave2-select.py

Writes docs/research/shoe-sizes-3/wave2-check.csv.
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FIELDS = [
    "id",
    "checker",
    "kind",
    "brand",
    "url",
    "site_region",
    "chart",
    "row",
    "column",
    "value",
    "claim",
    "exact_words",
    "worker_tool",
    "second_url",
    "check",
]

CLAIM_NOTE = (
    "Read the page yourself (a script first, the fetcher if the script is refused, never the "
    "worker's copy unless both refuse) and quote the sentence that carries the recorded words: "
    "confirmed where the page prints them as recorded, corrected with the page's own words where "
    "they differ in substance, could not reach where both tools are refused, wrong where the page "
    "says no such thing."
)
SECOND_NOTE = " Then read second_url the same way and say in the note whether its words agree with the first page's."
UNREACHED_NOTE = (
    "The worker could not reach this page: try it with a script, then the fetcher; report could "
    "not reach if both refuse, else read it and quote what it says about sizing, fit, or the "
    "length column."
)
CELL_NOTE = (
    "Re-download the page with your own script, parse the chart named (its data may sit in the "
    "page's HTML tables or embedded data), find the row by its other values (row is the worker's "
    "count from 1), and confirm the value as printed in that column; corrected with the page's "
    "value where it differs, could not reach where the page refuses both tools."
)


def main() -> None:
    claims = list(csv.DictReader((ROOT / "rules/claims.csv").open(encoding="utf-8")))
    charts = list(csv.DictReader((ROOT / "rules/charts.csv").open(encoding="utf-8")))
    by_id = {row["id"]: row for row in claims}
    out: list[dict[str, str]] = []
    for row in claims:
        second = by_id.get(row["agrees_with"].strip()) if row["agrees_with"].strip() else None
        unreached = row["kind"] in ("could not reach", "absence")
        note = UNREACHED_NOTE if unreached else CLAIM_NOTE + (SECOND_NOTE if second else "")
        out.append(
            {
                "id": f"A-{row['id']}",
                "checker": "A",
                "kind": "claim",
                "brand": row["brand"],
                "url": row["url"],
                "site_region": row["site_region"],
                "chart": "",
                "row": "",
                "column": "",
                "value": "",
                "claim": row["claim"],
                "exact_words": row["exact_words"],
                "worker_tool": row["tool"],
                "second_url": second["url"] if second else "",
                "check": note,
            }
        )
    groups: dict[tuple[str, str, str], list[dict[str, str]]] = {}
    for cell in charts:
        groups.setdefault((cell["brand"], cell["site"], cell["chart"]), []).append(cell)
    number = 0
    for (brand, site, chart), cells in groups.items():
        rows = sorted({int(cell["row"]) for cell in cells})
        picked = {rows[0], rows[len(rows) // 2], rows[-1]}
        for cell in cells:
            if int(cell["row"]) not in picked:
                continue
            number += 1
            out.append(
                {
                    "id": f"A-cell-{number:03d}",
                    "checker": "A",
                    "kind": "cell",
                    "brand": brand,
                    "url": cell["url"],
                    "site_region": site,
                    "chart": chart,
                    "row": cell["row"],
                    "column": cell["column"],
                    "value": cell["value"],
                    "claim": "",
                    "exact_words": "",
                    "worker_tool": cell["tool"],
                    "second_url": "",
                    "check": CELL_NOTE,
                }
            )
    with (ROOT / "wave2-check.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(out)
    pages = {row["url"] for row in out} | {row["second_url"] for row in out if row["second_url"]}
    print(f"{len(out)} rows ({len(claims)} claims, {number} cells) over {len(pages)} pages")


if __name__ == "__main__":
    main()
