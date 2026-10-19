# Shoe sizes: findings (demand map 1, question 3)

Worker report, 2026-10-19. Delivered as the worker's reply and saved here by the orchestrator.

**Answer.** Shoe sizes can join bigsmall as a category checked against a body: ISO 19407, from ISO's footwear committee (TC 137). Its 2015 edition, ISO/TS 19407:2015, was replaced in 2023 by ISO 19407:2023.

- **Shape.** It converts Mondopoint, EU, UK, US men's and US women's through foot length in millimetres, using straight-line formulas and rounding to the half size. That is the same shape as Temperature's scales.
- **Checked.** The worker read the whole 2015 text in its Russian national adoption, GOST R 57425-2017, which changes only the references. From its formulas it recomputed its simplified table (Table 2): 321 of its 324 values come back exactly, and each of the 3 misses sits within 0.01 size of a rounding boundary.
- **Not exact.** The engine cannot treat three things as exact:
  - ISO calls its own adult tables "a guideline".
  - Brands mark sizes half a size to a full size away from ISO, a gap ISO notes itself.
  - Children's sizes carry a growth allowance and restart at 13.5 → 1.
- **Recommendation.**
  - Adults on ISO's formulas, every converted value marked ≈.
  - US men's and US women's as separate units.
  - Children from ISO's children's table.
  - A brand named as the brand's when its chart joins later.

**Kind of fact** (docs/RESEARCH.md §1): conventional, one body's table. The arithmetic inside that table is defined and recomputed on our own.

## 1. The standards

**ISO/TS 19407:2015, "Footwear — Sizing — Conversion of sizing systems".**

- **Status.** Published 2015-01-30. Withdrawn 2023-06-22 and replaced by ISO 19407:2023 (EVS, the Estonian standards body). The full text was read through GOST R 57425-2017, whose foreword says it is modified from ISO/TS 19407:2015 only "by changing certain references". The Russian is quoted in `claims.csv`; it is translated below.
- **Basis.** "There are three main shoe sizing systems (Mondopoint, European and British). Since there are fundamental differences between them, they are brought to a common base through foot length."
- **Mondopoint.** "Defined in [ISO 9407] and based on foot length." Steps of 5 mm (group 1) or 7.5 mm (group 2, mostly special footwear), "starting from zero". "Japan sometimes expresses size in centimetres rather than millimetres." A "CM" or "CMS" mark "usually indicates Mondopoint in centimetres … though sometimes, it turns out, it is the last length."
- **EUR** ("formerly known as Paris Points, French or Continental"). A step of 6.67 mm from zero, which "can be interpreted as based on last length or foot length, depending on the country of origin".
- **UK.** A step of 8.47 mm, "starting from 101.6 mm (4 inches, which corresponds to size 12 of the system). The first 13 sizes are children's, then the scale restarts at 1." It was "originally developed on shoe or last length, then recalculated to foot length".
- **US.** A step of 8.47 mm from 99.5 mm (3 11/12 in). "In reality the US system corresponds directly to UK, but with an arbitrary shift of one size for men's and two for women's."
- **Formulas.** UK adult = (l_f + 2·8.47)/8.47 − 25, "where l_f is foot length, mm, 25 corresponds to 12 sizes plus 13 children's sizes". EUR = (l_f + 2·6.67)/6.67.
- **Allowance, last against foot.**
  - "In both cases the difference between foot length and shoe (or last) length is taken as empirically equivalent to two sizes."
  - An alternative "in use but not established by this standard" takes a 5% difference. It agrees for EUR 38 to 46 and differs "by about half a European size" at the ends.
  - Table 1's last-length columns are "for information only". For a 270.1 mm foot the typical last runs 277 to 289 mm, about 7 to 19 mm over the foot.
