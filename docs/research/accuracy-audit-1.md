# Accuracy audit 1: every factor, formula, and rule that makes a number

Done 2026-10-15. Asked for by Sean the same day ("verifying the accuracy of all equations and formulas", the fifty-sixth pass in docs/research/findings-0-first-pass.md), under ADR 0020: every factor checked on our own against the standard that defines it, wherever it was found. Two fixes shipped (`5203bb6`, `cfddbb3`), and Sean settled the two choices the same day (below).

## Method

- **Every factor recomputed twice, blind, by two methods.** Two reviewers had only the list of units (each one's id, name, symbol, and system) and never opened the repo.
  - **A derived** each factor from its defining chain, with exact fractions: the SI's defining constants, the 1959 yard and pound, the US gallon of 231 in³, the UK gallon of 4.54609 L, standard gravity, the International Table and thermochemical calories and BTUs.
  - **B looked each one up** in the primary tables: NIST SP 811 (2008) Appendix B.8 and B.9 with their bold exact markers and footnotes, NIST Handbook 44 (2026) Appendix C, the BIPM SI Brochure (9th edition), IAU 2012 Resolution B2 and 2015 Resolution B2, the UK Weights and Measures Act 1985 Schedule 1, and NIST's notice on the US survey foot. B also checked the 68 units SP 811 lists, and 30 of their variants, against its printed digits.
- **The diff ran through the engine itself**, `toBase()` at 1, 10, and 0.5 of every unit, at a relative tolerance of 1e-12, with each unit's exact-or-measured flag compared too.
- **Then the rules that turn a factor into what shows**, read in full and probed with scripts: the arithmetic parser (`parse.ts`), every locale's separators (`locale.ts`), significant digits (`format.ts`), places and fractions (`rounded.ts`), the URL (`url.ts`), and the paths a number takes into the box (a row taken, the calculator's send).

## Results

### Factors and formulas: 130 of 131 agree, one is a choice

- **130 of 131 units agree with both reviewers to 1e-12**, and every exact flag agrees. The one that differs is the therm, a choice between two definitions rather than an error (open with Sean, below).
- **The definitions both reviewers chose on their own, as core has them:** the international foot for every foot-based unit (the acre, fathom, furlong, and mile included; the US survey foot retired at the end of 2022); the nautical mile of 1852 m; the light-year in Julian years and the parsec as 648,000/π au (IAU); the US customary cup, tablespoon, teaspoon, and fluid ounce, not the food label's 240 mL cup; the oil barrel of 42 US gallons; the thermochemical calorie, 4.184 J, the food Calorie's; the International Table BTU; the mechanical horsepower, 550 ft·lbf/s; the standard atmosphere; the conventional mercury columns; the Gregorian mean month and year; and decimal data prefixes beside the binary ones.
- **The checks people do by hand** all come out right: −40 °C is −40 °F; 0 °C is 32 °F, 100 °C is 212 °F, 37 °C is 98.6 °F; a mile is 1.609344 km, a pound 0.45359237 kg, a US gallon 3.785411784 L; a tablespoon is 3 teaspoons; a UK gallon is 1.20095 US gallons; 30 mpg (US) is 7.84049 L/100 km; a kilowatt-hour is 3,412.14 BTU; a horsepower is 745.7 W; an atmosphere is 14.6959 psi; a gibibyte is 1.07374 GB; a light-year is 63,241.1 au, and a parsec 3.26156 light-years.

### The arithmetic: sound

Precedence (`^`, then `×` and `÷`, then `+` and `−`), `^` from the right (`2^3^2` is 512), a sign under a power (`−2^2` is −4), a signed exponent (`2^−3`), unfinished input read as far as it goes, division by zero (`5 ÷ 0`, `0^−1`), a power with no real value (`(−8)^0.5`), and amounts a double cannot hold (`1e400`, `1e−200 × 1e−200`) all behave as `parse.ts` documents. Two limits, neither a wrong number: implied multiplication (`2(3)`) is planned, not built (docs/PLAN.md §2), and `(−8)^(1/3)` says it has no real value, though its real cube root is −2, because `1/3` is not exact in a double (left as is: rare, and the message is honest).

### Numbers in every locale: fixed

A number written by `Intl.NumberFormat` and read back by the parser, as happens when a row's value goes into the box, failed in 11 of 36 locales: the Swiss ones group with an apostrophe (1'234'567.891 read as 1); Arabic, Persian, Bengali, Marathi, Nepali, and Burmese write their own digits; right-to-left locales put a direction mark before the minus; Arabic writes an exponent in letters. Fixed in `5203bb6`: the parser reads a normalized copy mapped back to what was typed, and a round-trip test covers 19 locales with negatives and exponents (docs/LEARNINGS.md, "Intl writes numbers a parser of ASCII cannot read back").

### Rounding: one fixed, one open

- **Float noise is handled:** a value is snapped to 12 significant digits before it is rounded, so 1.005 is 1.01 and 2.675 is 2.68 to two places, as a person expects, though the doubles sit just below.
- **Fixed in `cfddbb3`:** past a million, fractions mark a whole number "≈" when the value is not exactly it, and that compared against a fixed 1e-9, below a double's step at that size: 12,345 miles in feet (65,181,600 exactly) showed as approximate. Noise now grows with the value.
- **Open:** a tie below zero rounds up, toward larger values, in places and fractions (−2.5 to −2, −0.125 to −0.12, −0.5 to "> −1"), while the same tie above zero rounds away from it (2.5 to 3), and the table's own significant digits round −0.125 to −0.13 (below).

### The URL, the box, a row, a copy, the calculator

- The URL keeps a typed number's digits as typed (`123456789012345678` stays whole), writes arithmetic as its value, and reads back in the visitor's own decimal mark; a German visitor's `1.000` is written as `v=1000`.
- The table shows 6 significant digits; a value taken into the box, or sent from the calculator, comes at 10, with the locale's grouping, which the box now reads back in every locale; a copy takes what the row shows (docs/UX-SPEC.md §7).

