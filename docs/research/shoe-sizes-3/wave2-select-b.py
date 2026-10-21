"""Selects wave 2's rows for checker B (the sources pass, docs/research/shoe-sizes-3.md §4 and §8):
every measurement worker B recorded from RunRepeat's lab, its eight claims, and the method
statements its report rests on, each with a `check` note. Run from the repo's root:

    python -I docs/research/shoe-sizes-3/wave2-select-b.py

Writes docs/research/shoe-sizes-3/wave2-check-b.csv.
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FIELDS = [
    "id",
    "checker",
    "kind",
    "brand",
    "model",
    "line",
    "size_label",
    "size_scale",
    "value",
    "unit",
    "measured_as",
    "claim",
    "exact_words",
    "url",
    "worker_tool",
    "check",
]

MEASUREMENT_NOTE = (
    "Re-download the review page with your own script, find the internal length the page reports "
    "for this model (the lab figure, printed once as the test result and once in the comparison "
    "table), and confirm the value in mm; corrected with the page's value where it differs; note "
    "whether the page's own text names the size measured, and which size."
)
CLAIM_NOTE = (
    "Read the page yourself and quote the sentence that carries the recorded words; confirmed "
    "where the page prints them in substance, corrected with the page's words where they differ, "
    "could not reach where a script and then the fetcher are refused, wrong where the page says "
    "no such thing."
)
METHOD = [
    (
        "https://runrepeat.com/testing-methodology",
        "RunRepeat tests every shoe in men's US 9 and waits for that size when it is not available",
        "We always test in men's US 9 … We buy the shoes in men's US 9. If not available in that size, we wait until it is.",
    ),
    (
        "https://runrepeat.com/testing-methodology",
        "RunRepeat's lab conditions",
        "20°C/68°F ± 1°C and 55% ± 5% humidity",
    ),
    (
        "https://runrepeat.com/testing-methodology",
        "The internal length is measured on the cut shoe, the foam then marked at 12% and 75% of it",
        "After measuring the internal length, we mark both places on the foam itself at 12% and 75% of the length.",
    ),
    (
        "https://runrepeat.com/size-charts/converse",
        "RunRepeat cuts the shoe open and measures the internal length with a caliper",
        "We create gel molds of each shoe's interior … and even cut it open to measure the internal length with a caliper.",
    ),
    (
        "https://runrepeat.com/guides/how-to-measure-shoe-size",
        "RunRepeat's internal lengths over a thousand shoes at US 9 run from 255 to 281 mm",
        "Having measured the internal length of over 1000 shoes in our lab, we discovered that it can range from 255 to 281 mm in the same US size 9!",
    ),
]


def main() -> None:
    measurements = list(
        csv.DictReader((ROOT / "measurements/measurements.csv").open(encoding="utf-8"))
    )
    claims = list(csv.DictReader((ROOT / "measurements/claims.csv").open(encoding="utf-8")))
    out: list[dict[str, str]] = []
    for row in measurements:
        out.append(
            {
                "id": f"B-M{int(row['id']):03d}",
                "checker": "B",
                "kind": "measurement",
                "brand": row["brand"],
                "model": row["model"],
                "line": row["line"],
                "size_label": row["size_label"],
                "size_scale": row["size_scale"],
                "value": row["value"],
                "unit": row["unit"],
                "measured_as": row["measured_as"],
                "claim": "",
                "exact_words": "",
                "url": row["url"],
                "worker_tool": row["tool"],
                "check": MEASUREMENT_NOTE,
            }
        )
    for number, row in enumerate(claims, 1):
        out.append(
            {
                "id": f"B-C{number:03d}",
                "checker": "B",
                "kind": "claim",
                "brand": row["brand"],
                "model": "",
                "line": "",
                "size_label": "",
                "size_scale": "",
                "value": "",
                "unit": "",
                "measured_as": "",
                "claim": row["claim"],
                "exact_words": row["exact_words"],
                "url": row["url"],
                "worker_tool": "script",
                "check": CLAIM_NOTE,
            }
        )
    for number, (url, claim, words) in enumerate(METHOD, 1):
        out.append(
            {
                "id": f"B-S{number:03d}",
                "checker": "B",
                "kind": "method statement",
                "brand": "",
                "model": "",
                "line": "",
                "size_label": "",
                "size_scale": "",
                "value": "",
                "unit": "",
                "measured_as": "",
                "claim": claim,
                "exact_words": words,
                "url": url,
                "worker_tool": "script",
                "check": CLAIM_NOTE,
            }
        )
    with (ROOT / "wave2-check-b.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(out)
    pages = {row["url"] for row in out}
    print(
        f"{len(out)} rows ({len(measurements)} measurements, {len(claims)} claims, {len(METHOD)} method statements) over {len(pages)} pages"
    )


if __name__ == "__main__":
    main()
