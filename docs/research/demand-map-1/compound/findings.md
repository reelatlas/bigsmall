# Compound quantities: findings (compound worker, 2026-10-19)

Delivered as the worker's reply and saved here by the orchestrator.

**The answer.** One grammar can read every form found.

- **Parts.** A value is two or three parts of one kind and one system, largest first, added together.
- **Omitted unit.** The last unit may be left off when the first unit has one conventional partner (`5'11`, `5 ft 11`, `11 st 4`, `1h30`).
- **Sign.** A leading sign covers the whole value.
- **Target.** A connective word, or a trailing unit with no number of its own, names the unit to convert to. "in" is the inch right after a number and the connective after a unit.

**What leads.** Heights lead. The most-typed form is the apostrophe with no inch mark, `5'11` [measured].

**Google.** Google's calculator reads nearly every height form. It shows feet and inches as a pair in 64ths of an inch, and drops the pair rather than show "5 feet 12 inches" [measured].

**Other converters.** Most converters avoid parsing by giving feet and inches two boxes [asserted].

**Display.** In the table, write `5 ft 11 in`. Round the total in inches to the display step first, then split it [reasoned].

**How to read the tags.**

- Evidence: [M] measured, [R] reasoned, [A] asserted.
- Layers: L1 our own, L2a normative, L2b guidance, L3 community, L4 the wild.
- Frequency is ordinal only: Google, Bing and DuckDuckGo autocomplete over 70 prefixes. Google Trends could not be reached (HTTP 429).
- Google's answers are read from its autocomplete calculator (the "= …" suggestion). The results page itself was blocked, so treat these as a proxy.

## 1. Heights: forms and frequency signals