## Settled with Sean

1. **The therm.** Core used the US legal therm, 105,480,400 J (NIST SP 811 "therm (U.S.)", based on a BTU at 59 °F), so in the converter 1 therm was 99,976 BTU; both reviewers chose 100,000 International Table BTU, 105,505,585.262 J, as the EIA, gas bills, and the UK define it. Sean (2026-10-15): the standard people expect. Now 100,000 BTU, exactly, with a golden row pinning 1 therm = 100,000 BTU.
2. **Ties below zero.** A tie rounded up, toward larger values, in places and fractions (−2.5 to −2, −0.5 to "> −1"). Sean (2026-10-15): fix it. Now a tie rounds away from zero, below zero as above it (−2.5 to −3, −0.125 to −0.13, −0.5 to −1), as the table's own digits do; "up" and "down" keep their directions.

**Naming notes** the reviewers raised, none of them a number: the gradian's standard symbol is "gon" (worth adding as an alias); the units the SI Brochure accepts beside the SI (the litre, the degree, the hour) are tagged `si` or `metric` unevenly, which shows nowhere since both list under the metric section; temperature's full names are "degree Celsius" and so on, where the converter says "Celsius" as Sean chose; SP 811 writes "Btu", and Handbook 44 "tn" for the short ton.

## Every unit

Core's value is one of the unit in its category's base unit, or the formula for temperature and the reciprocal units; A and B are the reviewers', blind. Rounded here to 12 significant digits; the diff compared full doubles.

### Length (base: meter)

| Unit                   | Core: 1 unit in the base | Derived (A)       | Looked up (B)     | Exact | Core cites                                                                                                                                                            | Verdict |
| ---------------------- | ------------------------ | ----------------- | ----------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| meter (m)              | 1                        | 1                 | 1                 | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (metre) and Table 7 (SI prefixes)                                                                                            | agrees  |
| kilometer (km)         | 1000                     | 1000              | 1000              | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (metre) and Table 7 (SI prefixes)                                                                                            | agrees  |
| centimeter (cm)        | 0.01                     | 0.01              | 0.01              | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (metre) and Table 7 (SI prefixes)                                                                                            | agrees  |
| millimeter (mm)        | 0.001                    | 0.001             | 0.001             | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (metre) and Table 7 (SI prefixes)                                                                                            | agrees  |
| inch (in)              | 0.0254                   | 0.0254            | 0.0254            | yes   | International Yard and Pound Agreement (1959): 1 yd = 0.9144 m exactly; NIST SP 811 (2008) Appendix B.8                                                               | agrees  |
| foot (ft)              | 0.3048                   | 0.3048            | 0.3048            | yes   | International Yard and Pound Agreement (1959): 1 yd = 0.9144 m exactly; NIST SP 811 (2008) Appendix B.8                                                               | agrees  |
| yard (yd)              | 0.9144                   | 0.9144            | 0.9144            | yes   | International Yard and Pound Agreement (1959): 1 yd = 0.9144 m exactly; NIST SP 811 (2008) Appendix B.8                                                               | agrees  |
| mile (mi)              | 1609.344                 | 1609.344          | 1609.344          | yes   | International Yard and Pound Agreement (1959): 1 yd = 0.9144 m exactly; NIST SP 811 (2008) Appendix B.8                                                               | agrees  |
| nanometer (nm)         | 1e-9                     | 1e-9              | 1e-9              | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (metre) and Table 7 (SI prefixes)                                                                                            | agrees  |
| micrometer (µm)        | 0.000001                 | 0.000001          | 0.000001          | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (metre) and Table 7 (SI prefixes)                                                                                            | agrees  |
| mil (mil)              | 0.0000254                | 0.0000254         | 0.0000254         | yes   | NIST SP 811 (2008) Appendix B.8: mil (0.001 in) = 2.54E-05 m (exact)                                                                                                  | agrees  |
| fathom (ftm)           | 1.8288                   | 1.8288            | 1.8288            | yes   | NIST Handbook 44, Appendix C: 1 fathom = 6 ft, 1 furlong = 660 ft; the international foot (0.3048 m), the US survey foot retired at the end of 2022 (NIST/NGS notice) | agrees  |
| furlong (fur)          | 201.168                  | 201.168           | 201.168           | yes   | NIST Handbook 44, Appendix C: 1 fathom = 6 ft, 1 furlong = 660 ft; the international foot (0.3048 m), the US survey foot retired at the end of 2022 (NIST/NGS notice) | agrees  |
| nautical mile (nmi)    | 1852                     | 1852              | 1852              | yes   | NIST SP 811 (2008) Appendix B.8: nautical mile = 1.852E+03 m (exact)                                                                                                  | agrees  |
| astronomical unit (au) | 149597870700             | 149597870700      | 149597870700      | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1 au = 149 597 870 700 m (exact)                                                                                           | agrees  |
| light-year (ly)        | 9460730472580000         | 9460730472580000  | 9460730472580000  | yes   | NIST SP 811 (2008) Appendix B.8: light year = 9.46073E+15 m; exact as c × 365.25 d (the Julian year), c = 299 792 458 m/s                                             | agrees  |
| parsec (pc)            | 30856775814900000        | 30856775814900000 | 30856775814900000 | yes   | NIST SP 811 (2008) Appendix B.8: parsec = 3.085678E+16 m; exact as 648 000/π au (IAU 2015 Resolution B2)                                                              | agrees  |

### Weight (base: kilogram)