- **Fit range** (Table 1, note a). A shoe "is expected to accommodate foot lengths l_f ± i_sg/2", where i_sg is the size step: half a size either way.
- **ISO against the trade.** "Table 2 shows UK 4 corresponds to EUR 36.5 and UK 8 to EUR 41.5, while shoes are often marked 4 UK/37 EUR and 8 UK/42 EUR. Nevertheless, Tables 1 and 2 are taken as the most technically correct."
- **Marking.** The system used in manufacture goes first, in bold: women's **Mondo 240** EUR 38 UK 5.5 US 7.5, men's **EUR 41** Mondo 260 UK 7.5 US 8.5. "It is generally better to mark slightly large than small."
- **Children** (Table 3). Sizes include "a functional toe allowance up to 8% of its length". "The US system is based on UK with an arbitrary offset, usually half a size step, for children's."

**ISO 19407:2023.** Edition 1, approved 2023-06-22, 8 pages; it replaces ISO/TS 19407:2015 (SIS, the Swedish standards body).

- Abstract: "This document provides three shoe size conversion tables covering the major shoe sizing systems (Mondopoint, European and United Kingdom), as well as China, Japan, the Republic of Korea and United States. The tables are based on measurement of foot length, this being the logical starting point for any shoe size marking system."
- Its note: "Due to the different ways in which each system has been developed and interpreted over many years without being formalized and the absence of solution to the problem of shoe size conversions, Tables 1 and 2 provide a guideline which can benefit the consumer."
- Its text could not be reached, so whether its numbers differ from 2015's is unknown.

**ISO 9407:2019, Mondopoint.** Edition 2, 2019-06; it replaces the 1991 edition (SIS; BSI publication date 2019-07-31).

- Scope (BSI): it "specifies a method of designation and marking of footwear size called Mondopoint … applicable to all types of footwear".
- China's adoption, GB/T 43293-2022, in an English excerpt:
  - "The shoe size shall be expressed by the indicated value of foot length … the unit is millimeter (mm). The measurement unit may not be marked."
  - Shoe size is the "size marking of a shoe or last made for a given foot length".
  - Marking: "MP263, MP263/94, MP263-94, Mondo 263(94)".
- Mondopoint is therefore foot length by definition. The full text could not be reached.

**The Paris point** is 2/3 cm = 20/3 mm; ISO steps it as 6.67 mm. Haflinger says it was set "around 1800 in France" (lead). DIN 66074-2:1975, the German length grading, is withdrawn, and DIN recommends ISO 9407.

**The barleycorn** is 1/3 in = 25.4/3 mm = 8.4667 mm. It is exact because the inch is exact; ISO steps it as 8.47 mm (12 sizes = 101.6 mm). SATRA (Stuart Morgan, Dec 2023) says "mediaeval sources recognised the average length of a grain of barley as being close to one-third of an inch". The Edward II origin of shoe sizes is a legend (lead).

## 2. The systems and the arithmetic

Write l for foot length in mm, b = 25.4/3 mm, p = 20/3 mm. These are ISO's formulas rearranged.

| System                   | Size from foot length      | Foot length from size | Display step       |
| ------------------------ | -------------------------- | --------------------- | ------------------ |
| Mondopoint               | s = l                      | l = s                 | 5 mm (7.5 special) |
| Japan, China, Korea (cm) | s = l/10                   | l = 10s               | 0.5 cm             |
| EU                       | s = l/p + 2                | l = (s − 2)·p         | 0.5                |
| UK adult                 | s = l/b − 23               | l = (s + 23)·b        | 0.5                |
| US men's                 | s = l/b − 22               | l = (s + 22)·b        | 0.5                |
| US women's (ISO)         | s = l/b − 21               | l = (s + 21)·b        | 0.5                |
| UK and US children's     | ISO Table 3, 120 to 230 mm |                       | 0.5                |

**Last length.** The last is the foot plus two sizes: an EU last is l + 13.3 mm, a UK last l + 16.9 mm. EU and UK sizes are therefore last length counted from zero, under an allowance ISO calls empirical.

