# Demand: a relative map of unit-conversion searches

Wave 1, worker "demand", read 2026-10-19. Delivered as the worker's reply and saved here by the orchestrator (the platform returns a subagent's findings as text). Two signals carry it:

- **Volume (V):** a third-party estimate of US monthly searches. These are Google Ads buckets copied by seodata.dev, or Semrush's US database, so treat them as orders of magnitude.
- **Autocomplete depth (AC):** the shortest prefix at which Google's suggest endpoint offers a query among its ten. It ranks queries; it is not a volume.

**G** means Google's own suggestions carried its calculator answer; **no G** means they did not. Every row's source is in `claims.csv` and `sources.md`.

## The answer first

1. **The head is about a dozen length, weight and temperature pairs, and Google answers every one.** They run 0.2 to 1.8M a month.

   | Pair                              | Searches a month |
   | --------------------------------- | ---------------- |
   | kg to lbs                         | 1.83M            |
   | cm to inches                      | 1.5M             |
   | mm to inches                      | 0.82 to 1.22M    |
   | celsius to fahrenheit             | 823k             |
   | inches to cm                      | 246 to 673k      |
   | km to miles                       | 673k             |
   | meters to feet                    | 550k             |
   | ml to oz, inches to mm, lbs to kg | 368k each        |
   | miles to km                       | 301k             |
   | feet to meters                    | 201k             |

2. **A single edge search is 3 to 6 % of a head term, but each is one of a family of 20 to 40 values.**

   | Search                  | Searches a month |
   | ----------------------- | ---------------- |
   | grams in a cup          | 165k             |
   | a cup in grams          | 110k             |
   | 5'10 in cm              | 90.5k            |
   | pace calculator         | 90.5k            |
   | nm to ft lbs            | 49.5k            |
   | 5/8 inch to mm (bucket) | 40.5k            |
   | shoe size converter     | 40.5k            |
   | cups to grams           | 40.5k            |

   The general cups-to-grams phrasings add up to about 400k. inchcalculator has 91 height pages and 195 flour, sugar and butter pages, so the incumbents already see these families.

3. **The openings are where Google gives nothing or gets it wrong.**
   - **No answer:** cooking by ingredient (0 of 24 forms), pace phrasings, shoe sizes, gas marks, blood sugar, paper sizes, typography, acceleration, gpm and lpm flow, and every Force pair.
   - **Wrong answer:** "nm to ft lbs" is read as nanometres: "= 304800000 pounds".
   - **Heights:** cm to feet is shown in 64ths of an inch ("5 feet 6 59/64 inches"), and "5 10 in cm" without the prime gets no answer.

4. **Searches for one value are as big as mid-tier pairs.** "500 ml to oz" is 60.5k, "60 inches to feet" 40.5k, "160 lbs to kg" 33.1k; these are rows of a pair page. "chart" or "table" appears as a completion for 106 of the 268 US forms.

## 1. Top 30 per group

### Group A: our sixteen categories (ranked by V where found, else by AC)

| #   | Pair                                | Signal                                           |
| --- | ----------------------------------- | ------------------------------------------------ |
| 1   | kg to lbs                           | V 1.83M; AC 2, rank 1; G                         |
| 2   | cm to inches                        | V 1.5M (both tools); AC 2; G                     |
| 3   | mm to inches                        | V 1.22M (Ads data) / 823k (Semrush); G           |
| 4   | celsius to fahrenheit               | V 823k; G, as a temperature only, never a change |
| 5   | inches to cm                        | V 673k / 246k; G                                 |
| 6   | km to miles                         | V 673k; G                                        |
| 7   | meters to feet                      | V 550k; G gives "3 feet 3 3/8 inches"            |
| 8   | c to f                              | V 450k; G                                        |
| 9   | ml to oz                            | V 368k; G                                        |
| 10  | inches to mm                        | V 368k; G                                        |
| 11  | lbs to kg                           | V 368k; UK AC 2, rank 1; G                       |
| 12  | miles to km                         | V 301k; G                                        |
| 13  | feet to meters                      | V 201k; G                                        |
| 14  | how many feet are in a meter        | V 135k                                           |
| 15  | kilos to pounds                     | V 74k                                            |
| 16  | nm to ft lbs (Torque)               | V 49.5k; Google wrong                            |
| 17  | bar to psi                          | V 40.5k; G                                       |
| 18  | cups to grams (Cooking)             | V 40.5k; no G                                    |
| 19  | oz and gallon                       | V 33.1k                                          |
| 20  | psi to bar                          | V 18.1k; G                                       |
| 21  | fahrenheit to celsius               | AC 3; G                                          |
| 22  | cm to feet                          | AC 2, rank 1; G                                  |
| 23  | feet to cm                          | AC 3; G                                          |
| 24  | oz to cups                          | AC 2; G                                          |
| 25  | m/s to km/h                         | AC 2; G                                          |
| 26  | mg to g                             | AC 2; G                                          |
| 27  | tsp to ml, tbsp to ml, tbsp to tsp  | AC 3; G                                          |
| 28  | mph to kph, kph to mph, km/h to mph | AC 3; G                                          |
| 29  | kb to mb, mb to gb, gb to mb        | AC 2 to 4, rank 1; G                             |
| 30  | l/100km to mpg                      | AC 2; G                                          |

