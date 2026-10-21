"""Write the RTINGS worker's record: measurements.csv (header only: the figures are gated)
and sources.md with the free-or-gated finding, drawn from the saved column definitions.
Usage: python -I write_record.py <rtings dir>
"""
import csv, json, os, sys

root = sys.argv[1]
dl = os.path.join(root, "downloads")
opts = json.load(open(os.path.join(dl, "column_options.json"), encoding="utf-8"))
silo = opts["data"]["silo"]
tests = silo["test_bench"]["tests"]
fit_ids = ["31166", "26247", "26249", "26248", "26264", "33794", "30974", "30975", "30976"]
byid = {t["original_id"]: t for t in tests}
free = [t["name"] for t in tests if not t.get("insider_only")]
n_insider = sum(1 for t in tests if t.get("insider_only"))

with open(os.path.join(root, "measurements.csv"), "w", newline="", encoding="utf-8") as f:
    csv.writer(f).writerow(
        ["id", "source", "brand", "model", "line", "size_label", "size_scale", "value", "unit",
         "measured_as", "url", "date_read", "tool", "notes"]
    )

fit_rows = "\n".join(
    f"| {i} | {byid[i]['name']} | {byid[i]['kind']} | {byid[i].get('number_input_unit') or ''} | "
    f"{byid[i].get('parent_original_id') or ''} | {byid[i].get('insider_only')} |"
    for i in fit_ids if i in byid
)

md = f"""# RTINGS: sources and the free-or-gated finding (2026-10-21)

## 1. Free or gated: gated. Nothing recorded.

RTINGS' table tool for running shoes (https://www.rtings.com/running-shoes/tools/table; the
footwear table at https://www.rtings.com/shoes/tools/table redirects to it, and the page's
category list holds no other footwear category with a table) does **not** show the internal-length
figures without a membership. Established from the page's own data, three ways, without opening a
review page, without a login, and without reading any measurement value:

1. **The column definitions mark the measures members-only.** The table page loads its columns
   with the public request `POST https://www.rtings.com/api/v2/safe/table_tool__column_options`,
   body `{{"variables": {{"silo_url_part": "running-shoes", "named_version": "public"}}}}`, no
   cookies, no credentials (the request the page's own script makes; saved as
   `downloads/column_options.json`). Of the {len(tests)} tests on the running-shoe test bench,
   {n_insider} carry `"insider_only": true`; the {len(free)} that do not are: {", ".join(free)}.
   The fit measures:

   | original_id | name | kind | input unit | parent | insider_only |
   | --- | --- | --- | --- | --- | --- |
{fit_rows}

   Internal Length, Internal Heel Width, and Internal Forefoot Width sit in the group "Internal
   Shape", and every one of them, the group included, is `insider_only: true`.
2. **The page's structured data marks the gated cells not free.** The page's schema.org block
   (`WebSite.hasPart`) declares `{{"@type": "WebPageElement", "isAccessibleForFree": "False",
   "cssSelector": ".ld-paywall"}}`, and the table tool's own script
   (`https://i.rtings.com/assets/vite/assets/table-tool-BQcd9_JC.js`, saved as
   `downloads/table-tool.js`) gives every table cell, the number cells included, the class
   `ld-paywall` when the cell's `has_paywall` is set, and renders a blurred cell as a lock icon
   (`t-icon i-lock`, class `locked_score_box`) or "N/A" in place of the value.
3. **The category is paywalled.** The page's own category data gives running shoes
   `"has_paywall": true`, and the visitor's access state `"access_limit": 3` (the free-reviews
   counter).

So, per the brief, no figure is taken: the table-tool data request for the values
(`table_tool__test_results`) was never made, no review page was opened, and `measurements.csv`
holds its header only. RTINGS' method pages were not gathered (the brief stops here once the
figures are gated).

## 2. RTINGS' method

Not gathered: the brief stops at a gated table. Only what the column definitions themselves say:
Internal Length is a `number` test, input in millimeters (displayed with an alternate unit in
inches), in the group "Internal Shape" beside a "3D Model Internal" test (kind `3d_model`), which
suggests the internal measures come from a 3D model of the shoe's inside; that is an inference
from field names, not RTINGS' words, and is not to be cited. The running-shoe category had
{silo['tested_products_count']} tested products on 2026-10-21 (`tested_products_count`).

## 3. Every page and endpoint opened (2026-10-21, curl and Python urllib, plain browser user agent, no cookies)

| URL | tool | gave |
| --- | --- | --- |
| https://www.rtings.com/running-shoes/tools/table | curl | 200; the table page: the TableToolPage props (default columns), the schema.org paywall block, category list with `has_paywall`; no rows (they load by script). `downloads/running-shoes_tools_table.html`, props in `downloads/table_props/` |
| https://www.rtings.com/shoes/tools/table | curl | redirects to the running-shoes table |
| https://www.rtings.com/running-shoes | curl | 200; the category page, saved, not mined |
| https://i.rtings.com/assets/vite/assets/table-tool-page-b-K0y49N.js | curl | the page's script: the request names |
| https://i.rtings.com/assets/vite/assets/table-tool-BQcd9_JC.js | curl | the table's script: cell rendering, `ld-paywall`, blur, the data request names (`table_tool__column_options`, `table_tool__products_list`, `table_tool__test_results`, `table_tool__prices`) |
| https://i.rtings.com/assets/vite/assets/application-setup-ByQMN8DK.js | curl | shared setup, no table request |
| https://i.rtings.com/assets/vite/assets/vue-helpers-DsDRYUTf.js | curl | the query helper: a named query is `POST /api/v2/safe/<name>` with `{{"variables": ...}}` |
| POST https://www.rtings.com/api/v2/safe/table_tool__column_options | Python urllib (`scripts/api.py`) | 200; the column definitions with `insider_only` per test (the finding above) |

Not requested, by the boundary: `table_tool__test_results` (the values), `table_tool__products_list`,
any review page, any login or membership page.
"""
open(os.path.join(root, "sources.md"), "w", encoding="utf-8").write(md)
print("written", len(md))
