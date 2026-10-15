# Units catalog

v0.3, 2026-10-15. Taxonomy, tiers, special-logic units, and verification sources. The code in `packages/core/src/units/` is the source of truth; this file explains the structure and the policies.

## 0. Implementation status

Milestone 1 (2026-10-06): all eight primary categories ship their basic tier, 54 units, every one cited and covered by a golden test row. Base units: meter, kilogram, liter, kelvin, square meter, meter per second, second, byte.

2026-10-08: Energy, Pressure, Power, and Angle join, 35 units with their specialist ones, every one cited and covered by a golden row (base units: joule, pascal, watt, radian). Fuel economy follows the same day, 5 units (base: kilometer per liter), its reciprocal units saying "Undefined for 0" where they have no value. With the modes dropped, the table lists every unit, the specialist ones after all the everyday ones (ADR 0016). The first eight categories gain their specialist units the same day, 36 more (nanometers to parsecs, micrograms to long tons, cubic meters and imperial measures to oil barrels, Rankine, square yards, nanoseconds, binary prefixes and bits).

Alias decisions so far (each one changes the ranking, and so which row Enter takes; see docs/UX-SPEC.md §4 and §5):

- `kilo`/`kilos` → kilogram, `cc` → milliliter, `kph`/`kmh` → kilometer per hour: colloquial, so they count as exact matches.
- `oz` is also an alias of fluid ounce on purpose: it makes "oz" ambiguous, so the list shows both ounces, each with its category, and the choice is visible before Enter.
- No alias claims `ton` or `mpg`: typing either offers every ton (short, long, metric) or both mpgs, the visitor's everyday one first (2026-10-08). No lowercase `b` for bit (it would collide with byte's `B` inside the category).
- `mbar` and `millibar` → hectopascal, the same size, an alias rather than a second row; `food calories` and `large calories` → kilocalorie, while `cal` and `calories` are the small calorie, the standard (Sean, 2026-10-08).
- `gr` is the grain's symbol, and grams answer to `g`; typing `gr` offers grains, then grams (Sean, 2026-10-08). `c` is Celsius's alias and the speed of light's symbol; the everyday unit leads.
- Unit `note` fields carry the definition for anything with a variant or a common mix-up, and since 2026-10-08 for the specialist and newer units that need one (the atmosphere, the mercury columns, the calories, the BTU and the therm, the horsepowers, the UK measures, the tons): bit and byte; the decimal data prefixes (kB, MB, GB, TB); tonne, ounce, and stone; knot; kelvin; month and year; and the US liquid family (teaspoon, tablespoon, fluid ounce, cup, pint, quart, gallon). The UI does not show notes yet (docs/UX-SPEC.md §14).

## 1. Coverage research

Checked 2026-10-06, used for coverage only (which quantity types people expect). Nothing is copied from either site; see ADR 0004.

- **unitconverters.net** groups roughly 80 converters into Common, Engineering, Heat, Fluids, Light, Electricity, Magnetism, Radiology, and Other.
- **onlineconversion.com** lists about 30 categories and highlights a popular set: Fractions, Length, Temperature, Speed, Volume, Weight, Cooking, Area, Fuel Economy, Currency.

Takeaway: the "popular" set on both sites is small and stable. That is our basic tier. The long tail is large, specialized, and rarely used. That is our advanced tier, loaded on demand.

## 2. Verification sources

Factors come from these, never from other converter sites.

| Source                                                      | Use                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| NIST Special Publication 811 (2008), Appendix B             | Primary table of conversion factors to SI             |
| NIST Handbook 44, Appendix C                                | US customary units and their relationships            |
| BIPM SI Brochure, 9th edition (2019)                        | SI base and derived units, accepted non-SI units      |
| International Yard and Pound Agreement (1959)               | 1 yd = 0.9144 m exactly; 1 lb = 0.45359237 kg exactly |
| IEC 80000-13                                                | Binary prefixes (KiB, MiB) versus decimal (kB, MB)    |
| NIST/NGS notice on the US survey foot (retired end of 2022) | Keep as a distinct advanced unit                      |

Every unit record carries `source` and `exact`. Exact factors are written as the defining number, not a rounded decimal.

## 3. Taxonomy

Two tiers at two levels:

- **Category tier.** Every category the engine has is listed on the start and in the category menu (ADR 0016). The advanced groups below are planned for loading on demand (milestone 3); how a long list of categories is divided is decided when they arrive.
- **Unit tier.** Every unit is listed in its category's table, basic and advanced alike (ADR 0016). The tier places it: basic units are listed by system, advanced ones after them all, each group smallest to largest (ADR 0011); and among equal matches, or exact ones, basic comes first. A unit everyday in one region is basic (the UK fluid ounce, pint, and gallon; the US short ton). The tier is kept with care on every unit: Settings' Specialty switch shows or hides the advanced ones (ADR 0018). An advanced unit is one someone converts for a trade, a hobby, or the news; retired units, units that depend on conditions, a second name for a unit already listed (an alias instead), and curiosities stay out.

### Group: everyday (basic categories)

