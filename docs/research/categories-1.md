# Categories 1: what to add next

Written 2026-10-15 for Sean, who asked to explore other categories or things to add, with unitconverters.net as inspiration (the fifty-sixth pass in docs/research/findings-0-first-pass.md). Under ADR 0020 the reference sites are used freely; every factor of a new category is still checked on our own, by the accuracy audit's method (docs/research/accuracy-audit-1.md), before it ships. Revised the same day with Sean's answers (below) and a correction: Google's own converter covers more than first read.

## Coverage, re-checked

unitconverters.net, read 2026-10-15, lists about 80 converters in nine groups: Common, Engineering, Heat, Fluids, Light, Electricity, Magnetism, Radiology, and Other. bigsmall's 13 categories cover its Common group but for Force, dry volume, currency, and number bases (and a text case converter, not units). The catalog's plan for the long tail (docs/UNITS-CATALOG.md §3: mechanics, fluids, heat, electromagnetism, light, radiation, digital, deferred) already holds nearly everything else; the few it lacks are specialist (heating values per mass or volume, mass and molar flux, permeability, charge and current densities, magnetomotive force, lumber's board foot).

So coverage is not the question; order is. Each category was weighed on four things: whether people convert it outside a lab; whether Google's own converter box already answers it (its help page lists temperature, length, mass, speed, volume, area, fuel, time, and data storage, and its units table energy, pressure, power, force, frequency, data rates, and angles; not torque, pace, a temperature change, or cooking by ingredient, and it shows one answer, never a table); what it costs (plain factors, or a model of its own); and how it fits bigsmall.

## Sean's answers (2026-10-15)

Wait to choose the pair pages until a few more categories are in, then pick what will be strongest in search; and include the useful niche ones people search, force and torque among them.

## Recommended next, in order

1. **Force and torque** (N, kN, lbf, kgf, dyn; N·m, lbf·ft, lbf·in, kgf·m), Sean's pick. **Built 2026-10-15** (docs/UNITS-CATALOG.md §3, the mechanics group), every factor checked blind as below; pace, a temperature change, and cooking were mocked in the categories lab, built on 2026-10-16, and the lab retired the same day (`docs/research/labs/README.md`; its last commit `7f86070`). A torque wrench's setting, a bike's or a car's specification, furniture's assembly sheet; a load rating in kN. Torque is missing from Google's box; force is in it, but its tables and pitfalls are not. The plan:
   - Two categories in a new mechanics group, the everyday units listed first (N, kN, lbf, kgf; N·m, lbf·ft, lbf·in) and the specialist after (dyn, ozf, kip; kgf·m, kgf·cm, ozf·in, N·cm).
   - The aliases people type: Nm, N-m, ft-lb, ft lbs, lb-ft, in-lb, in lbs, kN.
   - The pitfall said in the units' notes: torque and energy share N·m, so the foot-pound in Energy (work) and the pound-foot in Torque (turning) point to each other.
   - Factors from NIST SP 811 Appendix B, checked blind as in the audit, with golden rows.
   - Pairs with demand: Nm to ft-lb and back, in-lb to Nm, kN to lbs, N to lbf.
2. **A temperature change** (°C, °F, K, °R as changes). We do not have this: today Temperature converts a temperature, a point on its scale, through the offsets (0 °C is 32 °F), so a forecast's "5 °C warmer" reads as 41 °F, where the change is 9 °F. A change takes the same factors without the offsets: 1 °C of change is 1.8 °F, 1 K, and 1.8 °R. It comes up in weather ("five degrees warmer"), ovens ("25 °F lower" is 14 °C lower, not −4 °C), fevers, thermostats, and the lab. As its own small category, Temperature change, found by "temperature difference" or "change", since modes in a category were dropped (ADR 0016); four units, exact.
3. **Pace** (min/km, min/mi; s/100 m for swimming, min/500 m for rowing). Runners convert it constantly, and a treadmill speaks in km/h or mph, so pace sits best inside Speed as reciprocal units, as L/100 km sits in Fuel economy: one table then answers both "5:30 /km in mph" and "what pace is 10 km/h". It reads as minutes and seconds (`5:30 /km`) and is typed that way (`5:30`), which needs a duration's format and grammar, and the table's size order with reciprocal units present (docs/PLAN.md §2, "Pace"): a lab first.
4. **Data transfer rate** (Mbps, MB/s, Gbps, kB/s). We mostly have this already: Data converts amounts, and 100 Mbit is 12.5 MB, the same numbers as 100 Mbps in MB/s. A rate category would add the per-second units people type and search ("Mbps to MB/s") and per-hour ones (GB/h for streaming), cheaply, but Google's box has it too: lower than first ranked.
5. **Cooking by ingredient** (a cup of flour, sugar, or butter in grams). The most searched conversion Google's box cannot do, since it needs each ingredient's density, and the strongest for the pair pages (docs/research/seo-1.md). It fits bigsmall rather than needing a product of its own: typing "2 cups flour" in the one box would read the ingredient and show the amount in every unit, volume and weight together. What it takes:
   - Data: about thirty baking staples to start, each with its grams per cup from USDA FoodData Central, cited, and a note that densities vary (sifted, scooped, packed), so weights show with "≈".
   - The cup's definitions said plainly: the US customary 236.6 mL, the metric 250 mL, and the 240 mL on US nutrition labels.
   - Design in a lab first: how an ingredient is typed and shown in the box, how the table puts volume and weight together, and how a stick of butter or an egg is counted.
   - Recipe scaling and the like could grow from it later; that would be the point to ask whether it is a product of its own.

Then, cheap once the first are in: **frequency** (Hz to GHz), **angular speed** (rpm, rad/s), **density**, **flow** (L/min, gal/min, cfm), and **acceleration** (m/s², g); and for designers, **typography and screens** (pt, pica, px at CSS's 96 to the inch, dpi and ppi), cited from the W3C's CSS Values.

## Deferred, and why

- **Currency.** Rates change daily and need a provider, fetched in the visitor's browser to keep no server (ADR 0001); "every number checked on our own" cannot hold the same way, and stale rates need saying. A decision of its own.
- **Clothing and shoe sizes.** Tables that differ by brand and region; not conversions, though much searched.
- **Sound.** Logarithmic, with reference levels (dB SPL, dBm, dBV): a model of its own.
- **Number bases, Roman numerals, text case.** Not units; tools for another day, if ever.
- **Time zones.** Daylight-saving rules; another product.
- **The specialist long tail** (heat, fluids, electricity, magnetism, radiation): cheap one by one, but each adds a tile to the start and a line to the category menu. They wait for a way to hold twenty or more categories (the start's tiles, the menu; "every category at once", docs/PLAN.md §2), which is Sean's design call when it comes.

## The category menu, open (2026-10-16)

With Force and Torque the open menu ran past a phone's window. The categories lab's round 2b showed it three ways (screenshot: `docs/research/labs/categories-lab/1-menu-open-three-ways.png`; the mocks lived in `apps/web/src/pages/dev/_categories-lab/` until the commit that built the answer): A, as long as its list; B, held to a height and scrolling inside; C, two columns. Sean chose C with B as its fallback, down the first column and then the second (the sixty-third pass); built the same day (docs/UX-SPEC.md §1), and the lab's section removed. Past twenty categories or so: three columns where there is room, or groups (docs/PLAN.md §2, "Grouping categories").

## Each category, when built

docs/UNITS-CATALOG.md §6: sourced factors, checked blind as in the audit; the aliases people type; golden rows; the category in the start's tiles and the menu; its data loaded on demand against its budget (docs/PLAN.md §9); and, with the pair pages, its most searched pairs (docs/SEO.md §2).