| Form                            | Frequency signal (autocomplete) [M, L4]                                                                                 | Google reads                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `5'11` (no inch mark)           | **Leads.** All 10 completions of "how many cm is 5" are `5'N`, on Google and Bing; also "height 5'5", "how tall is 5'8" | 180.34 cm (with a target)                  |
| `5'11"`                         | Completes the same as `5'11`; the quote is dropped in suggestions                                                       | 180.34 cm                                  |
| `5' 11`                         | Rich: "5' 11 in cm", "5' 11.5 in cm"                                                                                    | 180.34 cm                                  |
| `5′ 11″` (primes)               | No suggestions of its own                                                                                               | 180.34 cm                                  |
| `5' 11''` (two apostrophes)     | Not probed for frequency                                                                                                | 180.34 cm                                  |
| `5 ft 11 in`, `5 ft 11`         | Rich: "5 ft 11 in to cm", "5 ft 11 in in cm"                                                                            | 1.8034 m                                   |
| `5ft11`, `5ft 11`               | Rich: "5ft11 in cm", "5ft11 vs 6ft"                                                                                     | 1.8034 m                                   |
| `5 feet 11 inches`, `5 foot 11` | Rich: "5 foot 11.5 inches in cm"                                                                                        | 180.34 cm                                  |
| `5 11` (space only)             | Rich: "5 11 in cm", "5 11 height"                                                                                       | no answer                                  |
| `511`                           | Completed: "511 height in cm"                                                                                           | —                                          |
| `5-11`                          | "5-11 in cm" completes, but drowned by the 5.11 brand                                                                   | `= -6` (subtraction)                       |
| `6-2`, `6-9`                    | "6-2 in cm"; Basketball Reference writes "6-9, 250lb (206cm, 113kg)"                                                    | —                                          |
| `5.11 feet` (the mistake)       | Completed: "5.11 feet in cm", "5.11 feet in m"                                                                          | 155.7528 cm (literal)                      |
| `6'`, `6'0`, `6 foot`           | "6'0 in cm", "5'11 vs 6'0" (people write 6'0 for six feet)                                                              | 182.88 cm                                  |
| `71 in`, `71 inches`            | "71 inches to feet height"                                                                                              | 180.34 cm                                  |
| `180 cm`, `180cm`               | Rich: "180 cm in feet and inches"                                                                                       | "5.90551181 feet (5 feet 10 55/64 inches)" |
| `1.80 m`, `1,80 m`              | "1.80 m in feet"; `1,80` becomes "1 80 m to feet"                                                                       | read, including the comma                  |
| `1m80`, `1 m 80 cm`             | "1m80 en pied", "1m75 bao nhiêu feet", "1 m 80 cm in feet"                                                              | `1 m 80 cm` read; `1m80` no answer         |
| `how tall is 180 cm`            | "how tall is 180 cm in feet and inches"                                                                                 | 1.8 m                                      |
| `100 m tall`, `180 cm tall`     | Not probed for frequency                                                                                                | no answer                                  |
| Others found                    | "5 foot 11 and a half", "5 pies 11 pulgadas"                                                                            | "and a half" → 181.61 cm                   |

Our own evidence (L1): Sean, 2026-10-17, on typing 5 ft 10 in and reading centimeters: "genius" (docs/PLAN.md §2) [A].

## 2. The same shape elsewhere

All forms below are from autocomplete [M] unless marked otherwise.

- **Stone and pounds.**
  - Forms: `11 st 4 lbs in kg`, `11st4lb in kg`, `11st 4lb`, `11 stone 4 in kg`, `11 stone 4.6 pounds`, and "weight 11 stone 7 in kg" (the lb left off).
  - CLDR, the Unicode locale data, sets person mass in GB to `stone-and-pound` [M, L2a].
- **Pounds and ounces.**
  - Forms: `6 lb 3 oz baby`, `6lb 3oz at 35 weeks`, `7 pounds 8 ounces in kg`, `7 lbs 8 oz`. Baby weights dominate.
  - 21 CFR 101.7: "Net Wt. 24 oz (1 lb 8 oz)", and "periods and plural forms are optional" [A, L2a].
- **Hours, minutes, seconds.**
  - Forms: `1h30` (completions in French and Portuguese: "1h30 en minutes", "1h30 em segundos"), `1h30m`, `1 h 30 min`, `1:30 hours in minutes`, `90 min in hours`, `1 hour 30 minutes`.
  - Quebec's language office writes "18 h 15", with h "toujours précédé et suivi d'un espacement" (always spaced on both sides) [A, L2b].
  - Our box already reads `1:30 h` as an hour and a half (docs/UX-SPEC.md §2) [L1].
- **Degrees, minutes, seconds.**
  - Thin demand: "45 degree 30 minutes is equal to"; "dms to decimal" is the head term.
  - Forms: `45° 30' 15"`, `45 30 15`, `45d 30m`.
- **Feet and inches with fractions.**
  - Forms: `5' 10 3/8`, which Google reads as 1.787525 m; Bing suggests "5'10 3/4 in cm".
  - Mike (L1): "Construction dimensions are fractional inches, which are a pain to add and subtract" [A].
  - AutoCAD's documentation accepts `5'-9 1/2"` [A].

## 3. What converters read

| Form typed                                         | Google's calculator [M]    | DuckDuckGo [M] | AutoCAD QuickCalc [A]                           | Others [A]                                                       |
| -------------------------------------------------- | -------------------------- | -------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| `5'11" in cm`, `5'11 in cm`                        | 180.34 cm                  | triggers       | `5'9"` and `5'9` valid (inch mark optional)     | InvenTree: "compound measurements (e.g. 3'6") are not supported" |
| `5′11″ in cm` (primes)                             | 180.34 cm                  | **no**         | —                                               | —                                                                |
| `5 ft 11 in in cm`                                 | 180.34 cm                  | **no**         | "ft." and "in." not supported (forum)           | GNU units: `5 ft + 11 in` with a `+`                             |
| `5ft11`, `5 ft 11`                                 | 1.8034 m                   | **no**         | —                                               | —                                                                |
| `5 feet 11 inches`, `5 foot 11`                    | 180.34 cm                  | triggers       | —                                               | pint: only with `parse_pattern('{feet} feet {inch} inches')`     |
| `5.11 ft`                                          | 155.7528 cm                | triggers       | —                                               | —                                                                |
| `5 ft 11 cm`                                       | 1.634 m (5 ft + 11 cm)     | —              | —                                               | —                                                                |
| `5' 14"`                                           | 187.96 cm                  | —              | —                                               | —                                                                |
| `-5'11"`                                           | −180.34 cm                 | —              | a dash is a separator; a spaced minus subtracts | —                                                                |
| `5-11`, `5 11 in cm`                               | −6; no answer              | —              | `5'-9"` valid                                   | —                                                                |
| `5' 10 3/8"`                                       | 178.7525 cm                | —              | `5'-9 1/2"` valid                               | Archtoolbox reads fractions with a space                         |
| `11 stone 4 lbs` / `11 st 4 lb`                    | 71.6676 kg / no answer     | no             | —                                               | —                                                                |
| `6 lb 3 oz in kg`                                  | 2.8066 kg                  | no             | —                                               | —                                                                |
| `1 hour 30 minutes` / `1 h 30 min`, `1h30`, `1:30` | 90 min / no answer         | no             | —                                               | —                                                                |
| `45° 30'`, `30 arcminutes`                         | wrong (28.65°) / no answer | no             | —                                               | Wolfram MixedUnit handles DMS (docs)                             |