| Unit                 | Core: 1 unit in the base | Derived (A)    | Looked up (B)  | Exact | Core cites                                                                                                                                   | Verdict |
| -------------------- | ------------------------ | -------------- | -------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| milligram (mg)       | 0.000001                 | 0.000001       | 0.000001       | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (kilogram) and Table 7 (SI prefixes)                                                                | agrees  |
| gram (g)             | 0.001                    | 0.001          | 0.001          | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (kilogram) and Table 7 (SI prefixes)                                                                | agrees  |
| kilogram (kg)        | 1                        | 1              | 1              | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (kilogram) and Table 7 (SI prefixes)                                                                | agrees  |
| metric ton (t)       | 1000                     | 1000           | 1000           | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1 t = 10³ kg                                                                                      | agrees  |
| ounce (oz)           | 0.028349523125           | 0.028349523125 | 0.028349523125 | yes   | International Yard and Pound Agreement (1959): 1 lb = 0.45359237 kg exactly; NIST SP 811 (2008) Appendix B.8                                 | agrees  |
| pound (lb)           | 0.45359237               | 0.45359237     | 0.45359237     | yes   | International Yard and Pound Agreement (1959): 1 lb = 0.45359237 kg exactly; NIST SP 811 (2008) Appendix B.8                                 | agrees  |
| stone (st)           | 6.35029318               | 6.35029318     | 6.35029318     | yes   | UK Weights and Measures Act 1985, Schedule 1: 1 stone = 14 lb; pound per the 1959 agreement                                                  | agrees  |
| microgram (µg)       | 1e-9                     | 1e-9           | 1e-9           | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (kilogram) and Table 7 (SI prefixes)                                                                | agrees  |
| carat (ct)           | 0.0002                   | 0.0002         | 0.0002         | yes   | NIST SP 811 (2008) Appendix B.8: carat, metric = 2.0E-04 kg (exact)                                                                          | agrees  |
| grain (gr)           | 0.00006479891            | 0.00006479891  | 0.00006479891  | yes   | NIST SP 811 (2008) Appendix B.8: grain = 6.479891E-05 kg (exact); 7000 gr = 1 lb                                                             | agrees  |
| troy ounce (oz t)    | 0.0311034768             | 0.0311034768   | 0.0311034768   | yes   | NIST SP 811 (2008) Appendix B.8: ounce (troy or apothecary) = 3.110348E-02 kg; exact as 480 gr                                               | agrees  |
| short ton (ton (US)) | 907.18474                | 907.18474      | 907.18474      | yes   | NIST SP 811 (2008) Appendix B.8: ton, short (2000 lb) = 9.071847E+02 kg; ton, long (2240 lb) = 1.016047E+03 kg; pound per the 1959 agreement | agrees  |
| long ton (ton (UK))  | 1016.0469088             | 1016.0469088   | 1016.0469088   | yes   | NIST SP 811 (2008) Appendix B.8: ton, short (2000 lb) = 9.071847E+02 kg; ton, long (2240 lb) = 1.016047E+03 kg; pound per the 1959 agreement | agrees  |

### Volume (base: liter)

| Unit                              | Core: 1 unit in the base | Derived (A)      | Looked up (B)    | Exact | Core cites                                                                                                                                                   | Verdict |
| --------------------------------- | ------------------------ | ---------------- | ---------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| milliliter (mL)                   | 0.001                    | 0.001            | 0.001            | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1 L = 1 dm³ = 10⁻³ m³; Table 7 (SI prefixes)                                                                      | agrees  |
| liter (L)                         | 1                        | 1                | 1                | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1 L = 1 dm³ = 10⁻³ m³; Table 7 (SI prefixes)                                                                      | agrees  |
| teaspoon (tsp)                    | 0.00492892159375         | 0.00492892159375 | 0.00492892159375 | yes   | NIST Handbook 44, Appendix C (US liquid measure): 1 gal = 231 in³ = 4 qt = 8 pt = 16 cups = 128 fl oz; 1 tbsp = 3 tsp = ½ fl oz; inch per the 1959 agreement | agrees  |
| tablespoon (tbsp)                 | 0.0147867647812          | 0.0147867647812  | 0.0147867647812  | yes   | NIST Handbook 44, Appendix C (US liquid measure): 1 gal = 231 in³ = 4 qt = 8 pt = 16 cups = 128 fl oz; 1 tbsp = 3 tsp = ½ fl oz; inch per the 1959 agreement | agrees  |
| fluid ounce (fl oz)               | 0.0295735295625          | 0.0295735295625  | 0.0295735295625  | yes   | NIST Handbook 44, Appendix C (US liquid measure): 1 gal = 231 in³ = 4 qt = 8 pt = 16 cups = 128 fl oz; 1 tbsp = 3 tsp = ½ fl oz; inch per the 1959 agreement | agrees  |
| cup (cup)                         | 0.2365882365             | 0.2365882365     | 0.2365882365     | yes   | NIST Handbook 44, Appendix C (US liquid measure): 1 gal = 231 in³ = 4 qt = 8 pt = 16 cups = 128 fl oz; 1 tbsp = 3 tsp = ½ fl oz; inch per the 1959 agreement | agrees  |
| pint (pt)                         | 0.473176473              | 0.473176473      | 0.473176473      | yes   | NIST Handbook 44, Appendix C (US liquid measure): 1 gal = 231 in³ = 4 qt = 8 pt = 16 cups = 128 fl oz; 1 tbsp = 3 tsp = ½ fl oz; inch per the 1959 agreement | agrees  |
| quart (qt)                        | 0.946352946              | 0.946352946      | 0.946352946      | yes   | NIST Handbook 44, Appendix C (US liquid measure): 1 gal = 231 in³ = 4 qt = 8 pt = 16 cups = 128 fl oz; 1 tbsp = 3 tsp = ½ fl oz; inch per the 1959 agreement | agrees  |
| gallon (gal)                      | 3.785411784              | 3.785411784      | 3.785411784      | yes   | NIST Handbook 44, Appendix C (US liquid measure): 1 gal = 231 in³ = 4 qt = 8 pt = 16 cups = 128 fl oz; 1 tbsp = 3 tsp = ½ fl oz; inch per the 1959 agreement | agrees  |
| cubic meter (m³)                  | 1000                     | 1000             | 1000             | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1 L = 1 dm³ = 10⁻³ m³; Table 7 (SI prefixes)                                                                      | agrees  |
| cubic inch (in³)                  | 0.016387064              | 0.016387064      | 0.016387064      | yes   | International Yard and Pound Agreement (1959): 1 in = 0.0254 m, so 1 in³ = 16.387064 cm³; 1 ft = 12 in, 1 yd = 3 ft                                          | agrees  |
| cubic foot (ft³)                  | 28.316846592             | 28.316846592     | 28.316846592     | yes   | International Yard and Pound Agreement (1959): 1 in = 0.0254 m, so 1 in³ = 16.387064 cm³; 1 ft = 12 in, 1 yd = 3 ft                                          | agrees  |
| cubic yard (yd³)                  | 764.554857984            | 764.554857984    | 764.554857984    | yes   | International Yard and Pound Agreement (1959): 1 in = 0.0254 m, so 1 in³ = 16.387064 cm³; 1 ft = 12 in, 1 yd = 3 ft                                          | agrees  |
| oil barrel (bbl)                  | 158.987294928            | 158.987294928    | 158.987294928    | yes   | NIST SP 811 (2008) Appendix B.8: barrel (for petroleum, 42 gallons (U.S.)) = 1.589873E-01 m³; exact as 42 US gal                                             | agrees  |
| imperial fluid ounce (fl oz (UK)) | 0.0284130625             | 0.0284130625     | 0.0284130625     | yes   | NIST SP 811 (2008) Appendix B.8: gallon (U.K.) = 4.54609E-03 m³ (exact); UK Weights and Measures Act 1985, Schedule 1: 1 gal = 8 pt = 160 fl oz              | agrees  |
| imperial pint (pt (UK))           | 0.56826125               | 0.56826125       | 0.56826125       | yes   | NIST SP 811 (2008) Appendix B.8: gallon (U.K.) = 4.54609E-03 m³ (exact); UK Weights and Measures Act 1985, Schedule 1: 1 gal = 8 pt = 160 fl oz              | agrees  |
| imperial gallon (gal (UK))        | 4.54609                  | 4.54609          | 4.54609          | yes   | NIST SP 811 (2008) Appendix B.8: gallon (U.K.) = 4.54609E-03 m³ (exact); UK Weights and Measures Act 1985, Schedule 1: 1 gal = 8 pt = 160 fl oz              | agrees  |