Next by AC:

- grams to ounces and oz to grams (4)
- inches to feet (5)
- sq ft to sq m and acres to hectares (4)
- kwh to btu (5)
- hp to kw (4)
- lbf to n (3; no G for any Force form)
- degrees to radians (5)
- minutes to hours (4)

UK differences: kg to stone is offered from 2 characters in the UK against 7 in the US, and 350 f to c from 2 against 5.

### Group B: edge forms (heights, cooking by ingredient, fractions, pace, torque, single values)

| #        | Search                                             | Signal                                                         |
| -------- | -------------------------------------------------- | -------------------------------------------------------------- |
| 1        | height comparison (related, not a conversion)      | V 201k                                                         |
| 2        | grams in a cup                                     | V 165k; no G                                                   |
| 3        | a cup in grams                                     | V 110k; no G                                                   |
| 4        | 5'10 in cm                                         | V 90.5k bucket; AC 2 ("5'"), rank 1; G 177.8 cm                |
| 5        | pace calculator                                    | V 90.5k; no G                                                  |
| 6        | how many grams in a cup                            | V 90.5k                                                        |
| 7        | 500 ml to oz                                       | V 60.5k                                                        |
| 8        | ft lb to nm / foot pounds to nm                    | V 49.5k (the nm to ft lbs bucket)                              |
| 9        | 5/8 inch to mm                                     | V 40.5k bucket; AC 3; G 15.875 mm                              |
| 10       | running pace calculator                            | V 40.5k                                                        |
| 11       | 60 inches to feet                                  | V 40.5k                                                        |
| 12       | 160 lbs to kg                                      | V 33.1k                                                        |
| 13       | 80 inches in feet                                  | V 33.1k                                                        |
| 14       | 1 cup in grams                                     | V 27.1k                                                        |
| 15       | 95 lbs kilos                                       | V 27.1k                                                        |
| 16       | 5 ft 10 in cm / 5 foot 10 in cm                    | V 18.1k; G                                                     |
| 17 to 25 | 5'8, 6'2, 5'9, 5'2, 5'5, 5'7, 5'6, 5'4, 5'11 in cm | AC 2 each, ranks 1 to 10; G for all                            |
| 26       | 175, 165, 170, 180 cm in feet                      | AC 2; G, in 64ths of an inch                                   |
| 27       | 3/4 and 1/2 inch to mm                             | AC 3; G                                                        |
| 28       | 1 cup flour in grams; 1 cup sugar in grams         | AC 4 ("1 cu"), ranks 10 and 8 (UK flour from 3); no G          |
| 29       | 1 stick of butter in grams; min/km to min/mile     | AC 4 each; min/km to min/mile is rank 1 and gets a rate answer |
| 30       | inch pounds to foot pounds                         | AC 6; no G                                                     |

### Group C: candidate categories (no volumes except shoes; ranked by AC)

