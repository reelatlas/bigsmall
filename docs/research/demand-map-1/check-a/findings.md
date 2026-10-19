# Checker A: the standards and formulas (wave 2 of the demand map)

The report as the checker returned it (Opus 5.5 at max effort, 2026-10-19, 63 tool calls, 307,345 tokens as the harness counts), saved by the orchestrator. The verdicts row by row are in `check.csv`; the recomputation of ISO/TS 19407's Table 2 is `table2_recompute.py` with its output, and the rounding direction `table2_direction.py` with its; the rows checked are A01 to A37 of `../wave2-claims.csv`.

I checked all 37 claims against their sources: 33 are confirmed, 4 need correcting, none is wrong and none was unreachable. One row, A18, came through only after a Cloudflare check, so it is flagged.

## 1. Every row

| id  | verdict             | what the source says                                                                                                                                                     |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A01 | confirmed           | EVS: "Withdrawn from 22.06.2023". The history lists ISO 19407:2023 at that date as "Newest version". The words "Replaced by" are not on the page.                        |
| A02 | confirmed           | SIS abstract, word for word: three tables on foot length, for Mondopoint, European and UK, plus China, Japan, Korea and the US.                                          |
| A03 | corrected           | The NOTE is word for word, but it says "the absence of solution to the problem of shoe size conversions". It does not say "exact".                                       |
| A04 | confirmed           | Foreword item 4: modified (MOD) "путем изменения отдельных ссылок, которые в тексте выделены курсивом" (by changing individual references, set in italics).              |
| A05 | confirmed           | Mondopoint is based on foot length, in steps of 5 mm (group 1) or 7.5 mm (group 2) from zero; the steps are cited to DIN 66074-2. Japan sometimes uses cm.               |
| A06 | confirmed           | EUR: 6.67 mm from zero, read as last length or foot length depending on the country.                                                                                     |
| A07 | confirmed           | UK: 8.47 mm from 101.6 mm ("4 дюйма… 12 размеру"); 13 children's sizes, then the scale restarts at 1; first last length, later recalculated to foot length.              |
| A08 | confirmed           | US: 8.47 mm from 99.5 mm (3 11/12 in); in reality UK plus one size for men and two for women.                                                                            |
| A09 | confirmed           | (l_f + 2·8,47)/8,47 − 25, where 25 = 12 sizes + 13 children's sizes. Read on the page image.                                                                             |
| A10 | confirmed           | (l_f + 2·6,67)/6,67. Read on the page image.                                                                                                                             |
| A11 | confirmed           | The foot-to-last difference is taken empirically as two sizes, UK or EUR.                                                                                                |
| A12 | confirmed           | 4 UK → 36.5 EUR and 8 UK → 41.5 EUR, while shoes are often marked 37 and 42. The standard calls its tables "наиболее технически корректными" (most technically correct). |
| A13 | confirmed           | Row reads 270 \| 42,5 \| 9 \| 10 \| 11 (checked on the image).                                                                                                           |
| A14 | confirmed           | Toe allowance up to 8 %; US children's sizes are UK + usually half a size.                                                                                               |
| A15 | corrected           | My recomputation: 321/324 with ISO's printed steps, 317/324 with exact steps, 323/324 with either.                                                                       |
| A16 | confirmed           | Both cells as quoted: Mondo 215 → EUR 34 and UK 2 → EUR 34.                                                                                                              |
| A17 | confirmed           | BSI: published 31 Jul 2019; supersedes the 1991 edition, which is withdrawn; scope words as quoted, "applicable to all types of footwear".                               |
| A18 | confirmed (flagged) | Shoe size is foot length in mm and the unit may be left off; markings MP263, MP263/94, MP263-94, Mondo 263(94). It is a modified (MOD) adoption of ISO 9407.             |
| A19 | corrected           | US men's 5 and US women's 6 sit at 9 in, at 0.333 in a size. The UK adult mark at 9 in is 4.5, not 4.                                                                    |
| A20 | confirmed           | Nike "Unisex Shoes": US men 8 \| women 9.5 \| UK 7 \| CM/JP 26 \| EU 41 \| 10 in.                                                                                        |
| A21 | confirmed           | Wikipedia: FIA scale is women = men + 1; "common" scale is men + 1½. Neither sentence cites anything.                                                                    |
| A22 | confirmed           | Zappos FAQ says women's run "2" above men's; its tables put men's 8 and women's 9 both at 9.9 in.                                                                        |
| A23 | confirmed           | NIST B.9: standard gravity 9.806 65 in bold (exact); it has density and flow sections.                                                                                   |
| A24 | confirmed           | All four equalities are present (CSS Values 4, Working Draft of 12 March 2024).                                                                                          |
| A25 | confirmed           | Scope word for word. The ISO edition is 2016; SS-EN ISO 8653:2026 adopts it unchanged (IDT).                                                                             |
| A26 | confirmed           | "based on body measurements, not garment measurements", word for word.                                                                                                   |
| A27 | confirmed           | The 25 °F step is uncited; "mark 1 = 275 °F" is tagged [citation needed]; the Regulo / Radiation Ltd sentence is there. One search found no body that defines gas marks. |
| A28 | confirmed           | NGSP = (0.09148\*IFCC) + 2.152; IFCC = (10.93\*NGSP) − 23.50.                                                                                                            |
| A29 | confirmed           | Glucose molecular weight 180.1559 (shown as "180.1559 amu" in the page's data), which gives 18.016 mg/dL per mmol/L.                                                     |
| A30 | confirmed           | Nine headline conversions and a 30-row units table; none of the seven named categories appears.                                                                          |
| A31 | confirmed           | §7.3: "no more than one unit"; "10 m 23 cm 4 mm" forbidden; time intervals and plane angles are the exceptions.                                                          |
| A32 | confirmed           | §7.2: no space before °, ′, ″ of plane angle; example α = 30°22′8″.                                                                                                      |
| A33 | confirmed           | Unicode 18.0.0: U+2032 = minutes, feet; U+2033 = seconds, inches; U+0027 is a "neutral (vertical) glyph with mixed usage"; U+2034 = lines.                               |
| A34 | confirmed           | 21 CFR 101.7: (j)(1)'s words and the (m) examples are word for word.                                                                                                     |
| A35 | confirmed           | foot-and-inch from 3.0 (feet, per the CLDR spec) for CA GB IN US; meter-and-centimeter for the 16 regions listed.                                                        |
| A36 | corrected           | The lines exist, but the US's first-ranked preference is plain "pound".                                                                                                  |
| A37 | confirmed           | Narrow foot is "{0}′" and inch "{0}″"; the narrow unit list joins with "{0} {1}", the short one with "{0}, {1}".                                                         |

## 2. The corrected rows

- **A03.** The source: "…the absence of solution to the problem of shoe size conversions, Tables 1 and 2 provide a guideline which can benefit the consumer." What differs is only the claim's word "exact". The 2015 text, as the Russian GOST version renders it, does say "точных" (exact). Either reading still supports showing ≈.
- **A15.** The source is Table 2 itself: 324 values (81 rows × 4) and the formulas on page 2. What differs:
  - "321 of 324" holds only with ISO's printed steps (8.47 mm, 6.67 mm). The three misses are UK 2 → EUR 34 (formula 33.747), UK 8 → Mondo 260 (262.57 mm) and UK 15 → EUR 50 (50.255).
  - With the exact steps (25.4/3, 20/3) only 317 reproduce, even letting the 13 exact ties go either way. The misses are Mondo 235 → UK 4.5 and Mondo 290 → UK 11, each carried into both US columns, plus UK 15 → EUR 50.
  - Taking whichever step set fits gives 323; UK 15 → EUR 50 fits neither.
  - The claim that every miss lies within 0.01 size of a rounding boundary holds (0.002 to 0.010 size; UK 8 → Mondo is 0.07 mm off).
- **A19.** The source is the Brannock chart, "US MEN'S .333 IN/SIZE … UK ADULT .333 IN/SIZE". I measured tick positions on the image at 69 px per inch, with 9 in at x=626:
  - US men's 5 and US women's 6 are both at x=626.
  - UK adult 4 is at x=615 (about 8.84 in); the UK 4.5 tick is at x=626.
  - So on this chart men's = UK + 0.5, not + 1. Women's = men's + 1 and 0.333 in a size both hold.
- **A36.** The source lines are US pound, US pound-and-ounce, GB stone-and-pound, GB pound-and-ounce, HK pound-and-ounce. The CLDR spec (tr35-info.md) says an entry without a threshold "is 0 if it is the last ranked unit and 1 otherwise". So:
  - US person mass is plain pounds at 1 lb and over; pounds and ounces only under 1 lb.
  - GB is stone-and-pound at 1 st and over.
  - HK is pound-and-ounce throughout.

## 3. What I could not reach

Nothing outright. For A18 (chinesestandard.net), curl got HTTP 403 with a Cloudflare "Just a moment..." challenge page. I did not try to pass it. WebFetch, the brief's tool for pages, then returned the page with no challenge shown; nothing was solved or spoofed. That is why the row is flagged: if you treat the challenge as decisive, A18 becomes "could not reach". Every other source returned HTTP 200. The GOST PDF (re-downloaded, 205,495 bytes) is a scanned document with an unreliable text layer, so I rendered its pages with the built-in Windows PDF reader. I read the formulas from those images and compared every row of Table 2 against them.

## 4. What bears on how the claims are used

- **The US women's offset differs by source:**
  - ISO's Table 2 uses US men = UK + 1 and women = UK + 2 in all 81 rows.
  - The same standard puts the US zero at 99.5 mm, a quarter size from the UK's 101.6 mm.
  - Nike: women = men + 1.5.
  - Zappos is internally inconsistent: 2 in its FAQ, 1 by its inches row, 1.5 by its cm row (men's 8 = 25.4 cm = women's 9.5).
  - The Brannock chart: men's = UK + 0.5.
- **ISO rounds to nearest, not up.** 88 of the 162 non-US values in Table 2 sit below the formula value. Wikipedia's "rounded to a larger shoe size" is uncited and does not describe the table. The standard's own note (2.3) prefers marking slightly larger, but the table does not follow it.
- **CM sizes.** BSI says centimetre sizes and last-length markings do not conform to ISO 9407. Nike's CM/JP 26 sits at a 10 in (25.4 cm) foot, so Nike's CM is not foot length.
- **ISO 8559-2.** The edition cited is withdrawn and replaced by ISO 8559-2:2025, which keeps the same sentence. "No cross-system label conversion is defined" is the worker's inference; the scope does not say it.
- **NGSP.** The two printed equations are rounded inverses of each other and drift by up to 0.019 mmol/mol over 4–12 %, so one direction should be the definition.
- **21 CFR 101.7.** The compound form is one allowed option: fractions ("1.5 lb") are allowed too. (m)(4) forbids skipping a unit ("1 quart 24 ounces" is not allowed). Rule (j) applies only under 4 lb or 1 gallon.
- **NIST SP 811 §7.3** prefers decimal degrees except in cartography and astronomy, and does not discuss feet and inches.
- **Smaller notes:**
  - CSS Values 4 is a Working Draft.
  - ISO 8653 does not cover national ring-size scales (US numbers, UK letters).
  - ISO's 5 and 7.5 mm Mondopoint steps come from DIN 66074-2.
  - Korea is new in the 2023 edition of ISO 19407.
  - Google's list is from its help page, not a test of the live converter.
  - Gas mark 1's 275 °F is tagged [citation needed] on Wikipedia.

## Summary

1. 37 rows: 33 confirmed, 4 corrected (A03, A15, A19, A36), 0 wrong, 0 could not reach, 0 not checked. A18 is confirmed but flagged for the bot check.
2. Most consequential: A19 (in the wild, measured). On the Brannock chart UK adult 4.5, not 4, aligns with US men's 5 at 9 in, so men's = UK + 0.5. Pixel-measured on the image.
3. A36 (standard, measured). CLDR shows US body weight in plain pounds; pounds and ounces only under 1 lb. From units.xml plus the CLDR spec's threshold rule.
4. A15 (standard, measured). 321/324 only with ISO's printed steps; 317 with exact steps, 323 with either. My own script, every row checked on the page images.
5. A03 is wording only ("exact" is not in the 2023 abstract).
6. Tool calls: 63 of 150.
7. Everything is in the checker's folder (this folder holds the keepers): `check.csv`; `table2_recompute.py`, `table2_recompute.out.txt`; `table2_direction.py`, `table2_direction.out.txt`; `write_check.py`; the downloads (the re-downloaded `gost.pdf`, page images `gost_p1.png` to `gost_p11.png`, the Brannock crop `chart_crop_9in.png`) stayed in the session's scratchpad except the crop, kept here as the evidence for A19.
8. I never opened the workers' notes or anything in their folders, wrote nothing to the repo, and ran no pnpm or git.