### Temperature (base: kelvin)

| Unit            | Core: 1 unit in the base      | Derived (A)                   | Looked up (B)                 | Exact | Core cites                                                    | Verdict |
| --------------- | ----------------------------- | ----------------------------- | ----------------------------- | ----- | ------------------------------------------------------------- | ------- |
| Celsius (°C)    | (v + 273.15) × 1              | (v + 273.15) × 1              | (v + 273.15) × 1              | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1: t/°C = T/K − 273.15 | agrees  |
| Fahrenheit (°F) | (v + 459.67) × 0.555555555556 | (v + 459.67) × 0.555555555556 | (v + 459.67) × 0.555555555556 | yes   | NIST SP 811 (2008) Appendix B.8: T/K = (t/°F + 459.67) / 1.8  | agrees  |
| kelvin (K)      | 1                             | 1                             | 1                             | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (kelvin)             | agrees  |
| Rankine (°R)    | (v + 0) × 0.555555555556      | (v + 0) × 0.555555555556      | (v + 0) × 0.555555555556      | yes   | NIST SP 811 (2008) Appendix B.8: T/K = (T/°R) / 1.8           | agrees  |

### Area (base: square-meter)

| Unit                    | Core: 1 unit in the base | Derived (A)   | Looked up (B) | Exact | Core cites                                                                                                       | Verdict |
| ----------------------- | ------------------------ | ------------- | ------------- | ----- | ---------------------------------------------------------------------------------------------------------------- | ------- |
| square centimeter (cm²) | 0.0001                   | 0.0001        | 0.0001        | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.4 (square metre) and Table 7 (SI prefixes)                                | agrees  |
| square meter (m²)       | 1                        | 1             | 1             | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.4 (square metre) and Table 7 (SI prefixes)                                | agrees  |
| square kilometer (km²)  | 1000000                  | 1000000       | 1000000       | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.4 (square metre) and Table 7 (SI prefixes)                                | agrees  |
| square inch (in²)       | 0.00064516               | 0.00064516    | 0.00064516    | yes   | International Yard and Pound Agreement (1959): 1 in = 0.0254 m exactly, squared; NIST SP 811 (2008) Appendix B.8 | agrees  |
| square foot (ft²)       | 0.09290304               | 0.09290304    | 0.09290304    | yes   | International Yard and Pound Agreement (1959): 1 in = 0.0254 m exactly, squared; NIST SP 811 (2008) Appendix B.8 | agrees  |
| acre (ac)               | 4046.8564224             | 4046.8564224  | 4046.8564224  | yes   | NIST Handbook 44, Appendix C: 1 acre = 43,560 ft² (international foot)                                           | agrees  |
| hectare (ha)            | 10000                    | 10000         | 10000         | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1 ha = 10⁴ m²                                                         | agrees  |
| square mile (mi²)       | 2589988.11034            | 2589988.11034 | 2589988.11034 | yes   | International Yard and Pound Agreement (1959): 1 in = 0.0254 m exactly, squared; NIST SP 811 (2008) Appendix B.8 | agrees  |
| square yard (yd²)       | 0.83612736               | 0.83612736    | 0.83612736    | yes   | International Yard and Pound Agreement (1959): 1 in = 0.0254 m exactly, squared; NIST SP 811 (2008) Appendix B.8 | agrees  |

### Speed (base: meter-per-second)

