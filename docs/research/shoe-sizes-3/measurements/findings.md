# Worker B, the measurements: findings (2026-10-21)

The report as the worker returned it, saved by the orchestrator (the `orchestrate` skill, §4). 98 tool calls as the harness counted them (the worker counted about 96), 203,792 tokens, about 24 minutes.

I recorded 168 measured inside lengths. All of them come from one source, RunRepeat's lab, and almost all are at a single size: men's US 9 (one is men's US 7.5). RTINGS also measures the inside length of each shoe, but it sells those figures to members, so I recorded none of them. I found nobody else who publishes a measured inside length model by model. Clarks, Dr. Martens, Birkenstock, UGG and Crocs have no measurements anywhere I could reach. No source gave a women's-line figure.

## Which sources measure, by what method, and how much I recorded

- **RunRepeat lab (counted):** it measures "Internal length" in mm with a caliper on the shoe cut open, in men's US 9. I recorded 168 models across 15 of the 20 brands.
- **RTINGS (could not reach):** it reports "Internal Length" from a 3D model of each shoe's inside, and each review states the size tested (men's US 9 on the pages I saw). The figure is marked members-only on the page and in its JSON-LD ("isAccessibleForFree": "False"). The plain HTML still carries the numbers for search engines, but taking them would get around the paywall. My script had written 79 RTINGS rows before I saw this. I deleted those rows and the saved pages, and `pages_log.csv` lists each URL as paywalled, value not recorded.

## Source profiles

**RunRepeat** buys shoes and cuts one of each pair in half on "Cut in half: <model> Review" pages. Each review shows "Internal length … Test results <model> <x> mm Average <y> mm", and the same value appears again in the page's comparison table. My script read both copies and they agreed on all 164 pages that have both; 3 pages lack the table.

Its method, in its own words:

- Methodology page: "We always test in men's US 9" and "We buy the shoes in men's US 9. If not available in that size, we wait until it is." Conditions are "20°C/68°F ± 1°C and 55% ± 5% humidity". The internal length is measured on the cut shoe: "After measuring the internal length, we mark both places on the foam itself at 12% and 75% of the length."
- Testing-services page: "Stack heights, drop and internal length: World Athletics", one of "the base standards that we follow, though with modifications."
- Converse size-chart page: "We create gel molds of each shoe's interior … and even cut it open to measure the internal length with a caliper."
- Each review: "Our testing shows that internal length is not a great measure of fit."

What it does not say:

- It measures one pair per model and states no variance.
- It does not say where the heel and toe reference points are, or whether the insole stays in.
- Only 22 review pages name men's US 9 in their own text. None names another size next to a recorded figure, so the other 145 rely on the methodology page's statement alone.
- One older review states its own, different size in the sentence that gives the figure: Timberland Euro Hiker, "In a men's US size 7.5, we measured the internal length of the boot at 257.9 mm."
- It does not say whether a women's-only model would be measured in a women's size.
- Only reviews done under the newer method carry the figure. Older reviews name the test but give no result.

RunRepeat's brand size-chart pages copy the brands' charts and add cross-brand tables built from those charts. Both are copies, so I recorded no cell from them, only their sentences about the lab's own measurements.

**RTINGS** reports Internal Length, Heel Width and Forefoot Width under "Internal Shape". Its free pages (how-we-test, changelogs 0-8 to 0-16) give no step-by-step method for the length. A search summary says its 3D compare tool names an ARTEC Space Spider scanner.

## Per brand (RunRepeat, inside length, men's US 9 unless noted)

