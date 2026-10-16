# Categories 1: what to add next

Written 2026-10-15 for Sean, who asked to explore other categories or things to add, with unitconverters.net as inspiration (the fifty-sixth pass in docs/research/findings-0-first-pass.md). Under ADR 0020 the reference sites are used freely; every factor of a new category is still checked on our own, by the accuracy audit's method (docs/research/accuracy-audit-1.md), before it ships.

## Coverage, re-checked

unitconverters.net, read 2026-10-15, lists about 80 converters in nine groups: Common, Engineering, Heat, Fluids, Light, Electricity, Magnetism, Radiology, and Other. bigsmall's 13 categories cover its Common group but for Force, dry volume, currency, and number bases (and a text case converter, not units). The catalog's plan for the long tail (docs/UNITS-CATALOG.md §3: mechanics, fluids, heat, electromagnetism, light, radiation, digital, deferred) already holds nearly everything else; the few it lacks are specialist (heating values per mass or volume, mass and molar flux, permeability, charge and current densities, magnetomotive force, lumber's board foot).

So coverage is not the question; order is. Each category was weighed on four things: whether people convert it outside a lab, whether Google's own converter box already answers it (it covers length, mass, volume, temperature, area, speed, time, data, and fuel), what it costs (plain factors, or a model of its own), and how it fits bigsmall.

## Recommended next, in order

1. **Data transfer rate** (Mbps, MB/s, Gbps, kB/s, KiB/s, and the rest). Internet plans are sold in megabits and downloads shown in megabytes, a factor of eight that trips everyone: a small b against a big B, which suits the name. Plain factors from the SI and IEC 80000-13 prefixes; about ten units.
2. **A temperature's difference** (°C, °F, K, °R as changes). Today the table converts a temperature, so a forecast's "5 °C warmer" reads as 41 °F where the change is 9 °F. A difference needs factors without the offsets. It fits the accuracy work: a second category, Temperature change, or a switch in Temperature (a design question for Sean).
3. **Force and torque** (N, kN, lbf, kgf, dyn; N·m, lbf·ft, lbf·in, kgf·m). A torque wrench's setting, a bike's or a car's specification, furniture's assembly sheet: everyday for many, and missing from Google's box. Plain factors from NIST SP 811.
4. **Pace** (min/km, min/mi, and by 400 m). Runners convert it constantly; it is speed's reciprocal and reads as minutes and seconds (`5:30 /km`), already an exploration with its design questions (docs/PLAN.md §2).
5. **Cooking by ingredient** (a cup of flour, sugar, or butter in grams). The most searched conversion of all that Google's box cannot do, since it needs each ingredient's density. A lens over Volume and Weight, as the catalog already says, with densities from a sourced table (USDA FoodData Central lists grams per cup). The largest of these, and the strongest for the pair pages (docs/research/seo-1.md).

Then, cheap once the first are in: **frequency** (Hz to GHz), **angular speed** (rpm, rad/s), **density**, **flow** (L/min, gal/min, cfm), and **acceleration** (m/s², g); and for designers, **typography and screens** (pt, pica, px at CSS's 96 to the inch, dpi and ppi), cited from the W3C's CSS Values.

## Deferred, and why

- **Currency.** Rates change daily and need a provider, fetched in the visitor's browser to keep no server (ADR 0001); "every number checked on our own" cannot hold the same way, and stale rates need saying. A decision of its own.
- **Clothing and shoe sizes.** Tables that differ by brand and region; not conversions, though much searched.
- **Sound.** Logarithmic, with reference levels (dB SPL, dBm, dBV): a model of its own.
- **Number bases, Roman numerals, text case.** Not units; tools for another day, if ever.
- **Time zones.** Daylight-saving rules; another product.
- **The specialist long tail** (heat, fluids, electricity, magnetism, radiation): cheap one by one, but each adds a tile to the start and a line to the category menu. They wait for a way to hold twenty or more categories (the start's tiles, the menu; "every category at once", docs/PLAN.md §2), which is Sean's design call when it comes.

## Each category, when built

docs/UNITS-CATALOG.md §6: sourced factors, checked blind as in the audit; the aliases people type; golden rows; the category in the start's tiles and the menu; its data loaded on demand against its budget (docs/PLAN.md §9); and, with the pair pages, its most searched pairs.