| #   | Search                                                        | Signal                              |
| --- | ------------------------------------------------------------- | ----------------------------------- |
| 1   | a4 size, a4 paper size, a5 size, a3 size                      | AC 2, ranks 1 to 7; no G            |
| 2   | a4 size in inches, a5 size in inches                          | AC 2; no G                          |
| 3   | mg/dl to mmol/l                                               | AC 3 (UK rank 1); no G              |
| 4   | mb/s to mbps                                                  | AC 3, rank 1; G                     |
| 5   | mbps to gbps                                                  | AC 3; G                             |
| 6   | khz to hz                                                     | AC 3, rank 1; G                     |
| 7   | lpm to gpm                                                    | AC 3; no G                          |
| 8   | kg/m3 to lb/ft3                                               | AC 3 (few competing suggestions); G |
| 9   | shoe size converter                                           | V 40.5k; AC 11 (UK 7); no G         |
| 10  | eu to us shoe size                                            | AC 4, rank 1; no G                  |
| 11  | uk to us shoe size                                            | AC 4; no G                          |
| 12  | mmol/l to mg/dl                                               | AC 4, rank 1; no G                  |
| 13  | a4 size in cm                                                 | AC 4 (UK 2); no G                   |
| 14  | hz to rpm                                                     | AC 4; no G                          |
| 15  | px to rem                                                     | AC 4; no G                          |
| 16  | px to pt                                                      | AC 4; no G                          |
| 17  | m/s2 to g                                                     | AC 4; no G                          |
| 18  | us to eu shoe size                                            | AC 5; no G                          |
| 19  | px to em                                                      | AC 5; no G                          |
| 20  | dpi to ppi                                                    | AC 5; no G                          |
| 21  | gpm to lpm; cfm to m3/h                                       | AC 5; no G                          |
| 22  | g/cm3 to kg/m3                                                | AC 5; G                             |
| 23  | 180c in gas mark                                              | AC 6 (UK 4); no G                   |
| 24  | mens to womens shoe size; shoe size chart                     | AC 6; no G                          |
| 25  | rpm to hz                                                     | AC 6; no G                          |
| 26  | gas mark 6; gas mark 4                                        | AC 7 / 8 (UK 6); no G               |
| 27  | pt to px; pt to mm                                            | AC 7; no G                          |
| 28  | g to m/s2                                                     | AC 7; no G                          |
| 29  | letter size                                                   | AC 8; no G                          |
| 30  | gas mark to celsius; density converter; blood sugar converter | AC 10, 10 and 14; no G              |

## 2. Where the edge sits against the head

- **Heights.**
  - Size: one value, "5'10 in cm" at 90.5k, is 6 % of "cm to inches".
  - Which form leads: the prime form ("5'10 in cm") leads from the prefix "5'". Keyword Planner merges it with "5 10 in cm" at 90.5k; "5 ft 10 in cm" and "5 foot 10 in cm" are 18.1k each.
  - Google: answers the prime and spelled-out forms but not the bare "5 10 in cm", and in reverse shows 64ths of an inch.
  - Family total (reasoned, not measured): about 24 common heights at a third of 5'10's volume would be about 700k, roughly half a head term.
- **A cup of an ingredient in grams.** The general phrasings are 40.5k, 165k, 110k and 90.5k, about 400k together (a quarter of a head term). The buckets may overlap. No volume was reachable for any single ingredient; flour and sugar are offered from "1 cu". Google answers none of the 24 forms.
- **Fractions of an inch.** About 40.5k per common fraction bucket, about 3 % of a head term. Google answers each fraction, so the opening is the table of eighths and sixteenths, not the single value.
- **Paces.** "pace calculator" 90.5k, "running pace calculator" 40.5k. Google answers only searches phrased as a rate.
- **Torque.** 49.5k for one bucket covering nm to ft lbs, ft lb to nm and foot pounds to nm, which beats bar to psi at 40.5k. Google misreads "nm" and answers only the spelled-out "newton meters to foot pounds".
- **Shoe sizes.** "shoe size converter" 40.5k; "eu to us shoe size" is offered from 4 characters at rank 1. No Google answer.
- **Gas marks.** Weak in the US (8 to 10 characters), stronger in the UK (4 to 6). UK completions add "fan oven" ("gas mark 4 in fan oven", "180c fan in gas mark"). No Google answer.
- **Blood sugar.** "mg/dl to mmol/l" from 3 characters, "mmol/l to mg/dl" from 4 at rank 1. No Google answer.
- **Paper sizes.** "a4 size" and "a5 size" are offered from 2 characters, as strong as any head pair by this signal. No calculator answer; it is a lookup.

## 3. Google's own converter box, from its help page

The help page names the conversions it does: Temperature, Length, Mass, Speed, Volume, Area, Fuel consumption, Time and Digital storage. Its units table adds more rows. The last column is what the suggest answers showed.

| Category    | In Google's table                | What the suggest answers showed     |
| ----------- | -------------------------------- | ----------------------------------- |
| Length      | yes, "feet and inches" included  | heights and fractions answered      |
| Weight      | yes, stones included             | answered; grams to pounds gave none |
| Volume      | yes, "sticks of butter" included | answered                            |
| Temperature | C, F, K, Rankine                 | as a temperature only               |
| Area        | yes                              | answered                            |
| Speed       | km/h, m/s, mph, knots            | answered; paces only as rates       |
| Time        | yes                              | answered                            |
| Data        | yes ("Information size")         | answered                            |
| Data rate   | yes (bps, Bps)                   | answered                            |
| Fuel        | yes                              | answered                            |
| Energy      | yes, foot-pounds included        | answered; kj to kcal gave none      |
| Pressure    | yes                              | answered; mpa to psi gave none      |
| Power       | yes                              | answered; ps to hp gave none        |
| Force       | newtons, pounds-force            | none for any of the 5 forms         |
| Angle       | yes                              | answered; gradians gave none        |
| Frequency   | yes                              | answered; hz to rpm gave none       |
| Flow rate   | CFM, LPM                         | none for the gpm, lpm and cfm forms |