| Brand        | Models | Lowest (mm)                      | Highest (mm)                |
| ------------ | ------ | -------------------------------- | --------------------------- |
| On           | 22     | 264.7 (Cloud Waterproof)         | 273.6 (Cloudrunner 2)       |
| Brooks       | 20     | 267.0 (Cascadia Elite)           | 274.5 (Ghost Max 4)         |
| Puma         | 18     | 262.2 (Deviate Nitro Elite 4)    | 271.7 (Velocity Nitro 3)    |
| Nike         | 18     | 262.0 (Alphafly 3)               | 275.3 (Court Vision Low)    |
| adidas       | 16     | 264.2 (Adizero Adios Pro 3)      | 275.7 (Hyperboost Run)      |
| New Balance  | 16     | 265.6 (Fresh Foam Arishi v4)     | 276.0 (1906R)               |
| Asics        | 14     | 268.1 (Noosa Tri 16)             | 280.4 (Solution Speed FF 4) |
| HOKA         | 10     | 264.3 (Mach 6)                   | 270.4 (Speedgoat 6)         |
| Salomon      | 10     | 264.0 (Aero Glide 4)             | 273.4 (Thundercross)        |
| Reebok       | 10     | 265.6 (Nano 2.0)                 | 273.3 (Club C 85)           |
| Skechers     | 5      | 258.4 (Aero Tempo)               | 274.0 (GO RUN Max Road 6)   |
| Under Armour | 3      | 264.6 (Curry 11)                 | 269.8 (SlipSpeed)           |
| Vans         | 3      | 267.5 (Old Skool)                | 272.7 (Half Cab)            |
| Converse     | 2      | 271.0 (Run Star Hike)            | 280.1 (Chuck 70 High Top)   |
| Timberland   | 1      | 257.9 (Euro Hiker, men's US 7.5) | same                        |

- **Skechers** fell short of the ten asked for: RunRepeat has 13+ Skechers reviews and only 5 carry the figure.
- **Under Armour, Converse, Vans and Timberland** are short of five for the same reason.
- **Clarks, Dr. Martens, Birkenstock, UGG and Crocs** have no RunRepeat lab reviews: their catalog pages are empty or 404, and so are the product URLs I guessed.

**Claims** (`claims.csv`, 8 rows, each sentence found in the saved copy). The ones that bear on the brands:

- adidas: "Even though we always measured the internal length of adidas shoes in the same men's US size 9, we've gotten a wild range of numbers, from 260.1 mm to 280.4 mm!"
- All brands: "Having measured the internal length of over 1000 shoes in our lab, we discovered that it can range from 255 to 281 mm in the same US size 9!"
- Timberland: the Euro Hiker "runs true to the Timberland footwear size chart."

**Leads** (`leads.csv`, 176 rows):

- RunRepeat's "Size" verdict for each model. It is a wear-test judgment, so it is a lead, not a measurement.
- RTINGS, which would need a member's or licensed read.
- Retailers' charts with an insole column, all copies: Sportano for Converse, Scheels and Footshop for Dr. Martens.
- Method references: SATRA STD 225 (an inside-length gauge), ISO/TS 19408-1 (in-shoe shoe length) and a 3DBODY.TECH abstract.

## Could not reach

- RTINGS internal lengths, because of the paywall.
- RunRepeat has no figures for Clarks, Dr. Martens, Birkenstock, UGG or Crocs, and its sitemap index redirects to a 404.
- Searches in English, Japanese and Chinese found no retailer, magazine lab or fit-technology company that publishes a measured inside length per model.
- No women's figures from any source.

## Summary

1. Answer: only RunRepeat publishes a measured inside length per model that I could use; RTINGS measures one but keeps it behind a paywall.
2. 168 models across 15 brands, nearly all at men's US 9, one figure per model, no women's line.
3. Strongest finding: the method, a caliper on the cut shoe at men's US 9 (https://runrepeat.com/testing-methodology and https://runrepeat.com/size-charts/converse).
4. Strongest finding: the two copies of each figure on a page agree in all 164 checked, and the values run from 258.4 to 280.4 mm at men's US 9 (for example https://runrepeat.com/asics-solution-speed-ff-4).
5. Strongest finding: RunRepeat's own claim of 255 to 281 mm at US 9 over 1000+ shoes, and adidas alone 260.1 to 280.4 mm (https://runrepeat.com/guides/how-to-measure-shoe-size and https://runrepeat.com/size-charts/adidas).
6. Could not reach: RTINGS (paywall), and five brands with no source at all (Clarks, Dr. Martens, Birkenstock, UGG, Crocs).
7. Short of the target: Skechers 5, Under Armour 3, Vans 3, Converse 2, Timberland 1 (at men's 7.5).
8. All rows were read by script (urllib); none came through the fetcher. 79 RTINGS rows and their saved pages were deleted.
9. Tool calls: about 96 of 150.
10. Files: `scratchpad\shoe-sizes-3\measurements\`: measurements.csv, sources.md, claims.csv, leads.csv, pages_log.csv, scripts\, downloads\.
