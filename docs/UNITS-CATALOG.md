# Units catalog

Draft v0.1, 2026-10-06. Taxonomy, tiers, special-logic units, and verification sources. This file is the plan for the data in `packages/core/src/units/`. Once code exists, the code is the source of truth and this file explains the structure and the policies.

## 1. Coverage research

Checked 2026-10-06, used for coverage only (which quantity types people expect). Nothing is copied from either site; see ADR 0004.

- **unitconverters.net** groups roughly 80 converters into Common, Engineering, Heat, Fluids, Light, Electricity, Magnetism, Radiology, and Other.
- **onlineconversion.com** lists about 30 categories and highlights a popular set: Fractions, Length, Temperature, Speed, Volume, Weight, Cooking, Area, Fuel Economy, Currency.

Takeaway: the "popular" set on both sites is small and stable. That is our basic tier. The long tail is large, specialized, and rarely used. That is our advanced tier, loaded on demand.

## 2. Verification sources

Factors come from these, never from other converter sites.

| Source | Use |
|---|---|
| NIST Special Publication 811 (2008), Appendix B | Primary table of conversion factors to SI |
| NIST Handbook 44, Appendix C | US customary units and their relationships |
| BIPM SI Brochure, 9th edition (2019) | SI base and derived units, accepted non-SI units |
| International Yard and Pound Agreement (1959) | 1 yd = 0.9144 m exactly; 1 lb = 0.45359237 kg exactly |
| IEC 80000-13 | Binary prefixes (KiB, MiB) versus decimal (kB, MB) |
| NIST/NGS notice on the US survey foot (retired end of 2022) | Keep as a distinct advanced unit |

Every unit record carries `source` and `exact`. Exact factors are written as the defining number, not a rounded decimal.

## 3. Taxonomy

Two tiers at two levels:

- **Category tier.** Basic categories appear in the empty-state chips and in basic-mode searches. Advanced categories appear when searched or when advanced mode is on.
- **Unit tier.** Within any category, basic units appear first; advanced units appear under "Show all" or when searched directly.

### Group: everyday (basic categories)

The eight primary categories shown as empty-state chips are marked ★.

| Category | ★ | Basic units (proposed) | Advanced units (examples) |
|---|---|---|---|
| Length | ★ | mm, cm, m, km, in, ft, yd, mi | µm, nm, nautical mile, mil/thou, furlong, fathom, chain, light-year, AU, parsec, ångström, US survey foot, pica, point |
| Weight (mass) | ★ | mg, g, kg, t (metric ton), oz, lb, st | µg, carat, grain, troy oz, short ton, long ton, slug, dalton, hundredweight |
| Volume | ★ | mL, L, tsp, tbsp, fl oz, cup, pt, qt, gal | cm³, m³, in³, ft³, yd³, UK fl oz/pint/quart/gallon, US dry pint/quart/gallon, bushel, peck, oil barrel, board foot |
| Temperature | ★ | °C, °F, K | °R (Rankine) |
| Area | ★ | cm², m², km², in², ft², acre, hectare, mi² | yd², are, barn, section, rood |
| Speed | ★ | m/s, km/h, mph, knot, ft/s | km/s, cm/s, in/s, Mach (standard sea level), speed of light; pace (min/km, min/mi) as a reciprocal unit |
| Time | ★ | ms, s, min, h, day, week, month, year | µs, ns, fortnight, decade, century, millennium, sidereal day/year, shake |
| Data | ★ | bit, B, kB, MB, GB, TB | KiB, MiB, GiB, TiB, PB, kbit/Mbit/Gbit, nibble |
| Fuel economy | | mpg (US), mpg (UK), L/100 km, km/L | mi/L, gal/100 mi |
| Energy | | J, kJ, cal, kcal, Wh, kWh, BTU | MJ, GJ, erg, eV, ft·lbf, therm, hp·h, ton of TNT |
| Pressure | | Pa, kPa, bar, psi, atm, mmHg, inHg | hPa/mbar, MPa, kgf/cm², ksi, torr, inH₂O |
| Power | | W, kW, MW, hp (mechanical) | metric hp (PS), BTU/h, ton of refrigeration, ft·lbf/s |
| Angle | | °, rad, grad | arcminute, arcsecond, turn, NATO mil |
| Cooking | | (a lens over Volume and Weight, not a separate category) | ingredient-aware conversions later |

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

| Category or unit | Why it is special | Approach |
|---|---|---|
| Temperature | Affine: offset plus scale | `toBase` / `fromBase` functions; base is kelvin |
| Temperature interval | Linear, but 1 °C step ≠ 1 °C reading | Separate category |
| Fuel economy, pace | Reciprocal relationships (L/100 km vs km/L) | `toBase` / `fromBase` with 1/x; "Undefined for 0" |
| Data | Decimal (kB = 1000 B) vs binary (KiB = 1024 B) | Both families as distinct units; `KB` alias maps to decimal with a hint |
| Time: month, year | No single definition | Mean Gregorian: 1 year = 365.2425 d, 1 month = year/12; definition shown in the chip |
| Calorie | `cal` (thermochemical, 4.184 J) vs food Calorie (= kcal) | Two units; `Calorie`/`Cal` alias to kcal with a hint |
| Horsepower | Mechanical (745.6999 W) vs metric PS (735.49875 W) | Two units; `hp` → mechanical by default |
| Ton | Short (US), long (UK), metric | Three units; `ton` is ambiguous → locale default highlighted |
| Gallon, pint, quart, fl oz | US vs imperial | Two units each; locale default highlighted |
| Cup | US customary 236.588 mL, US legal 240 mL, metric 250 mL | US customary default; others advanced |
| Typography px | Depends on dpi | Assume 96 dpi; state it |
| Mach | Depends on conditions | Standard sea level 340.29 m/s; state it |

## 5. Aliases and disambiguation

Each unit lists the aliases people actually type: symbols with and without case (`ml`, `mL`), spellings (`litre`, `liter`), plurals, abbreviations (`tbsp`, `tbs`, `T`), and regional names. Category aliases cover everyday words (`distance`, `how far`, `fluids`, `liquid`, `temp`, `hot`, `storage`).

Ambiguity watchlist (exact matches across categories or variants): `m`, `oz`, `ton`, `gal`, `pt`, `qt`, `cup`, `cal`, `hp`, `mpg`, `kB`, `lb` (mass vs force), `mi`, `min`, `s`. These never auto-lock; the panel shows candidates with category labels.

No-match queries are the best signal for missing aliases. Log them (locally in dev, via analytics later) and review before each release.

## 6. Adding a category or unit

1. Create or open `packages/core/src/units/<category>.ts`.
2. Add the unit with `id`, `name`, `plural`, `symbol`, `aliases`, `system`, `tier`, `factor` or function pair, `exact`, `source`.
3. Add at least one golden test row from the cited source.
4. Add the unit to this catalog under the right tier.
5. If the unit introduces a definition choice (like cup), add it to the special-logic table.