The categories that ship are marked ★: the first eight since milestone 1, and Fuel economy, Energy, Pressure, Power, and Angle since 2026-10-08.

The ★ rows ship with exactly these basic units, and the advanced column is what shipped (2026-10-08), with what was left out after "not:".

| Category      | ★   | Basic units                                              | Advanced units (examples)                                                                                                                                                              |
| ------------- | --- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Length        | ★   | mm, cm, m, km, in, ft, yd, mi                            | nm, µm, mil (thou), fathom, furlong, nautical mile, au, light-year, parsec; not: chain, ångström (its Å folds to "a" in search), US survey foot (retired), pica and point (typography) |
| Weight (mass) | ★   | mg, g, kg, t (metric ton), oz, lb, st                    | µg, carat, grain, troy oz, short ton, long ton; not: slug, dalton, hundredweight                                                                                                       |
| Volume        | ★   | mL, L, tsp, tbsp, fl oz, cup, pt, qt, gal                | m³, in³, ft³, yd³, UK fl oz, pint, and gallon, oil barrel; not: cm³ (mL's alias cc), UK quart, US dry measures, bushel, peck, board foot                                               |
| Temperature   | ★   | °C, °F, K                                                | °R (Rankine)                                                                                                                                                                           |
| Area          | ★   | cm², m², km², in², ft², acre, hectare, mi²               | yd²; not: are, barn, section, rood                                                                                                                                                     |
| Speed         | ★   | m/s, km/h, mph, knot, ft/s                               | speed of light; not: km/s, cm/s, in/s, Mach (depends on the air's temperature), pace (min/km, min/mi; a reciprocal, held for its own design, docs/PLAN.md §2)                          |
| Time          | ★   | ms, s, min, h, day, week, month, year                    | ns, µs; not: fortnight, decade, century, millennium, sidereal day and year, shake                                                                                                      |
| Data          | ★   | bit, B, kB, MB, GB, TB                                   | PB, KiB, MiB, GiB, TiB, PiB, kbit, Mbit, Gbit; not: nibble                                                                                                                             |
| Fuel economy  | ★   | mpg (US), mpg (UK), L/100 km, km/L                       | gal/100 mi (US); not: mi/L                                                                                                                                                             |
| Energy        | ★   | J, kJ, cal, kcal, Wh, kWh, BTU                           | MJ, GJ, ft·lbf, therm (US), eV; not: erg, hp·h, ton of TNT                                                                                                                             |
| Pressure      | ★   | Pa, kPa, bar, psi, atm, mmHg, inHg                       | hPa (millibar its alias), MPa; not: kgf/cm², ksi, torr, inH₂O                                                                                                                          |
| Power         | ★   | W, kW, MW, hp (mechanical)                               | metric hp (PS), BTU/h, ton of refrigeration, GW; not: ft·lbf/s                                                                                                                         |
| Angle         | ★   | °, rad, grad                                             | arcminute, arcsecond, revolution; not: NATO mil                                                                                                                                        |
| Cooking       |     | (a lens over Volume and Weight, not a separate category) | ingredient-aware conversions later                                                                                                                                                     |

### Group: mechanics (advanced)

Force, Torque, Acceleration, Density, Angular velocity, Angular acceleration, Moment of inertia, Specific volume.

### Group: fluids (advanced)

Volumetric flow, Mass flow, Dynamic viscosity, Kinematic viscosity, Surface tension, Concentration (molar, mass).

### Group: heat (advanced)

Temperature interval, Thermal conductivity, Specific heat capacity, Heat flux, Heat transfer coefficient, Thermal resistance, Thermal expansion.

### Group: electromagnetism (advanced)

Charge, Current, Voltage, Resistance, Conductance, Capacitance, Inductance, Resistivity, Magnetic flux, Magnetic flux density, Magnetic field strength.

### Group: light (advanced)

Luminance, Luminous intensity, Illuminance, Frequency and wavelength.

### Group: radiation (advanced)

Activity, Absorbed dose, Equivalent dose, Exposure.

### Group: digital (advanced)

Data transfer rate, Image resolution (dpi/ppi), Typography (pt, px at an assumed 96 dpi, pica).

### Deferred

Currency (live rates), Clothing and shoe sizes (lookup tables), Sound (logarithmic), Number bases, Fractions (a formatter, not a converter), Date/time zones, SI prefix tool, Fun units.

## 4. Special logic

| Category or unit           | Why it is special                                                                      | Approach                                                                                                                                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Temperature                | Affine: offset plus scale                                                              | Add the `offset`, then multiply by the `factor`; base is kelvin                                                                                                                                                                                |
| Temperature interval       | Linear, but 1 °C step ≠ 1 °C reading                                                   | Separate category                                                                                                                                                                                                                              |
| Fuel economy, pace         | Reciprocal relationships (L/100 km vs km/L)                                            | `toBase` / `fromBase` with 1/x; "Undefined for 0"                                                                                                                                                                                              |
| Data                       | Decimal (kB = 1000 B) vs binary (KiB = 1024 B)                                         | Both families as distinct units; `KB` alias maps to decimal with a hint                                                                                                                                                                        |
| Time: month, year          | No single definition                                                                   | Mean Gregorian: 1 year = 365.2425 d, 1 month = year/12; definition in the unit note                                                                                                                                                            |
| Calorie                    | `cal` (thermochemical, 4.184 J) vs food Calorie (= kcal)                               | Two units. Search folds case, so `Cal` cannot differ from `cal`: `cal` and `calories` are the small calorie; `kcal`, `food calories`, and `large calories` the kilocalorie; each note says which is which                                      |
| Horsepower                 | Mechanical (745.6999 W) vs metric PS (735.49875 W)                                     | Two units; `hp` and `bhp` are mechanical, `PS` and `cv` metric                                                                                                                                                                                 |
| Ton                        | Short (US), long (UK), metric                                                          | Three units; no alias claims `ton`, so typing it offers all three, the visitor's everyday ton first: the short ton in the US, the tonne elsewhere, the long ton being a specialist unit                                                        |
| Gallon, pint, quart, fl oz | US vs imperial                                                                         | Two units each (the UK fluid ounce, pint, and gallon since 2026-10-08, marked `(UK)`, everyday units); the plain word (`gallon`, `pint`) names the US unit and the UK one is offered beside it                                                 |
| Cup                        | US customary 236.588 mL, US legal 240 mL, metric 250 mL                                | US customary default; others advanced                                                                                                                                                                                                          |
| Typography px              | Depends on dpi                                                                         | Assume 96 dpi; state it                                                                                                                                                                                                                        |
| Mach                       | Depends on conditions                                                                  | Standard sea level 340.29 m/s; state it                                                                                                                                                                                                        |
| mmHg, inHg                 | A mercury column depends on its density and on gravity                                 | Conventional: 13 595.1 kg/m³ under gₙ = 9.80665 m/s², as NIST SP 811 lists them                                                                                                                                                                |
| BTU, therm                 | Several definitions (International Table, thermochemical, 59 °F; the EC and US therms) | The International Table BTU; the US therm, the unit of US gas bills                                                                                                                                                                            |
| mpg                        | A US and an imperial gallon                                                            | Two units, `mpg (US)` and `mpg (UK)`; no alias claims `mpg`, so typing it offers both, the visitor's own first                                                                                                                                 |
| Millibar                   | The same size as the hectopascal                                                       | An alias of the hectopascal, not a second row                                                                                                                                                                                                  |
| Degree sign                | `°` alone is an angle; before C or F it belongs to the scale                           | Folded away only before a letter (`normalize.ts`), so `45°` finds the degree and `F` or `°F` Fahrenheit; search also indexes each scale's symbol with its sign (`compactKeyWithDegree`), so a typed `°` offers °C, °F, and °R after the degree |

## 5. Aliases and disambiguation

Each unit lists the aliases people actually type: symbols with and without case (`ml`, `mL`), spellings (`litre`, `liter`), plurals, abbreviations (`tbsp`, `tbs`), and regional names. Category aliases cover everyday words (`distance`, `how far`, `fluids`, `liquid`, `temp`, `hot`, `storage`).

An alias is added only when people really type it to mean that unit. It counts as an exact match, so it outranks every prefix match in other categories (`kilo` puts kilogram above kilometer, docs/UX-SPEC.md §4). An alias that makes a symbol ambiguous is deliberate (`oz` on fluid ounce), and the list then shows each unit with its category.

Ambiguity watchlist (exact matches across categories or variants): `c` (Celsius's alias, the speed of light's symbol; the everyday unit leads), `m`, `oz`, `ton`, `gal`, `pt`, `qt`, `cup`, `cal`, `hp`, `mpg`, `kB`, `lb` (mass vs force), `mi`, `min`, `s`, `gr` (the grain's symbol, which some write for grams), `degrees` (the Temperature category's word and the angle's unit), and `′` `″` (arcminute and arcsecond, which planned feet-and-inches entry may write for feet and inches). Nothing commits until Enter or a pick, and for these the list shows every candidate with its category, so the choice is visible before committing.

No-match queries are the best signal for missing aliases. Log them (locally in dev, via analytics later) and review before each release.

## 6. Adding a category or unit

1. Create or open `packages/core/src/units/<category>.ts`. Write units most common first: lists order them by tier, by the visitor's system, and by size (ADR 0011, ADR 0016), and this order breaks ties and orders a category with no size (temperature).
2. Add the unit with `id`, `category`, `name`, `plural`, `symbol`, `aliases`, `system`, `tier`, its `kind` with a `factor` (plus an `offset` when affine) or a function pair, `exact`, `source`, and a `note` when its definition has a variant.
3. Add at least one golden row from the cited source in `packages/core/test/golden/<category>.ts`.
4. Add the unit to this catalog under the right tier.
5. If the unit introduces a definition choice (like cup), add it to the special-logic table.
6. A new category also needs its id in `CategoryId` (`src/types.ts`), its file registered in `src/units/index.ts`, its golden file listed in `test/golden/index.ts`, and its id in the category lists of `test/registry.test.ts` and `test/search.test.ts`, all under `packages/core`.