**Verification** (measured: `check_table2.py`, run on the GOST text). Each of Table 2's three gradings starts from its own size, takes the foot length, and rounds the others: Mondopoint to 5 mm, the rest to the half size. US men's is UK + 1 and US women's UK + 2.

- 321 of 324 values reproduce with the exact steps. Two misses: Mondo 235 → UK 4.5 where the formula gives 4.756, and Mondo 290 → UK 11 against 11.252.
- 321 of 324 also reproduce with ISO's rounded 8.47 and 6.67, with different misses: UK 2 → EUR, UK 8 → Mondo, UK 15 → EUR.
- Every miss is within 0.01 size (or 0.1 mm) of a boundary.
- Exact ties go both ways. Mondo 215 → EUR 34 rounds down, while UK 2 → EUR 34 rounds up. Wikipedia's "rounded to a larger shoe size" is wrong on this.
- The table does not round-trip: EUR 36 and 36.5 both give UK 4, and UK 4 gives EUR 36.5.

**Disputes, with who says what:**

- **US women's over US men's:**
  - **+1** (UK + 2):
    - ISO/TS 19407.
    - Brannock's chart: women's 6, men's 5 and UK 4 line up at a 9 in foot, read off the image.
    - Adidas, as a retailer reproduces it.
    - Luft (Japan): "the US alone differs by 1.0 between men's and women's".
    - Zappos's own tables: men's 8 and women's 9 both at 9.9 in.
    - Wikipedia's "standard" or FIA scale.
    - SATRA's "UK woman's size 5 is called a size 7 in the USA" agrees.
  - **+1.5:**
    - Nike: men's 8 and women's 9.5 both at a 10 in foot.
    - Clarks Australia: women's UK + 2.5, men's UK + 1.
    - KEEN: "Add 1.5 sizes."
    - Wikipedia's "common" scale.
    - SATRA names a "common" and a "less popular 'standard'" US system.
  - **+2:**
    - Zappos's FAQ: "USA men's shoe sizes are 2 smaller in size than woman's shoes", which contradicts its tables.
    - Reviewed (USA Today network) quoting the Shoe Service Institute of America's historian: "adding 1.5 or 2 sizes", and from women's to men's "subtract just 1.5".