| Unit                      | Core: 1 unit in the base | Derived (A)    | Looked up (B)  | Exact | Core cites                                                                                                            | Verdict |
| ------------------------- | ------------------------ | -------------- | -------------- | ----- | --------------------------------------------------------------------------------------------------------------------- | ------- |
| meter per second (m/s)    | 1                        | 1              | 1              | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.4 (metre per second); Table 8 (hour = 3600 s)                                  | agrees  |
| kilometer per hour (km/h) | 0.277777777778           | 0.277777777778 | 0.277777777778 | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.4 (metre per second); Table 8 (hour = 3600 s)                                  | agrees  |
| mile per hour (mph)       | 0.44704                  | 0.44704        | 0.44704        | yes   | NIST SP 811 (2008) Appendix B.8: 1 mi/h = 0.44704 m/s exactly                                                         | agrees  |
| knot (kn)                 | 0.514444444444           | 0.514444444444 | 0.514444444444 | yes   | NIST SP 811 (2008) Appendix B.8: 1 nautical mile = 1852 m; 1 kn = 1852 m/h                                            | agrees  |
| foot per second (ft/s)    | 0.3048                   | 0.3048         | 0.3048         | yes   | International Yard and Pound Agreement (1959): 1 ft = 0.3048 m exactly                                                | agrees  |
| speed of light (c)        | 299792458                | 299792458      | 299792458      | yes   | BIPM SI Brochure, 9th ed. (2019), §2.2: the speed of light in vacuum c = 299 792 458 m/s, a defining constant (exact) | agrees  |

### Time (base: second)

| Unit             | Core: 1 unit in the base | Derived (A) | Looked up (B) | Exact | Core cites                                                                                                                                                | Verdict |
| ---------------- | ------------------------ | ----------- | ------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| millisecond (ms) | 0.001                    | 0.001       | 0.001         | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (second) and Table 7 (SI prefixes)                                                                               | agrees  |
| second (s)       | 1                        | 1           | 1             | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (second) and Table 7 (SI prefixes)                                                                               | agrees  |
| minute (min)     | 60                       | 60          | 60            | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1 min = 60 s, 1 h = 3600 s, 1 d = 86 400 s                                                                     | agrees  |
| hour (h)         | 3600                     | 3600        | 3600          | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1 min = 60 s, 1 h = 3600 s, 1 d = 86 400 s                                                                     | agrees  |
| day (d)          | 86400                    | 86400       | 86400         | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1 min = 60 s, 1 h = 3600 s, 1 d = 86 400 s                                                                     | agrees  |
| week (wk)        | 604800                   | 604800      | 604800        | yes   | Definition: 1 week = 7 days                                                                                                                               | agrees  |
| month (mo)       | 2629746                  | 2629746     | 2629746       | yes   | Gregorian calendar: 400-year cycle of 146,097 days gives a mean year of 365.2425 d; mean month = year / 12 (project definition, docs/UNITS-CATALOG.md §4) | agrees  |
| year (yr)        | 31556952                 | 31556952    | 31556952      | yes   | Gregorian calendar: 400-year cycle of 146,097 days gives a mean year of 365.2425 d; mean month = year / 12 (project definition, docs/UNITS-CATALOG.md §4) | agrees  |
| nanosecond (ns)  | 1e-9                     | 1e-9        | 1e-9          | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (second) and Table 7 (SI prefixes)                                                                               | agrees  |
| microsecond (µs) | 0.000001                 | 0.000001    | 0.000001      | yes   | BIPM SI Brochure, 9th ed. (2019), §2.3.1 (second) and Table 7 (SI prefixes)                                                                               | agrees  |

### Data (base: byte)

| Unit           | Core: 1 unit in the base | Derived (A)      | Looked up (B)    | Exact | Core cites                                                                          | Verdict |
| -------------- | ------------------------ | ---------------- | ---------------- | ----- | ----------------------------------------------------------------------------------- | ------- |
| bit (bit)      | 0.125                    | 0.125            | 0.125            | yes   | IEC 80000-13:2008: 1 B = 8 bit; SI prefixes are decimal (1 kB = 10³ B)              | agrees  |
| byte (B)       | 1                        | 1                | 1                | yes   | IEC 80000-13:2008: 1 B = 8 bit; SI prefixes are decimal (1 kB = 10³ B)              | agrees  |
| kilobyte (kB)  | 1000                     | 1000             | 1000             | yes   | IEC 80000-13:2008: 1 B = 8 bit; SI prefixes are decimal (1 kB = 10³ B)              | agrees  |
| megabyte (MB)  | 1000000                  | 1000000          | 1000000          | yes   | IEC 80000-13:2008: 1 B = 8 bit; SI prefixes are decimal (1 kB = 10³ B)              | agrees  |
| gigabyte (GB)  | 1000000000               | 1000000000       | 1000000000       | yes   | IEC 80000-13:2008: 1 B = 8 bit; SI prefixes are decimal (1 kB = 10³ B)              | agrees  |
| terabyte (TB)  | 1000000000000            | 1000000000000    | 1000000000000    | yes   | IEC 80000-13:2008: 1 B = 8 bit; SI prefixes are decimal (1 kB = 10³ B)              | agrees  |
| petabyte (PB)  | 1000000000000000         | 1000000000000000 | 1000000000000000 | yes   | IEC 80000-13:2008: 1 B = 8 bit; SI prefixes are decimal (1 kB = 10³ B)              | agrees  |
| kibibyte (KiB) | 1024                     | 1024             | 1024             | yes   | IEC 80000-13:2008: binary prefixes Ki = 2¹⁰, Mi = 2²⁰, Gi = 2³⁰, Ti = 2⁴⁰, Pi = 2⁵⁰ | agrees  |
| mebibyte (MiB) | 1048576                  | 1048576          | 1048576          | yes   | IEC 80000-13:2008: binary prefixes Ki = 2¹⁰, Mi = 2²⁰, Gi = 2³⁰, Ti = 2⁴⁰, Pi = 2⁵⁰ | agrees  |
| gibibyte (GiB) | 1073741824               | 1073741824       | 1073741824       | yes   | IEC 80000-13:2008: binary prefixes Ki = 2¹⁰, Mi = 2²⁰, Gi = 2³⁰, Ti = 2⁴⁰, Pi = 2⁵⁰ | agrees  |
| tebibyte (TiB) | 1099511627780            | 1099511627780    | 1099511627780    | yes   | IEC 80000-13:2008: binary prefixes Ki = 2¹⁰, Mi = 2²⁰, Gi = 2³⁰, Ti = 2⁴⁰, Pi = 2⁵⁰ | agrees  |
| pebibyte (PiB) | 1125899906840000         | 1125899906840000 | 1125899906840000 | yes   | IEC 80000-13:2008: binary prefixes Ki = 2¹⁰, Mi = 2²⁰, Gi = 2³⁰, Ti = 2⁴⁰, Pi = 2⁵⁰ | agrees  |
| kilobit (kbit) | 125                      | 125              | 125              | yes   | IEC 80000-13:2008: 1 B = 8 bit; SI prefixes are decimal (1 kB = 10³ B)              | agrees  |
| megabit (Mbit) | 125000                   | 125000           | 125000           | yes   | IEC 80000-13:2008: 1 B = 8 bit; SI prefixes are decimal (1 kB = 10³ B)              | agrees  |
| gigabit (Gbit) | 125000000                | 125000000        | 125000000        | yes   | IEC 80000-13:2008: 1 B = 8 bit; SI prefixes are decimal (1 kB = 10³ B)              | agrees  |

