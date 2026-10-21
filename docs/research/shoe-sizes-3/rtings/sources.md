# RTINGS: sources and the free-or-gated finding (2026-10-21)

## 1. Free or gated: gated. Nothing recorded.

RTINGS' table tool for running shoes (https://www.rtings.com/running-shoes/tools/table; the
footwear table at https://www.rtings.com/shoes/tools/table redirects to it, and the page's
category list holds no other footwear category with a table) does **not** show the internal-length
figures without a membership. Established from the page's own data, three ways, without opening a
review page, without a login, and without reading any measurement value:

1. **The column definitions mark the measures members-only.** The table page loads its columns
   with the public request `POST https://www.rtings.com/api/v2/safe/table_tool__column_options`,
   body `{"variables": {"silo_url_part": "running-shoes", "named_version": "public"}}`, no
   cookies, no credentials (the request the page's own script makes; saved as
   `downloads/column_options.json`). Of the 137 tests on the running-shoe test bench,
   133 carry `"insider_only": true`; the 4 that do not are: Weight, Heel Stack Height, Heel-To-Toe Drop, Plate.
   The fit measures:

   | original_id | name | kind | input unit | parent | insider_only |
   | ----------- | ---- | ---- | ---------- | ------ | ------------ |

| 31166 | Internal Shape | group | | | True |
| 26247 | Internal Length | number | millimeters | 31166 | True |
| 26249 | Internal Heel Width | number | millimeters | 31166 | True |
| 26248 | Internal Forefoot Width | number | millimeters | 31166 | True |
| 26264 | 3D Model Internal | 3d_model | | 31166 | True |
| 33794 | Wide Sizing Available | word | | 31166 | True |
| 30974 | Outsole Heel Width | number | millimeters | 26245 | True |
| 30975 | Outsole Arch Width | number | millimeters | 26245 | True |
| 30976 | Outsole Forefoot Width | number | millimeters | 26245 | True |

Internal Length, Internal Heel Width, and Internal Forefoot Width sit in the group "Internal
Shape", and every one of them, the group included, is `insider_only: true`. 2. **The page's structured data marks the gated cells not free.** The page's schema.org block
(`WebSite.hasPart`) declares `{"@type": "WebPageElement", "isAccessibleForFree": "False",
   "cssSelector": ".ld-paywall"}`, and the table tool's own script
(`https://i.rtings.com/assets/vite/assets/table-tool-BQcd9_JC.js`, saved as
`downloads/table-tool.js`) gives every table cell, the number cells included, the class
`ld-paywall` when the cell's `has_paywall` is set, and renders a blurred cell as a lock icon
(`t-icon i-lock`, class `locked_score_box`) or "N/A" in place of the value. 3. **The category is paywalled.** The page's own category data gives running shoes
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
308 tested products on 2026-10-21 (`tested_products_count`).

## 3. Every page and endpoint opened (2026-10-21, curl and Python urllib, plain browser user agent, no cookies)

| URL                                                                   | tool                             | gave                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| https://www.rtings.com/running-shoes/tools/table                      | curl                             | 200; the table page: the TableToolPage props (default columns), the schema.org paywall block, category list with `has_paywall`; no rows (they load by script). `downloads/running-shoes_tools_table.html`, props in `downloads/table_props/` |
| https://www.rtings.com/shoes/tools/table                              | curl                             | redirects to the running-shoes table                                                                                                                                                                                                         |
| https://www.rtings.com/running-shoes                                  | curl                             | 200; the category page, saved, not mined                                                                                                                                                                                                     |
| https://i.rtings.com/assets/vite/assets/table-tool-page-b-K0y49N.js   | curl                             | the page's script: the request names                                                                                                                                                                                                         |
| https://i.rtings.com/assets/vite/assets/table-tool-BQcd9_JC.js        | curl                             | the table's script: cell rendering, `ld-paywall`, blur, the data request names (`table_tool__column_options`, `table_tool__products_list`, `table_tool__test_results`, `table_tool__prices`)                                                 |
| https://i.rtings.com/assets/vite/assets/application-setup-ByQMN8DK.js | curl                             | shared setup, no table request                                                                                                                                                                                                               |
| https://i.rtings.com/assets/vite/assets/vue-helpers-DsDRYUTf.js       | curl                             | the query helper: a named query is `POST /api/v2/safe/<name>` with `{"variables": ...}`                                                                                                                                                      |
| POST https://www.rtings.com/api/v2/safe/table_tool__column_options    | Python urllib (`scripts/api.py`) | 200; the column definitions with `insider_only` per test (the finding above)                                                                                                                                                                 |

Not requested, by the boundary: `table_tool__test_results` (the values), `table_tool__products_list`,
any review page, any login or membership page.
