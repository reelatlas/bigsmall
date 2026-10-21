# Worker D, RTINGS' free tables: findings (2026-10-21)

The report as the worker returned it, saved by the orchestrator (the `orchestrate` skill, §4). 29 tool calls, 94,725 tokens, about 3 minutes. Run on Sean's call that RTINGS' table figures are free data (the hundred-and-thirtieth pass), with the brief's stop rule: establish the free-or-gated boundary first, and record nothing if the table is gated.

RTINGS' table figures are gated. Internal length and both internal widths are members-only on the table, so I recorded no figure. Following the brief, I stopped once that was clear. `measurements.csv` has its header row only.

**Free or gated: gated.** The page's own data says so in three ways. I worked this out without opening a review page, logging in, or reading any measured value.

1. **The columns are flagged members-only.** The table page (https://www.rtings.com/running-shoes/tools/table) loads its column definitions with a public request, the same one the page's script makes, with no cookies and nothing personal sent: `POST https://www.rtings.com/api/v2/safe/table_tool__column_options` with `{"variables":{"silo_url_part":"running-shoes","named_version":"public"}}`.
   - The running-shoe test bench has 137 tests, and 133 of them carry `"insider_only": true`.
   - Only four are free: Weight, Heel Stack Height, Heel-To-Toe Drop and Plate.
   - Internal Length (id 26247, in millimetres), Internal Heel Width (26249) and Internal Forefoot Width (26248) are all `insider_only: true`. So is the group they sit in, "Internal Shape" (31166). The outsole widths are members-only too.
2. **The page's structured data marks the table cells as not free.** Its schema.org block declares `"isAccessibleForFree": "False"` for `cssSelector: ".ld-paywall"`. The table's script (`table-tool-BQcd9_JC.js`) puts the class `ld-paywall` on every cell, number cells included, whenever the cell is flagged paywalled. A blurred cell shows a lock icon or "N/A" instead of the value.
3. **The whole category is paywalled.** The page's category data gives running shoes `"has_paywall": true` and a free-review limit of 3.

**What I deliberately did not request:** the values request (`table_tool__test_results`), the product list (`table_tool__products_list`), any review page, and any login or membership page.

**Footwear scope.** https://www.rtings.com/shoes/tools/table redirects to the running-shoes table. The site's category list shows no other footwear category with a table. RTINGS listed 308 tested running shoes on 2026-10-21.

**RTINGS' method:** not gathered, because the brief says to stop once the figures are gated. The column definitions only show that Internal Length is entered in millimetres and displayed with inches as a second unit. It sits beside a "3D Model Internal" test, which may mean the inside is measured from a 3D model. That is my guess from field names, not RTINGS' words, and shouldn't be cited.

**Per brand:** nothing for any of the twenty brands. No shoe counts, sizes tested or internal lengths were taken.

**What could not be reached:** every internal length, internal heel width and internal forefoot width in RTINGS' running-shoe table (members-only), and RTINGS' method pages (not gathered, per the stop rule).

## Summary

1. The answer: RTINGS' internal-length figures are members-only in the free table, so nothing was recorded.
2. Strongest finding: Internal Length and both internal widths carry `insider_only: true` in the table's own column definitions (`table_tool__column_options`).
3. Second finding: the page's schema.org data marks `.ld-paywall` content `isAccessibleForFree: False`, and the table's script puts that class on its cells (running-shoes table page and `table-tool-BQcd9_JC.js`).
4. Third finding: only Weight, Heel Stack Height, Heel-To-Toe Drop and Plate are free, out of 137 tests (same request).
5. Could not reach: every internal measure for all twenty brands, and RTINGS' method pages.
6. The values request, the product list, review pages and logins were never touched.
7. If the owner's letter to RTINGS brings permission, bigsmall can use these figures after all. Running shoes is the only footwear category with a table.
8. Tool calls: 28 of 80.
9. Files: `rtings/sources.md`, `rtings/measurements.csv` (header only), `rtings/column_options.json` (the column definitions, kept as the evidence), scripts in `rtings/scripts/`.