Not in the table at all: torque, pace, density, acceleration, shoe size, blood glucose, paper size, typography, gas mark, and densities of ingredients. Density searches were still answered, because Google combines the units.

In all, Google's suggestions answered 155 of 268 US forms. Whether a knowledge answer or featured snippet shows up on the results page could not be seen.

## 4. The ten controls

The head terms every converter has:

- kg to lbs
- cm to inches
- mm to inches
- celsius to fahrenheit
- inches to cm
- km to miles
- meters to feet
- ml to oz
- inches to mm
- lbs to kg

Miles to km and feet to meters come next.

Cross-check against the incumbents:

- **unitconverters.net:** its 34 "Common Conversions" include all ten except ml to oz (it lists mL to cups instead). The list is led by cm to inches, kg to lbs, Celsius to Fahrenheit and mm to inches.
- **metric-conversions.org:** its 18 "Popular" links include the length, weight and temperature ones, led by km to miles. It adds kg to stones and "Meters to Feet and Inches".

The general head terms are unit conversion (823k), metric conversion (823k) and unit converter (301k).

## 5. Limits of the method

- **Google Trends was unreachable.** HTTP 429 on the first request, not retried, so the "cm to inches" anchor comparison was not done.
- **Google's results pages need JavaScript.** What the answer box shows is inferred from the calculator answer in the suggestions. A missing answer is weaker evidence than a present one.
- **The volumes are bucketed third-party estimates.**
  - Keyword Planner merges close variants and drops punctuation: "5'10" counts as "5 10", and "5 8 to mm" includes "3 3/8".
  - The two tools disagree by up to 2.7 times on the same term.
  - There are only 47 readings. seodata.dev states 20 free lookups a day, and the worker stopped at about 19 after two 429s; Semrush's public pages show five keywords per site.
- **Autocomplete gives an order, not a volume.** It depends on how crowded a prefix is, so it ranks within a family better than across families. Where a volume exists, the volume wins.
- **The data leans US.** No UK, Indian or Spanish volumes.
- **Also not reached, and not retried:**
  - Ahrefs' free tools (JavaScript)
  - DataForSEO's top-1000 list (unavailable)
  - convertunits.com (403)
  - several Semrush overviews (404)
  - seodata.dev pages that don't exist (404)

## The worker's summary

1. **The answer:** a dozen head pairs (kg to lbs 1.83M, cm to inches 1.5M, mm to inches 0.82 to 1.22M, celsius to fahrenheit 823k a month, all estimates) are all answered by Google. Edge searches are 3 to 6 % of a head term each (5'10 in cm 90.5k, pace calculator 90.5k, nm to ft lbs 49.5k, 5/8 inch to mm 40.5k, shoe size converter 40.5k) but come in families of 20 to 40; the cups-to-grams phrasings total about 400k.
2. **Strongest finding 1 (measured, one response per search):** Google's suggestions carry its calculator answer for 155 of 268 US forms. There is none for cooking by ingredient (0 of 24), shoes, gas marks, blood sugar, paper, typography, pace or Force. "nm to ft lbs" is answered as nanometres.
3. **Strongest finding 2 (measured, third-party estimate):** "5'10 in cm" is about 90.5k in one bucket with "5 10 in cm", and Google doesn't answer the form without the prime. Autocomplete offers all nine 5'X heights tried from "5'".
4. **Strongest finding 3 (measured, third-party estimate):** torque's top bucket (49.5k) beats pressure's top pair (bar to psi 40.5k), and Google's table has no torque row.
5. **Could not reach:** Google Trends (429), Google's results pages (JavaScript), Ahrefs' free tools, DataForSEO's list, convertunits.com (403), and seodata.dev beyond its stated daily limit. No non-US volumes.
6. **Volumes:** 47 readings from seodata.dev and Semrush, bucketed; the two tools differ by up to 2.7 times.
7. **Autocomplete:** 268 US and 123 UK forms probed; it ranks queries, it does not measure volume.
8. **Tool calls:** about 107 of 150, none of them web calls after the re-brief.
9. **Files:** `claims.csv` (706 rows), `sources.md`, `ac_summary.json`, `downloads/`, `ac_probe.py`, `sd_fetch.py`, `build_claims.py`.
10. **Cost (the orchestrator's record):** about 448,000 tokens over 98 tool uses in two sittings, the second to write this report.