**Who shows a pair, and how they round at twelve inches.**

- **Google** [M]:
  - Shows a pair only for feet and inches, in 64ths of an inch: "(5 feet 10 55/64 inches)", "(6 feet 2 inches)", "6 feet 3/64 inch".
  - A whole number of feet shows alone: "5 feet".
  - Pounds and ounces get no pair ("2.8 kg in pounds and ounces" gives "6.17294334 pounds"), and nor does stone.
  - At the boundary: `71.99 in` gives "(5 feet 11 63/64 inches)". `182.879 cm` gives "5.99996719 feet" with the pair dropped. It never shows "5 feet 12 inches".
- **DuckDuckGo**, archived source [M]:
  - It replaces the first `"` with "inch" and the first `'` with "foot".
  - It then folds the regex `(\d+)\s*(?:feet|foot)\s*(\d+)(?:\s*inch(?:es)?)?` into `$1 + $2/12` feet. Its comment: "# hack around issues with feet and inches for now".
  - Since `5'11` itself triggers its converter, reading it as 5.92 feet is inferred from the code, not observed.
- **Construction and programming tools** [A]:
  - Archtoolbox rounds to 1/8 through 1/64 of an inch, 1/16 by default. "Rounding is applied to display only", and it writes `6′-3″` and `118′ 1 5/16″`.
  - GNU units "always gives integer coefficients", with a `--round` option.
  - RapidTables computes "d(ft) = ⌊d(in) total / 12⌋", then the remainder, so rounding the inches afterwards can show 12.
  - math.js: `splitUnit(['ft','in'])`.
- **Two-box form converters** [A]: inchcalculator (separate Feet and Inches boxes) and Omni (fields for feet and inches, and for metres and centimetres).
- **Not reached.** Wolfram|Alpha live (needs JavaScript). Bing's results page gave no answer box. ConvertUnits returned 403.

## 4. Writing conventions for a pair

- **NIST SP 811 §7.3** [A, L2a]: "The value of a quantity is expressed using no more than one unit." Its example: "l = 10.234 m, but not l = 10 m 23 cm 4 mm". Then: "Expressing the values of time intervals and of plane angles are exceptions to this rule." SP 811 does not treat feet and inches, and uses primes only for angle.
- **NIST §7.2**: the space before a unit is dropped only "for the unit symbols for degree, minute, and second for plane angle", as in "30°22′8″".
- **NIST checklist #15**: "except in the case of superscript units for plane angle … an angle of 2° 3' 4"".
- **ISO 80000-1:2022**: could not reach. It is paywalled, and the free preview holds only the contents (6.2 "Units and numerical values", 7.2 "Numbers"). The SI Brochure downloaded, but its text could not be extracted with the tools at hand.
- **Unicode NamesList 18.0** [M, L2a]: "2032 PRIME = minutes, feet"; "2033 DOUBLE PRIME = seconds, inches"; "0027 APOSTROPHE … neutral (vertical) glyph with mixed usage".
- **CLDR English** [M, L2a]:
  - The narrow foot is "{0}′" and the narrow inch "{0}″"; the narrow unit list joins with a space, giving "5′ 11″".
  - The short list joins with a comma, giving "5 ft, 11 in".
  - Node 24's Intl confirms both outputs. It rejects `foot-and-inch` as a unit, so the browser cannot format a pair by itself. The narrow pound is "5#".
- **Wikipedia's Manual of Style** [A, L2b]:
  - Feet and inches: "Do not use ′ (′), ″ (″), apostrophe ('), or quote (")".
  - A pair: "a 6 ft 2 in man", with "1 ft , 1 in (no comma)" unacceptable.
  - Metric pairs: "1 m 33 cm" unacceptable.
  - Stone: "12 st 8 lb".
  - Time: "1 h 30 min 7 s"; "1:30" only where HH:MM against MM:SS is clear.
  - Angles: "23° 47′ 22″".
- **Where the sources disagree.** CLDR puts a comma in its short pair form and primes in its narrow form; Wikipedia forbids both. The record should say so rather than pick a side quietly.

## 5. Pitfalls

- **`5.11` against `5'11"`.**
  - Typed often (autocomplete [M]). Google reads it literally as 155.75 cm [M].
  - Reading it as 5 ft 11 in would break real decimal feet such as `5.5 ft` [R]. Read it literally and offer the pair quietly [R].