### Fuel economy (base: kilometer-per-liter)

| Unit                                 | Core: 1 unit in the base | Derived (A)      | Looked up (B)    | Exact | Core cites                                                                                                                               | Verdict |
| ------------------------------------ | ------------------------ | ---------------- | ---------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| liter per 100 kilometers (L/100 km)  | 100 ÷ v                  | 100 ÷ v          | 100 ÷ v          | yes   | Definition: L/100 km = 100 / (km/L); BIPM SI Brochure, 9th ed. (2019), Table 8 (litre) and Table 7 (SI prefixes)                         | agrees  |
| kilometer per liter (km/L)           | 1                        | 1                | 1                | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8 (litre) and Table 7 (SI prefixes)                                                              | agrees  |
| mile per US gallon (mpg (US))        | 0.42514370743            | 0.42514370743    | 0.42514370743    | yes   | NIST SP 811 (2008) Appendix B.8: mile per gallon (U.S.) = 4.251437E-01 km/L; exact from 1 mi = 1.609344 km, 1 gal (U.S.) = 3.785411784 L | agrees  |
| mile per imperial gallon (mpg (UK))  | 0.354006189935           | 0.354006189935   | 0.354006189935   | yes   | NIST SP 811 (2008) Appendix B.8: gallon (U.K.) = 4.54609E-03 m³ (exact); 1 mi = 1.609344 km (1959 agreement)                             | agrees  |
| US gallon per 100 miles (gal/100 mi) | 42.514370743 ÷ v         | 42.514370743 ÷ v | 42.514370743 ÷ v | yes   | Definition: gal/100 mi = 100 / (mi/gal); NIST SP 811 (2008) Appendix B.8: 1 mi = 1.609344 km, 1 gal (U.S.) = 3.785411784 L               | agrees  |

### Energy (base: joule)

| Unit                       | Core: 1 unit in the base | Derived (A)     | Looked up (B)   | Exact | Core cites                                                                                                                                                  | Verdict                     |
| -------------------------- | ------------------------ | --------------- | --------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| joule (J)                  | 1                        | 1               | 1               | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (joule = N·m) and Table 7 (SI prefixes)                                                                           | agrees                      |
| kilojoule (kJ)             | 1000                     | 1000            | 1000            | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (joule = N·m) and Table 7 (SI prefixes)                                                                           | agrees                      |
| kilocalorie (kcal)         | 4184                     | 4184            | 4184            | yes   | NIST SP 811 (2008) Appendix B.8: calorie, thermochemical = 4.184 J (exact)                                                                                  | agrees                      |
| calorie (cal)              | 4.184                    | 4.184           | 4.184           | yes   | NIST SP 811 (2008) Appendix B.8: calorie, thermochemical = 4.184 J (exact)                                                                                  | agrees                      |
| kilowatt-hour (kWh)        | 3600000                  | 3600000         | 3600000         | yes   | NIST SP 811 (2008) Appendix B.8: kilowatt hour = 3.6E+06 J (exact); BIPM SI Brochure, 9th ed. (2019), Table 8 (hour = 3600 s)                               | agrees                      |
| watt-hour (Wh)             | 3600                     | 3600            | 3600            | yes   | NIST SP 811 (2008) Appendix B.8: kilowatt hour = 3.6E+06 J (exact); BIPM SI Brochure, 9th ed. (2019), Table 8 (hour = 3600 s)                               | agrees                      |
| British thermal unit (BTU) | 1055.05585262            | 1055.05585262   | 1055.05585262   | yes   | NIST SP 811 (2008) Appendix B.8: British thermal unit, International Table = 1.055056E+03 J; exact from cal_IT = 4.1868 J, 1 lb = 453.59237 g, 1 °F = 5/9 K | agrees                      |
| megajoule (MJ)             | 1000000                  | 1000000         | 1000000         | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (joule = N·m) and Table 7 (SI prefixes)                                                                           | agrees                      |
| gigajoule (GJ)             | 1000000000               | 1000000000      | 1000000000      | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (joule = N·m) and Table 7 (SI prefixes)                                                                           | agrees                      |
| foot-pound (ft·lbf)        | 1.35581794833            | 1.35581794833   | 1.35581794833   | yes   | NIST SP 811 (2008) Appendix B.8: foot pound-force = 1.355818 J; exact from 1 ft = 0.3048 m, 1 lb = 0.45359237 kg, gₙ = 9.80665 m/s²                         | agrees                      |
| therm (thm)                | 105505585.262            | 105505585.262   | 105505585.262   | yes   | US EIA Glossary: therm = 100,000 Btu, with the International Table Btu (SP 811 footnote 9)                                                                  | agrees, since Sean's choice |
| electronvolt (eV)          | 1.602176634e-19          | 1.602176634e-19 | 1.602176634e-19 | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1 eV = 1.602 176 634 × 10⁻¹⁹ J (exact)                                                                           | agrees                      |