- **US men's over UK.**
  - **+1:** ISO, Brannock, Nike, Clarks, and SATRA ("American man's size 12 … UK man's size 11").
  - **+0.5:** Adidas and Zappos (men's 10 = UK 9.5).
  - Wikipedia, citing Besching 1990 (a German shoe-industry handbook, not read), says US makers offset "some by ½ barleycorn, others by 1".
- **EU against ISO.**
  - At UK 7, ISO gives EUR 40; Nike and Clarks give 41.
  - At UK 8, ISO gives 41.5; Adidas and SATRA give 42.
  - Haflinger's rule, (foot cm + 1.5) × 1.5, sits a quarter size above ISO.
- **Japan's cm.** ISO and Luft (citing JIS S 5037, the Japanese standard) read it as foot length. Nike: "the CM size displayed on shoe boxes and labels is different than Foot Length". Nike lists JP 26 for a 10 in (25.4 cm) foot.
- **The last allowance.** Wikipedia says 13 to 25 mm over the foot; the 2015 text's table gives about 7 to 19 mm.

**Half sizes** are the display step everywhere except Mondopoint (5 mm) and Japan (0.5 cm). SATRA dates US half sizes to 1887.

**Widths** are named and set out of scope:

- US AAA to EEE, about 3/16 in apart (Brannock).
- UK C to H, with "medium" varying by maker.
- Mondopoint's optional width in mm (/94).
- Japan's girth letters.

## 3. The sites opened

| Site                                       | Gender first?                                                            | Systems listed                                                                                                              | Variance admitted                                                                     | Form                            |
| ------------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------- |
| Nike                                       | Yes: separate men's/unisex, women's, kids' charts                        | US M, US W, UK, CM/JP, EU, foot length (in); kids in C and Y                                                                | "If the measurement is between sizes, we recommend sizing up"; CM is not foot length  | A table per audience            |
| Adidas (a retailer's copy; adidas.com 403) | No: UK column first                                                      | UK, US M, US W, EU in thirds (40.7, 41.3, 42)                                                                               | none quoted                                                                           | One unisex table                |
| Clarks Australia                           | Yes: men's and women's                                                   | UK, EU, US, cm (foot)                                                                                                       | "there is no true conversion available. Therefore this chart is an approximate only"  | Two tables                      |
| Zappos                                     | Yes: women's first, then men's, big kids, little kids, toddlers, infants | US, UK, Europe (women's as ranges, 38-39), inches, cm                                                                       | "merely a guide"; lasts differ; AUS "equivalent to US or UK. It depends on the brand" | Six tables                      |
| Brannock Device                            | No                                                                       | 11 scales against foot length: US M, US W, US junior, UK adult and junior, Euro adult and junior, cm, cm junior, Mondopoint | "Often variations exist among the same scale from one country to another"             | A ruler                         |
| Luft (Japan)                               | No: type any system                                                      | JP cm, US (M/W), UK, EU                                                                                                     | "the same marking differs in real length by brand"                                    | A converter                     |
| Wikipedia                                  | No: foot length first                                                    | foot (mm, cm, in), Mondopoint, EUR, UK, US M, US W                                                                          | "Conversion tables available on the Web often contain obvious errors"                 | A sortable table by foot length |
| Blitzresults                               | Men-to-women table                                                       | US W, US M, UK, EU, foot (in)                                                                                               | none beyond measuring advice                                                          | Static charts                   |
| bakame (open-source PHP)                   | No: a system plus an age type                                            | EU, UK, US M, US W, cm, Mondopoint                                                                                          | "not a lookup in the ISO conversion table"                                            | Formulas                        |

**The pattern.**

- Retailers start from the audience (men, women, kids); reference works and converters start from foot length or the system.
- Every site admits variance in words; none gives a number.
- Brands put their EU half a size to a full size above ISO.
- bakame is prior art for our model: the same affine constants (EU offset 2 and scale 20/3 mm, UK 23, US men's 22, US women's 21 at 3 a inch), the nearest half size, Mondopoint to 5 mm, and children that "MUST use a specific conversion table".

## 4. The grammar people type

From Google's public suggestions for 26 prefixes (`downloads/suggest/google-suggest.json`; community layer, asserted). Generated pages titled with the query ("size 45 euro to us", "What is 27cm in US shoe size?") point the same way. Reddit threads did not surface.

- **System then number:** "us 11 to eu", "us 10.5 to uk", "eu 45 to us men's", "eu 42 to us women's", "uk 9 to us shoe size kids", "jp 27 to us", "jp 27.5 to eu".
- **Number then system:** "11 us to eu", "9 uk in us", "44 eu to us", "44 eu shoe size to us".
- **Gender marks:** "us m 11.5 in eu", "us m11 size", "is m11 in uk", and the unisex label "us m 11 w 12.5" or "us m 11.5 w 13".
- **"size N in X":** "size 11 in eu", "size 11 in europe men", "size 11 in mexico", "size 11 in china", "size 11 in inches".
- **Centimetres:** "27 cm shoe size in us", "27 cm shoe size women's", "27cm to us shoe size", "27cm foot shoe size".
- **Across genders:** "women's 8 in men's", "womens 8 in mens", "mens 10 in womens", "11.5 mens in womens", "size 9 women in men".
- **Across ages:** "women's 8 in kids", "women's 8 in grade school", "size 9 women in kids", "kids shoe size 6 in women's".
- **Gender and system together:** "11.5 mens in eu", "us 11 mens to eu", "us 11 womens to eu".
- **A bare EU number:** "shoe size 40 in us", "size 44 in us men's shoes", "toddler shoe size 23 in us", "kids shoe size 30 in us".
- **Regions with no ISO column:** "9 uk in indian size" (India uses UK); "size 11 in mexico" and "kids shoe size mexico to us" (cm, per Wikipedia; a lead).
- **Brands:** "eu 45 to us men's birkenstock", "womens 8 in mens nike", "men's 10 in womens vans".
- **Collisions with clothing and length:** "size 44 jersey", "44 eu to us pants", "uk 8 to us dress", "eu 42 to us women's clothing", "27cm to inch".

## 5. The proposed model

**The base quantity is foot length in mm, not last length.**

- ISO's tables rest on foot length.
- Mondopoint is foot length by definition.
- A visitor can measure a foot but not a last.
- On a foot base, Mondopoint and Japan are exact, and EU and UK carry ISO's two-size allowance. On a last base, Mondopoint and Japan would depend on that empirical allowance.

**Each adult system is an affine scale**, toBase(s) = a·s + c, in mm:

| Unit         | a (mm per size) | c (mm)      |
| ------------ | --------------- | ----------- |
| Mondopoint   | 1               | 0           |
| JP (foot cm) | 10              | 0           |
| EU           | 20/3            | −40/3       |
| UK           | 25.4/3          | 23 × 25.4/3 |
| US men's     | 25.4/3          | 22 × 25.4/3 |
| US women's   | 25.4/3          | 21 × 25.4/3 |

Foot length in mm, cm and in are rows too, exact.

**Display.**

- Each row rounds to its system's step: the half size, 5 mm, 0.5 cm.
- Ties go to the even step, the project's rounding (ISO's ties go both ways).
- Every value converted to another system is marked ≈ ("about"), as Cooking's density crossings are; foot-length rows are exact.
- A row taken back into the box re-reads from the foot length, never from a chain of roundings.

**A worked example per system, for one foot of 270 mm** (all ≈):

| System           | Arithmetic             | Size                             |
| ---------------- | ---------------------- | -------------------------------- |
| Mondopoint       | 270                    | 270                              |
| JP               | 270/10                 | 27                               |
| EU               | 270/(20/3) + 2 = 42.50 | 42.5                             |
| UK               | 270/8.4667 − 23 = 8.89 | 9                                |
| US men's         | 9.89                   | 10                               |
| US women's (ISO) | 10.89                  | 11 (11.5 on the +1.5 convention) |

This matches ISO Table 2's row "270 42,5 9 10 11" and SATRA's "UK Men's size 9 … Mondopoint size 270".

**The typed forms, each read back to a foot length:**

- **"eu 45":** 286.7 mm, so UK 11, US men's 12, US women's 13, Mondopoint 285, JP 28.5. Nike lists EU 45 as US men's 11.
- **"uk 9":** 270.9 mm, so EU 42.5 (42.64), US men's 10, US women's 11, Mondopoint 270.
- **"us 11":** 279.4 mm, so UK 10, EU 44 (43.91; Nike says 45), US women's 12, Mondopoint 280, JP 28.
- **"women's 8":** 245.5 mm, so EU 39 (38.83), UK 6, US men's 7, Mondopoint 245, JP 24.5.
- **A child's 150 mm foot**, from ISO Table 3: Mondopoint 150, EUR 24.5, UK 7.5, US 8; last 163 to 169 mm.

**Gender as units, not a second value.**

- Only the US scale splits by gender. EU, UK, Mondopoint and Japan are unisex in ISO, Luft, and every chart opened.
- So "US men's" and "US women's" are two units, as mpg (US) and mpg (UK) are.
- "m", "mens", "us m 11" read as men's; "w", "women's" as women's.
- A bare "us 11" reads as US men's, since "most unisex shoes follow the men's sizing scale" (Reviewed), with US women's next among the matches.

**The second value is the chart.** The Cooking pill's shape, a second value joining a unit, fits the chart better than gender:

- ISO 19407 by default.
- A brand's chart (Nike, Adidas, Clarks) later, named as the brand's, as RESEARCH §1 says: "A table with no body behind it (a brand's chart) is named as the brand's."

**Where it breaks, and what the page says:**

1. **Children.**
   - Why the adult formula fails:
     - A growth allowance of up to 8%.
     - Scales that restart (13.5, then 1).
     - C and Y suffixes (Nike: 13.5C then 1Y; 4Y = men's 4 = women's 5.5).
   - A fit through Table 3 suggests a last of about 1.08·l + 3 mm (reasoned, not adopted).
   - So children are ISO Table 3 as a lookup from 120 to 230 mm, never the adult formula; bakame came to the same rule.
   - Page line: "Children's sizes from ISO 19407's children's table."
2. **The women's offset.** Show ISO's (men's + 1). Line under the table: "US women's on ISO's scale, men's + 1; Nike and Clarks count + 1.5." Whether to offer +1.5 as a choice is for Sean.
3. **Brands.**
   - EU marks run half a size to a whole size above ISO (ISO's own note; Nike, Clarks, Adidas).
   - Adidas counts EU in thirds, with US men's at UK + 0.5.
   - Line: "Sizes by ISO 19407's foot-length rule; a brand's own chart can differ by up to a size. Measure your foot and check theirs."
4. **No round trip.** ISO's table itself does not invert, so the engine recomputes every row from the foot length.
5. **Japan's labels.** A "CM" mark can be last length (ISO), and Nike's JP is not the foot, so the unit is named "JP (foot cm)".
6. **Widths and regions.**
   - Widths are named only.
   - India is a UK alias.
   - Mexico (cm) needs a source of its own.
   - Australia is UK for men and US for women, by brand (Zappos, Wikipedia).
7. **Clothing.** A bare "size 44" or "uk 8" can be clothing. Shoe size needs "shoe" or a shoe system with a number to win over a clothing reading.

## The worker's summary

1. **Answer:** shoe sizes can join as a category checked against ISO 19407. Adults are affine scales on foot length in mm with half-size rounding and ≈; US men's and US women's are separate units; children come from ISO's table; brands are named as brands.
2. **Finding (asserted by the standard):** read in full through GOST R 57425-2017, ISO/TS 19407:2015 gives UK = (l + 2·8.47)/8.47 − 25 and EUR = (l + 2·6.67)/6.67, with the last two sizes over the foot. US is UK + 1 for men and + 2 for women, and a shoe fits a foot within ± half a size.
3. **Finding (measured):** the formulas with half-size rounding reproduce 321 of the 324 values in ISO's Table 2, each miss within 0.01 size of a boundary; the table does not round-trip.
4. **Finding (asserted by ISO and the brands' charts):** brands mark EU half a size to a full size above ISO. The US women's offset is +1 (ISO, Brannock, Adidas), +1.5 (Nike, Clarks, KEEN) or +2 (Zappos's FAQ).
5. **Could not reach:** the texts of ISO 19407:2023 and ISO 9407 (paywalled), so whether 2023 changed 2015's numbers is unknown.
6. **Could not reach:** iso.org and the ANSI preview PDFs (403), adidas.com (403 and a timeout), clarks.com UK, converse.com, Omni; Adidas is known only through a retailer's copy. No forum threads surfaced.
7. **Tool calls:** about 106 of the 150 budget.
8. **Files:** claims.csv (56 claims), sources.md, check_table2.py and check_table2_rounded.py with their .out.txt results, suggest.py; downloads: gost-r-57425-2017.pdf (the ISO/TS 19407 text) with gost.txt and gost-raw.txt, wiki-shoe-size.wikitext, brannock-chart.jpg and .pdf, suggest/google-suggest.json, bakame/.
9. **Cost (the orchestrator's record):** the harness reported about 231,000 tokens for the gathering sitting and 239,000 for the sitting that delivered this report.