- **`6'0` against `6'`.** Both are 182.88 cm in Google [M]. People write 6'0 for exactly six feet ("5'11 vs 6'0").
- **Inches past twelve.** Google sums `5' 14"` to 187.96 cm with no notice [M]. Sum it, and show the normalised value [R].
- **Rounding `5' 11.6"` to `6' 0"`.**
  - Splitting first and rounding the inches afterwards can print 12 (RapidTables' formula [A]).
  - Google hides the pair at the boundary [M].
  - Round the total first, then split [R].
- **Negative input.** Google applies a leading minus to the whole pair [M]. AutoCAD reads a dash after a foot mark as a separator and a spaced minus as subtraction [A].
- **Ambiguous input.**
  - `5-11` is −6 to Google [M] and to our arithmetic [R].
  - `5 11` and `511` are typed but nobody reads them [M].
  - "minutes" means time or arc, and Google's autocomplete calculator gets arcminutes wrong [M].
- **Phones.**
  - iOS Smart Punctuation "converts ambidextrous straight quotes to curly quotes" by default in UIKit text fields [A, L3], so `5’11”` may arrive.
  - Whether Safari's web inputs do this was not confirmed; check it on Sean's iPhone [R].
- **Our own parser.** An apostrophe groups digits only before exactly three digits, so `5'11` is safe (docs/UX-SPEC.md §2) [L1].

## 6. The connective form and "in"

- **Google** [M]:
  - "in" right after a number is the inch: `11 in in ft` gives "0.916666667 feet (11 inches)"; `5 ft 11 in in inches` gives 71 inches.
  - "in" after a unit is the connective.
  - Both "to" and "in" work: `5 ft 11 in to cm`, `5 ft 11 in in cm`, and `5 ft 11 in cm` all give 180.34.
  - It declines `5 in cm`.
  - A trailing bare unit after a number joins the sum: `5 ft 11 cm` is 1.634 m.
- **DuckDuckGo**:
  - Its connecting words: `in|…to|…|in\sto|…|(?:in to)|from` [M].
  - `5 ft 11 in in cm` does not trigger its converter [M].
- **Converters' documentation** [A]:
  - math.js: "Units can be converted using the operator to or in".
  - Soulver: to, in, or as, plus a reverse "meters in 10 km" (paraphrase).
- **Style guides** [A, L2b]:
  - GPO rule 9.3: "the symbol in (inch) mistaken for the preposition in, … the symbol should be spelled out."
  - Wikipedia: "Consider using inches (but not in.) in place of in where the latter might be misread as a preposition."

## 7. Proposed grammar (plain rules)

1. **Parts.** A compound is two or three parts of one kind and one system. Each part is a number then a unit, each unit smaller than the one before. The value is their sum. Spaces inside and between parts are optional. "and" or a comma may join the parts, so the box reads back CLDR's "5 ft, 11 in".
2. **Pairs.** ft → in; st → lb; lb → oz; h → min → s; ° → ′ → ″; m → cm.
   - m → cm is recommended because CLDR names `meter-and-centimeter` and the queries show it.
   - Wikipedia bans writing a metric pair, not reading one.
3. **Omitted unit.** A bare number after a first part takes that part's partner unit: `5 ft 11`, `5'11`, `11 st 4`, `6 lb 3`, `1h30`, `45° 30`, `1m80`.
4. **Marks.**
   - Feet: `'` `′` `’` `‘` `´`, after a number.
   - Inches: `"` `″` `”` `''`.
   - After a degree sign, the same marks are arcminutes and arcseconds.
   - Words and symbols, with optional periods and plurals: ft, foot, feet, in, inch, st, stone, lb, lbs, pound, oz, ounce, h, hr, hour, min, minute, s, sec, °, deg, degree.
   - `m` and `s` mean minutes and seconds only after `h` or `min`. `d m s` count only in an angle that starts with `d`.
5. **Numbers.** The smaller part's number may be a decimal, a fraction, a mixed number (`10 3/8`), or "and a half".
6. **Signs and dashes.** A leading sign negates the whole value. A hyphen directly between a foot mark and a digit is a separator (`5'-9 1/2"`). A minus with a space beside it is subtraction.
7. **Overflow.** A smaller part past its range is summed, and the quiet line shows the normalised value.
8. **Target.** After a complete value, `to`, `in`, `into`, `as`, `=` or `in to` followed by a unit names the target.
   - "in" is the inch when it follows a number directly, and the connective otherwise.
   - A final unit with no number of its own is the target (`5'11 cm`).
9. **Noise words.** These are dropped: how tall is, how many … is, height, tall, convert, what is, `?`.
10. **Not compounds.**
    - `5.11 ft` is decimal feet. The quiet line offers "5 ft 11 in?" when the decimals read as 1 to 11.
    - `5-11` is arithmetic.
    - A bare `5 11` and `511` are not read. In `5 11 in`, the inch names the pair.
    - Parts out of order, or from two systems, are not summed; the other reading is offered.

**Must read:**

- Heights:
  - `5'11"`, `5′ 11″`, `5’11”`, `5'11`, `5' 11''`
  - `5 ft 11 in`, `5ft11in`, `5ft11`, `5 ft 11`, `5 feet 11 inches`, `5 feet and 11 inches`, `5 ft, 11 in`
  - `6'`, `6'0`, `71 in`, `180 cm`, `1.80 m`, `1,80 m`, `1m80`
- Targets and noise words: `how tall is 180 cm`, `5'11 tall`, `5 ft 11 in to cm`, `5 ft 11 in in cm`, `5'11 cm`.
- Fractions, overflow and sign: `5' 10 3/8"`, `5'-10 3/8"`, `5' 14"` (read as 6′ 2″), `-5'11"`.
- Weights: `11 st 4 lb`, `11st4`, `11 stone 4`, `6 lb 3 oz`, `6lb3oz`.
- Times and angles: `1 h 30 min`, `1h30`, `1:30 h`, `45° 30′ 15″`, `45d 30m 15s`.

**Must not read as a compound:**

- `5.11 ft`: decimal feet, with the pair offered.
- `5-11`: −6.
- `511`, and `5 11` alone.
- `11 in 5 ft`: out of order.
- `5 ft 11 cm`: two systems, with the other reading offered.
- `5:75`.
- `1 m 33 ft`.

## 8. Proposed display rule for a pair in a table row

- **Format.**
  - Write `5 ft 11 in`, `11 st 4 lb`, `6 lb 3 oz`, `1 h 30 min`: short symbols, a space between parts, no comma.
  - This is the table's own symbol style, and it follows NIST, Wikipedia and the CFR.
  - Primes only for angles: `45° 30′ 15″`, no space before a mark, a space between parts. A construction setting could switch to `5′-10 3/8″` [R].
- **Round, then split.** Round the total to the display step in the smallest unit, then split it. So 71.996 in shows `6 ft 0 in`, never `5 ft 12 in` [R]. Google suppresses the pair instead [M].
- **Zeros.** Both parts always show (`6 ft 0 in`), for alignment and because people write 6'0 [R].
- **Precision.** The smaller part follows the Display setting: decimals like the other rows, or fractions to 1/16 by default, in lowest terms [R]. Archtoolbox defaults to 1/16 and Google uses 64ths.
- **Sign.** The sign goes before the pair, never on a part: `−5 ft 11 in`.
- **Placement.** The pair rows sit in the visitor's own system section, where CLDR puts them for each region [R].

## The worker's summary

1. Answer: one grammar of summed parts reads every form found. The table writes `5 ft 11 in`, rounding the total before splitting.
2. Strongest (measured): Google's calculator reads nearly every height form, primes, words and fractions included. It reads `5.11 ft` literally and `5 ft 11 cm` as a sum, shows the pair in 64ths, drops the pair at the twelve-inch boundary, and does not read `5 11`, `5-11` or `1h30`.
3. Strongest (measured): `5'11` with no inch mark leads, with 10 of 10 completions on Google and Bing. `5 11`, `511`, `5.11 feet`, `1m80` and `6'0` are typed too.
4. Strongest (measured from data files): CLDR uses foot-and-inch for height in CA, GB, IN and US, meter-and-centimeter in FR, ES and IT, and stone-and-pound for GB. Browser Intl cannot format a pair.
5. NIST SP 811 §7.3 allows more than one unit only for time and angle (asserted). Unicode names U+2032 and U+2033 for feet and inches; Wikipedia forbids primes for them.
6. "in" is the inch after a number and the connective after a unit (Google, measured); GPO and Wikipedia flag the ambiguity.
7. Could not reach: Google's results page, Google Trends (429), Wolfram|Alpha live, the ISO 80000-1 text, the SI Brochure's text, eCFR, ConvertUnits.
8. Tool calls: about 103 of 150.
9. Files: claims.csv (74 rows) and sources.csv (39 rows); raw probes in downloads/ (gprobe*.json, ddgprobe.json, autocomplete*.json, cldr/, ddg/, unicode/); probe inputs (gprobe*.txt, ddg.txt, prefixes*.txt) and scripts in the folder root.
10. Cost (the orchestrator's record): the harness reported about 245,000 tokens for the gathering sitting and 252,000 for the sitting that delivered this report.