### Pressure (base: pascal)

| Unit                         | Core: 1 unit in the base | Derived (A)   | Looked up (B) | Exact | Core cites                                                                                                                                                                                           | Verdict |
| ---------------------------- | ------------------------ | ------------- | ------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| pascal (Pa)                  | 1                        | 1             | 1             | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (pascal = N/m²) and Table 7 (SI prefixes)                                                                                                                  | agrees  |
| kilopascal (kPa)             | 1000                     | 1000          | 1000          | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (pascal = N/m²) and Table 7 (SI prefixes)                                                                                                                  | agrees  |
| pound per square inch (psi)  | 6894.75729317            | 6894.75729317 | 6894.75729317 | yes   | NIST SP 811 (2008) Appendix B.8: pound-force per square inch = 6.894757E+03 Pa; exact from 1 lb = 0.45359237 kg, gₙ = 9.80665 m/s², 1 in = 0.0254 m                                                  | agrees  |
| bar (bar)                    | 100000                   | 100000        | 100000        | yes   | NIST SP 811 (2008) Appendix B.8: bar = 1.0E+05 Pa (exact)                                                                                                                                            | agrees  |
| atmosphere (atm)             | 101325                   | 101325        | 101325        | yes   | NIST SP 811 (2008) Appendix B.8: atmosphere, standard = 1.01325E+05 Pa (exact)                                                                                                                       | agrees  |
| millimeter of mercury (mmHg) | 133.322387415            | 133.322387415 | 133.322387415 | yes   | NIST SP 811 (2008) Appendix B.8: millimeter of mercury, conventional = 1.333224E+02 Pa; inch of mercury, conventional = 3.386389E+03 Pa; conventional mercury 13 595.1 kg/m³ under gₙ = 9.80665 m/s² | agrees  |
| inch of mercury (inHg)       | 3386.38864034            | 3386.38864034 | 3386.38864034 | yes   | NIST SP 811 (2008) Appendix B.8: millimeter of mercury, conventional = 1.333224E+02 Pa; inch of mercury, conventional = 3.386389E+03 Pa; conventional mercury 13 595.1 kg/m³ under gₙ = 9.80665 m/s² | agrees  |
| hectopascal (hPa)            | 100                      | 100           | 100           | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (pascal = N/m²) and Table 7 (SI prefixes)                                                                                                                  | agrees  |
| megapascal (MPa)             | 1000000                  | 1000000       | 1000000       | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (pascal = N/m²) and Table 7 (SI prefixes)                                                                                                                  | agrees  |

### Power (base: watt)

| Unit                      | Core: 1 unit in the base | Derived (A)    | Looked up (B)  | Exact | Core cites                                                                                                                                                     | Verdict |
| ------------------------- | ------------------------ | -------------- | -------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| watt (W)                  | 1                        | 1              | 1              | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (watt = J/s) and Table 7 (SI prefixes)                                                                               | agrees  |
| kilowatt (kW)             | 1000                     | 1000           | 1000           | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (watt = J/s) and Table 7 (SI prefixes)                                                                               | agrees  |
| horsepower (hp)           | 745.699871582            | 745.699871582  | 745.699871582  | yes   | NIST SP 811 (2008) Appendix B.8: horsepower (550 ft·lbf/s) = 7.456999E+02 W; exact from 1 ft = 0.3048 m, 1 lb = 0.45359237 kg, gₙ = 9.80665 m/s²               | agrees  |
| megawatt (MW)             | 1000000                  | 1000000        | 1000000        | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (watt = J/s) and Table 7 (SI prefixes)                                                                               | agrees  |
| metric horsepower (PS)    | 735.49875                | 735.49875      | 735.49875      | yes   | NIST SP 811 (2008) Appendix B.8: horsepower, metric = 7.354988E+02 W; exact as 75 kgf·m/s, gₙ = 9.80665 m/s²                                                   | agrees  |
| BTU per hour (BTU/h)      | 0.293071070172           | 0.293071070172 | 0.293071070172 | yes   | NIST SP 811 (2008) Appendix B.8: British thermal unit, International Table, per hour = 2.930711E-01 W; ton of refrigeration (12 000 Btu_IT/h) = 3.516853E+03 W | agrees  |
| ton of refrigeration (TR) | 3516.85284207            | 3516.85284207  | 3516.85284207  | yes   | NIST SP 811 (2008) Appendix B.8: British thermal unit, International Table, per hour = 2.930711E-01 W; ton of refrigeration (12 000 Btu_IT/h) = 3.516853E+03 W | agrees  |
| gigawatt (GW)             | 1000000000               | 1000000000     | 1000000000     | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (watt = J/s) and Table 7 (SI prefixes)                                                                               | agrees  |

### Angle (base: radian)

| Unit             | Core: 1 unit in the base | Derived (A)        | Looked up (B)      | Exact | Core cites                                                                                                                 | Verdict |
| ---------------- | ------------------------ | ------------------ | ------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------- | ------- |
| degree (°)       | 0.0174532925199          | 0.0174532925199    | 0.0174532925199    | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1° = (π/180) rad; 1′ = (1/60)° = (π/10 800) rad; 1″ = (1/60)′ = (π/648 000) rad | agrees  |
| radian (rad)     | 1                        | 1                  | 1                  | yes   | BIPM SI Brochure, 9th ed. (2019), Table 4 (radian = m/m)                                                                   | agrees  |
| gradian (grad)   | 0.0157079632679          | 0.0157079632679    | 0.0157079632679    | yes   | NIST SP 811 (2008) Appendix B.8: gon = 9.0E-01 degree (exact) = 1.570796E-02 rad                                           | agrees  |
| arcminute (′)    | 0.000290888208666        | 0.000290888208666  | 0.000290888208666  | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1° = (π/180) rad; 1′ = (1/60)° = (π/10 800) rad; 1″ = (1/60)′ = (π/648 000) rad | agrees  |
| arcsecond (″)    | 0.0000048481368111       | 0.0000048481368111 | 0.0000048481368111 | yes   | BIPM SI Brochure, 9th ed. (2019), Table 8: 1° = (π/180) rad; 1′ = (1/60)° = (π/10 800) rad; 1″ = (1/60)′ = (π/648 000) rad | agrees  |
| revolution (rev) | 6.28318530718            | 6.28318530718      | 6.28318530718      | yes   | Definition: 1 revolution = 360°; BIPM SI Brochure, 9th ed. (2019), Table 8: 1° = (π/180) rad                               | agrees  |

## Added since: Force and Torque (2026-10-15)

The same method for the first mechanics categories (docs/UNITS-CATALOG.md §3): two reviewers, blind, with only the units' ids, names, symbols, and systems, A deriving each factor from the 1959 pound, foot, and inch and standard gravity (gₙ = 9.80665 m/s², 3rd CGPM, 1901), B looking each up in NIST SP 811 (2008) Appendix B.8 and B.9 and the SI Brochure; the diff through `toBase()` at 1, 10, and 0.5. **All 14 agree with both to 1e-12, every exact flag too, and with NIST's printed seven digits to 1e-6.** NIST prints the pound-force rounded and gives its exact value under standard gravity in footnote 23, so the pound-force, the kip, and the torques built on them are exact by that definition, as core marks them; the kilogram-force centimeter and the newton centimeter are not printed and follow from the kilogram-force meter and the SI prefix.

### Force (base: newton)

| Unit                 | Core: 1 unit in the base | Derived (A)    | Looked up (B)  | NIST prints                                | Exact | Verdict |
| -------------------- | ------------------------ | -------------- | -------------- | ------------------------------------------ | ----- | ------- |
| newton (N)           | 1                        | 1              | 1              | (the base)                                 | yes   | agrees  |
| kilonewton (kN)      | 1000                     | 1000           | 1000           | (SI prefix)                                | yes   | agrees  |
| pound-force (lbf)    | 4.44822161526            | 4.44822161526  | 4.44822161526  | 4.448222E+00; footnote 23: 4.4482216152605 | yes   | agrees  |
| kilogram-force (kgf) | 9.80665                  | 9.80665        | 9.80665        | 9.80665E+00, exact                         | yes   | agrees  |
| dyne (dyn)           | 0.00001                  | 0.00001        | 0.00001        | 1.0E-05, exact                             | yes   | agrees  |
| ounce-force (ozf)    | 0.278013850954           | 0.278013850954 | 0.278013850954 | 2.780139E-01                               | yes   | agrees  |
| kip (kip)            | 4448.22161526            | 4448.22161526  | 4448.22161526  | 4.448222E+03                               | yes   | agrees  |

### Torque (base: newton meter)

| Unit                               | Core: 1 unit in the base | Derived (A)      | Looked up (B)    | NIST prints                   | Exact | Verdict |
| ---------------------------------- | ------------------------ | ---------------- | ---------------- | ----------------------------- | ----- | ------- |
| newton meter (N·m)                 | 1                        | 1                | 1                | (the base)                    | yes   | agrees  |
| pound-foot (lbf·ft)                | 1.35581794833            | 1.35581794833    | 1.35581794833    | 1.355818E+00                  | yes   | agrees  |
| pound-inch (lbf·in)                | 0.112984829028           | 0.112984829028   | 0.112984829028   | 1.129848E-01                  | yes   | agrees  |
| kilogram-force meter (kgf·m)       | 9.80665                  | 9.80665          | 9.80665          | 9.80665E+00, exact            | yes   | agrees  |
| kilogram-force centimeter (kgf·cm) | 0.0980665                | 0.0980665        | 0.0980665        | (not printed; kgf·m over 100) | yes   | agrees  |
| newton centimeter (N·cm)           | 0.01                     | 0.01             | 0.01             | (SI prefix)                   | yes   | agrees  |
| ounce-force inch (ozf·in)          | 0.00706155181423         | 0.00706155181423 | 0.00706155181423 | 7.061552E-03                  | yes   | agrees  |

## Added since: Pace (2026-10-16)

Speed's two paces (docs/UNITS-CATALOG.md §0) are reciprocal units, m/s = K ÷ pace. The same method, blind, with only the units' ids, names, symbols, and systems, one reviewer taking both parts: A deriving K from the definitions, B looking each definition up; then worked examples in exact fractions by two routes. **Both agree, exact by definition, and every example matches core's to 12 digits.**

| Unit                     | Core: K in m/s | Derived (A)              | Looked up (B)                                                                       | Exact | Verdict |
| ------------------------ | -------------- | ------------------------ | ----------------------------------------------------------------------------------- | ----- | ------- |
| minute per kilometer     | 1000/60        | 50/3 = 16.66666666666667 | 1 min = 60 s (SI Brochure, Table 8); kilo = 10³ (Table 7)                           | yes   | agrees  |
| minute per mile (min/mi) | 1609.344/60    | 16764/625 = 26.8224      | NIST SP 811 Appendix B.9: mile per minute = 2.682 24 E+01 m/s, exact; the 1959 mile | yes   | agrees  |

Worked examples: 5:30 /km is 10.9090909091 km/h (120/11); 10 km/h is 6:00 /km; 6 min/mi is 10 mph; 8 min/mi is 4.97096953790 min/km (4:58); 5:30 /km is 8.85139200000 min/mi (8:51). The golden rows hold the first four. Noted: since its V4.01 update (June 2026) the SI Brochure's Table 8 is titled "Non-SI units"; core's sources name the table, not its title. The US survey mile would give 2 parts per million more; core uses the international mile, as everywhere (ADR 0016).
