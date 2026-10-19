# Categories and the IA: findings (worker 2, demand map 1)

2026-10-19. Delivered as the worker's reply and saved here by the orchestrator. This extends docs/research/categories-1.md and does not redo it. Every sourced claim is a row in `claims.csv`, with its layer and evidence level as RESEARCH.md §8 sets them; "normative" means a standard's own words. **(mine)** marks the worker's opinion or arithmetic, not a finding.

## The answer first

- **Add seven categories, for 23:** Shoe size, Data rate, Frequency (rpm with it), Density, Flow, Acceleration, and Blood sugar. Ring size, which was not on the brief, is a strong 24th.
- **Fold four things into existing categories as sections,** the way pace sits inside Speed:
  - gas marks into Temperature;
  - pt, pc and CSS px into Length, since CSS defines all three as lengths;
  - rpm into Frequency;
  - later, paper sizes as named width × height pairs in Length.
- **Leave garment labels out.** The only standard designates clothes by the wearer's body measurements and leaves the garment's to its maker.
- **Tailor measurements are lengths** that Length already converts.
- **For the start and the menu (mine):**
  - Fewer tiles, more sections.
  - A fixed Everyday block of eight tiles first, the rest after it as a list.
  - Group names only in a three-column desktop menu.
  - Favorites later, pinned by the visitor and never reordered by use.
- **Google's box** covers data rate, frequency and flow among the candidates. It covers nothing for torque, density, acceleration, any sizes, gas marks, paper or glucose, and it never shows a table.

## 1. The candidates

**How to read the demand column.** Both signals are relative proxies (layer 4, measured; `downloads/signals.json`).

- English Wikipedia user pageviews, October 2025 to September 2026, measure interest in a topic, not a wish to convert.
- Google's US autocomplete shows that a query shape exists, not how often it is searched.
- Anchors for scale: Torque, which we built, had 317,130 views; Inch had 185,157.

| Candidate                                                | Demand signal                                                                                                                                  | Fit                                                                                                                                                                                                        | Body behind it                                                                                                                                                                                                                                                                                                  | Recommendation                                                                                                                                  |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shoe sizes**                                           | Shoe size 172,191 views. Autocomplete: "us shoe size to eu / china / uk / mexico / japan / cm"; "shoe size conversion men to women"            | Its own category on worker 3's model: system and gender as a second value, as Cooking takes an ingredient                                                                                                  | ISO/TS 19407:2015, "comprises three shoe size conversion tables … based on measurement of foot length"; withdrawn, "Replaced by: ISO 19407:2023" (SIS page; normative)                                                                                                                                          | **In**                                                                                                                                          |
| **Oven gas marks**                                       | 26,772 views. "gas mark 4 in fahrenheit / celsius / fan oven / fan oven uk"                                                                    | A scale with an offset, as Temperature already handles. A section of Temperature (Oven), not a category                                                                                                    | **None.** It comes from Radiation Ltd.'s trade name "Regulo". Wikipedia's "increase by 25 °F (14 °C) for each gas mark step" carries no citation, and its base value is tagged "citation needed" (a lead)                                                                                                       | **In, as a section;** the figures go through RESEARCH.md's rule for conventional figures. The fan-oven offset is a second convention, **later** |
| **Blood sugar (mg/dL, mmol/L)**                          | Blood sugar level 147,770; Glycated hemoglobin 84,309. "mmol/l to mg/dl glucose"; "… cholesterol"; "mg/dl to a1c calculator"                   | A lens like Cooking: the factor depends on the substance (glucose, cholesterol). HbA1c (% to mmol/mol) is its own section. Health stakes need a plain note (mine)                                          | Defined. Glucose's molar mass is "180.1559 amu" (NIST WebBook), so 1 mmol/L = 18.016 mg/dL. HbA1c: "IFCC = (10.93*NGSP) - 23.50" (NGSP; normative)                                                                                                                                                              | **In** (glucose and HbA1c first; other substances **later**)                                                                                    |
| **Paper sizes**                                          | Paper size 360,302, the highest of all; Letter 61,806; ISO 216 54,704. "a4 size in inches / cm / pixels / mm"; "letter size in pixels 300 dpi" | A named pair of lengths, not a unit conversion. Belongs in Length once worker 4's pair display exists. "In pixels" needs a resolution                                                                      | ISO 216 "specifies the trimmed sizes of writing paper and certain classes of printed matter" (SIS; normative). Letter is under ANSI/ASME Y14.1 (a lead, not read)                                                                                                                                               | **Later**, inside Length                                                                                                                        |
| **Data rate**                                            | Bit rate 50,362; Data-rate units 44,671. "mbps to mb/s / gbps / kbps / mb"                                                                     | Its own category beside Data, not a section of it: a different quantity. "mbps to mb" shows the bit and byte confusion a table settles                                                                     | SI; IEC 80000-13 (catalog §2)                                                                                                                                                                                                                                                                                   | **In**                                                                                                                                          |
| **Frequency**                                            | Hertz 231,764; Frequency 192,127. "hz to seconds / mhz / rpm / khz / rad/s / ms"; "ghz to wavelength"                                          | Cheap. People pair it with rpm, so a Rotation section goes inside it, with a note on the 2π between Hz and rad/s                                                                                           | SI. That the SI Brochure keeps the hertz for periodic phenomena was seen only in a quoted snippet (a lead)                                                                                                                                                                                                      | **In**                                                                                                                                          |
| **Density**                                              | 200,889 (much of it school reading). "kg/m3 to lb/ft3 / g/cm3 / lb/in3 / g/ml / lb/gal"                                                        | Cheap, plain factors; Cooking's neighbour                                                                                                                                                                  | NIST SP 811 B.9, "Mass Divided by Volume (includes Mass Density and Mass Concentration)" (normative)                                                                                                                                                                                                            | **In**                                                                                                                                          |
| **Flow**                                                 | Volumetric flow rate 47,795. "gpm to lpm"; "cfm to m3/h"; "l/min to cfm"                                                                       | Cheap                                                                                                                                                                                                      | NIST SP 811 B.9, "Volume Divided by Time (includes Flow)" (normative)                                                                                                                                                                                                                                           | **In**                                                                                                                                          |
| **Acceleration**                                         | 120,905; Standard gravity 53,908. "m/s2 to ft/s2 / g"; "g force to mph"                                                                        | Cheap. The units' notes can name the "g force to mph" confusion                                                                                                                                            | NIST SP 811 B.9: standard g_n "9.806 65 E+00" m/s² (normative)                                                                                                                                                                                                                                                  | **In**                                                                                                                                          |
| **Typography units**                                     | Dots per inch 58,804; Point 37,688; Pica 13,243. "pt to px"; "px to inches / rem / mm / cm"; "em to px"; "dpi to ppi"                          | pt, pc and CSS px are lengths: a Length section, "Type and screen". em and rem need a base size, and dpi a resolution, each a second value; Raycast takes one inline ("2 inches in px at 72 ppi", layer 5) | CSS Values 4: "1in = 2.54cm = 96px … 1pc = 1/6th of 1in … 1pt = 1/72nd of 1in" (normative for CSS). Google also lists "Didot points" and "PostScript points"                                                                                                                                                    | **In** as a Length section (pt, pc, px); em, rem and dpi **later**                                                                              |
| **Ring sizes** (added)                                   | Ring size 71,643. "ring size conversion us to uk / cm / inches"                                                                                | Same shape as shoe size; it could live in one Sizes category with shoes                                                                                                                                    | ISO 8653 "specifies the designation of the ring-size" (normative). The UK's BS 6820:1987 was "Withdrawn … 15 Mar 1993", so US numbers and UK letters rest on convention                                                                                                                                         | **Later**, beside Shoe size                                                                                                                     |
| **Garment size labels** (S/M/L, dress, collar sizes)     | Clothing sizes 77,873; EN 13402 3,665. "dress size conversion us to uk / aus"; "clothing size conversion chart european to us"                 | **A lookup, not a conversion.** No body maps one country's labels to another's; the charts are brands'. Collar size is neck girth, a length                                                                | ISO 8559-2: "The size designation system is based on body measurements, not garment measurements. The choice of garment measurements is normally determined by the designer and the manufacturers" (normative). One writer's tape found five "size 4" shorts at 26.5 to 30.5 in waists (layer 5, measured, n=5) | **Out**                                                                                                                                         |
| **Tailor or body measurements** (bust, waist, hip, neck) | "waist size cm to inches"; "neck size in inches / cm"; "bust size in inches"                                                                   | **A length we already convert.** Words like "waist" are noise words for worker 4's grammar (mine)                                                                                                          | ISO 8559-1 defines how each is measured (named in 8559-2's scope)                                                                                                                                                                                                                                               | **Out** as a category; Length covers them                                                                                                       |

## 2. How others group their categories, opened and tried

**Method.** Opened by script in headless Chromium on 2026-10-19, at 390 × 844 with touch and at 1280 × 800. For each site the worker took a screenshot and recorded its headings, links, and first 25 Tab stops (layer 4, measured unless noted). Tab order was recorded, but no claim is made about focus visibility, since the script cannot judge it reliably.

**Converter sites:**

- **unitconverters.net:**
  - six tabs over the converter: Length, Temperature, Area, Volume, Weight, Time;
  - 40 common pair links, then about 80 converters in nine groups;
  - a unit-first search, "Find the Units to Convert";
  - Tab reaches the converter's inputs first;
  - it reflows at 390.
- **calculator.net:** five tabs (Length, Temperature, Area, Volume, Weight).
- **metric-conversions.org:** ten categories (Temperature, Length, Area, Volume, Weight, Speed, Time, Angle, Pressure, Energy and power), then "Popular links" of pairs.
- **onlineconversion.com:**
  - a "most used" row of ten (Fractions, Length, Temperature, Speed, Volume, Weight, Cooking, Area, Fuel Economy, Currency);
  - then about 30 categories alphabetically, Clothing among them, plus a 48-option select;
  - Tab walks the whole list;
  - at a 390 px window the page is 696 px wide, so it scrolls sideways.
- **convert-me.com:**
  - five groups: Basic, Ancient and Historical, Special (Fuel Economy, Cooking, Shoe Sizes, Ring Sizes, Currency…), Engineering, Computer;
  - a search;
  - 748 px wide at 390.
- **TranslatorsCafe:**
  - ten field groups: Common, Mechanics, Heat, Fluids, Sound, Light, Electrical, Magnetism, Radiation, Misc;
  - "Women's Clothing and Shoe Sizes" sits in Common;
  - 509 px wide at 390.
- **Omni:** topic groups with emoji headings ("Force, pressure, and torque converters 🐘", "Earth measurements", "Tech and electronics"), built of pages per pair.
- **Inch Calculator:**
  - collapsible groups ("Commonly Used", "Cooking & Baking", "Electrical", "More");
  - a "Search for a converter" field.
- **UnitJuggler:** "Basic dimensions" and "Other dimensions", topic entries (Cooking, Mobility, Real estate), and sizes kept apart as "Size charts", which names them as lookups.
- **Wolfram|Alpha:**
  - type-first;
  - "Gas Marks" sits under Industrial Measures & Standards;
  - ring and shoe sizes sit under "Fashion Sizes".
- **RapidTables:** categories alphabetically, then pages of pair links. Its first 16 Tab stops are header and category links, before any content.

**Reference products (asserted):**

- **Apple's iOS Calculator:** "Swipe the categories at the top of the list to see others" (Apple Support), a horizontal row. A secondary report lists 15 categories (Angle, Area, Currency, Data, Energy, Force, Fuel, Length, Power, Pressure, Speed, Temperature, Time, Volume, Weight).
- **Windows Calculator:** twelve converters plus currency, in a flat list (Wikipedia).
- **Search-first apps:**
  - Convert Any Unit: "Just type in a unit without first selecting the category … Over 6,400 Units In 53 Categories", with favorites saved automatically.
  - Convoto: "27 such categories, presented as a scrolling list", a unit search, and a favorites filter (Macworld, 2015).

**Could not reach:**

- Google's results page served a bot check. Its widget's dropdown is unverified; from memory about 14 categories **(mine, to check)**.
- convertunits.com returned 403.
- Bing's page in headless rendered no widget.

**What the products agree on (reasoned from the above):**

- The everyday set is small and stable: Length, Weight, Volume, Temperature and Area in every short row, Time and Speed in most.
- Past about 15 categories, every product adds headings, collapsible groups, or a search.
- Sizes are kept apart or called charts.
- The type-first products skip categories entirely.

## 3. The guidance layer

**Normative floor:**

- WCAG 2.2 1.4.10 Reflow (AA): "Content can be presented without loss of information or functionality, and without requiring scrolling in two dimensions." Three of the converters above fail it at 390 px (measured).
- bigsmall's own 44 px targets and keyboard walk already exceed the floor.

**Reputable guidance:**

- **NN/g, "Flat vs. Deep Website Hierarchies" (Whitenton, 2013; reasoned):**
  - "Flat hierarchies tend to work well if you have distinct, recognizable categories";
  - "All other things being equal, deep hierarchies are more difficult to use";
  - but "Users can also become overwhelmed with long, cluttered menus."
- **NN/g, "Mega Menus Work Well" (Nielsen & Li, 2017; reasoned):**
  - "Use concise, yet descriptive labels for each group";
  - "Everything visible at once";
  - "Keep a medium level of granularity. Don't offer huge groups with numerous options that require extensive time to scan."
- **NN/g, "Menu-Design Checklist" (Laubheimer, 2024; reasoned):**
  - "Menus shouldn't be hidden when you have plenty of space to display them";
  - "use category labels that are familiar and relevant";
  - "putting the most common items close to the link target";
  - and "The hamburger menu is a necessary evil on smaller screens."
- **Larson & Czerwinski, CHI 98 (measured, controlled study):** "while increased depth did harm search performance on the web, a medium condition of depth and breadth outperformed the broadest shallow web structure overall."
- **Findlater & McGrenere, CHI 2004 (measured, n=27; split menus):**
  - static was "significantly faster than adaptive for all three orders";
  - "the adaptable menu was preferred by the majority of subjects (55%) … only 15% of subjects wanted the static menu".

**Where the guidance drifts or debates:**

- **Breadth versus depth.** NN/g leans flat; Larson & Czerwinski measured that the broadest is not best. They meet at one level of grouping with distinct labels, never two.
- **Static versus adaptive.** The fastest menu was static, the most preferred was adaptable, and adaptive lost on speed. A "most used" row should be fixed by us or pinned by the visitor, never reordered by recency.
- **"Everything visible at once" versus a phone.** The mega-menu advice is desktop advice. On a phone NN/g concedes hiding as a "necessary evil", and the products answer with a search or a horizontal row (Apple).
- **Hick's law.** It is cited everywhere, and NN/g's own page on long menus is a video summary with no transcript. Nothing measured on category grids was found; the law's application to menus is asserted, not established here.

## 4. Groupings for 20 to 25 of bigsmall's categories

**The set.** Today's 16 (Length, Weight, Volume, Cooking, Temperature, Area, Speed, Time, Data, Fuel economy, Energy, Pressure, Power, Force, Torque, Angle) plus Shoe size, Data rate, Frequency, Density, Flow, Acceleration and Blood sugar make 23. Ring size is optional.

**Sections in every option,** as pace sits in Speed:

- Temperature gains Oven (gas marks);
- Length gains Type and screen (pt, pc, CSS px), and later paper sizes;
- Frequency gains Rotation (rpm, rad/s);
- Blood sugar gains HbA1c.

**Measured today at 390 px:**

- 16 tiles run 2 across and 380 px tall, 47.5 px a row.
- The open menu is 2 columns of 44 px rows, 352 px, starting at y 169.

**Projected (mine):**

- 24 tiles take 12 rows, about 570 px, ending near y 824 in an 844 px window. A real phone's browser bars make the window shorter, so the start would scroll.
- The menu would be 528 px, ending at y 697. It fits an 844 px window and scrolls inside a shorter one, as built.

**A. Everyday first, then the rest (two tiers, one heading)**

- **Groups:** Everyday (Length, Weight, Volume, Cooking, Temperature, Area, Speed, Time) and More (the other 15 or 16, alphabetical).
- **Start:** eight tiles (4 rows, about 190 px), then More as a compact two-column list of 44 px rows (about 350 px), close to today's height.
- **Menu:** Everyday first; two columns on a phone, three on desktop.
- **For:** the dominant pattern in the products, the fixed-menu result, and little height.
- **Against:** "More" is a non-label (NN/g asks for descriptive group labels), and an alphabetical tail of 16 is scanned, not recognised.

**B. Five named groups**

| Group                     | Categories                                                            |
| ------------------------- | --------------------------------------------------------------------- |
| Everyday (8)              | Length, Weight, Volume, Cooking, Temperature, Area, Speed, Time       |
| Home and road (5)         | Energy, Power, Pressure, Fuel economy, Flow                           |
| Build and engineer (5)    | Force, Torque, Density, Acceleration, Angle                           |
| Digital (3 or 4)          | Data, Data rate, Frequency (plus Type and screen if it is a category) |
| Sizes and health (2 or 3) | Shoe size, Blood sugar (plus Ring size)                               |

- **Start:** Everyday as tiles; the other groups under their names, open on desktop and collapsible on a phone.
- **Menu:** three columns with headings on desktop; on a phone, headings span the two columns.
- **For:** distinct labels give each group a clear pull, and the groups give the specialist long tail of catalog §3 somewhere to go.
- **Against:**
  - Some categories fit more than one group: Energy (kitchen kcal, the bill's kWh), Angle, Frequency (radio and engines).
  - Five headings cost about five rows.
  - Odd group sizes leave half-empty rows at 2 across, so the start runs past one phone screen.
  - It is closest to the plan's own sketch (common, mechanics, cooking, digital; PLAN §2).

**C. Fewer tiles, more sections**

- Everything in A, plus one **Sizes** category that takes Shoe or Ring as its second value, as Cooking takes an ingredient.
- That gives 23 tiles carrying about 28 things, and no group names.
- **Start:** as today, 2 across on a phone and 4 from 512 px; the order puts the everyday eight first.
- **Menu:** two columns on a phone, three on desktop.
- **For:**
  - the fewest tiles;
  - one rule already in the product (PLAN §2, "Sections within a category");
  - every folded thing is still found by typing ("gas mark 4", "12 pt"), since the box matches units across all categories.
- **Against:**
  - A section is invisible from the start; Oven is found only by typing or by opening Temperature.
  - The Settings questions for sections (PLAN §2) need answers first.
  - "Sizes" stretches "category" into a lens.

**Recommendation (mine):** C's folding with A's two tiers on the start. B's group names go only in the three-column desktop menu, where the room is. Favorites come later, pinned above Everyday.

## 5. What Google's box covers, and our edge

From Google's help page (asserted, Google's own words):

- **"Conversions you can do":** "Temperature, Length, Mass, Speed, Volume, Area, Fuel consumption, Time, Digital storage".
- **The units table's 30 types** include:
  - Data transfer rates ("bits per second (bps), bytes per second (Bps)");
  - Flow rate ("CFM, CFS … liter per minute");
  - Force ("dynes, kilograms-force, newtons, pounds-force");
  - Frequency ("GHz … MHz");
  - Energy, Pressure, Power, Angles and Currency;
  - the electric units and radiation;
  - Length with "Didot points" and "PostScript points".
- **Absent:** torque, density, acceleration, any sizes, gas marks, paper and glucose. The box itself could not be opened, so its dropdown is unverified.

**Our edge (mine):**

- **Categories Google lacks:** Density, Acceleration, Shoe and ring sizes, gas marks, Blood sugar, paper sizes, and CSS px, beside what we have built (Torque, pace, a temperature change, Cooking by ingredient).
- **Where Google does answer** (data rate, frequency, flow), our edge is the full table (every unit at once, the bit/byte confusion settled in one view) and sections such as Rotation.

## 6. Our own evidence, and what categories-1 should change

**Our own evidence (layer 1):**

- Friends asked for "Favorite units and categories, in a bar for quick picks (Mike)" (asserted). The research favours exactly that: an adaptable menu on top of a static one.
- Dan's multiples and Mike's fractional inches don't bear on categories.
- Our site, measured: 16 tiles at 380 px, the menu at 352 px (above).
- Community claims (asserted) point the same way:
  - a converter's maker says visitors from search land on pair pages, convert, and leave;
  - a commenter prefers "one single interface" he can type into.
- Read together (mine), the start and the menu serve browsing and returning visitors and can stay light. The box's cross-category matching is the type-first model the search-first apps sell.

**What categories-1 (2026-10-15) should change (mine, each from the findings above):**

1. **Split "Clothing and shoe sizes" in Deferred.** Shoe sizes have a body (ISO 19407) and Sean wants them. Clothing labels stay deferred for a sharper reason: ISO 8559-2 designates by body measurement and leaves garments to makers, so no conversion exists.
2. **Typography moves** from a "digital" category (catalog §3) to a Length section. CSS defines pt, pc and px as lengths. em, rem and dpi wait for a second value.
3. **Add three candidates it lacks:** Blood sugar (a Cooking-like lens by substance, plus HbA1c), Ring size (ISO 8653), and gas marks as a Temperature section with no body (the conventional rule).
4. **Data rate's rank stands** ("lower than first ranked", since Google has it). Keep it a category of its own, not a section of Data.
5. **"Past twenty categories or so: three columns where there is room, or groups"** should become: a fixed Everyday block first, one level of groups at most and only where there is room, and no reorder by use, with favorites as pins. The evidence is Larson & Czerwinski, Findlater & McGrenere, and NN/g.
6. **Paper sizes enter the list as later,** waiting for the pair display.

## Limits and leads for the checkers

- **What the signals show:** pageviews measure topic interest, and autocomplete shows shape, not volume. Worker 1 owns demand.
- **Leads to read on their own pages:**
  - the gas-mark rule and its Regulo origin (Wikipedia's uncited sentences);
  - the SI Brochure on Hz and rad/s;
  - ANSI/ASME Y14.1 for Letter;
  - ISO 19407:2023's content;
  - BS 1283:1945 for UK ring letters.
- **Not reached:** iso.org and the ANSI previews (403), iteh.es (DNS), i.sis.se (TLS), Google's results page (a bot check), convertunits.com (403), and a CTV News size test (404).

## The worker's summary

1. **Answer:** add Shoe size, Data rate, Frequency (with rpm), Density, Flow, Acceleration and Blood sugar, for 23; Ring size later. Gas marks, typographic units and paper sizes become sections of Temperature and Length. Garment labels are out, as lookups; body measurements are lengths we already convert.
2. **IA (mine):** fold things into sections, a fixed Everyday block of eight first, group names only in a three-column desktop menu, favorites later as pins.
3. **Finding (measured, controlled studies):** a static menu beat an adaptive one, "significantly faster … for all three orders", and 55% preferred adaptable (CHI 2004). A medium depth and breadth beat the broadest (CHI 98).
4. **Finding (normative):** ISO 8559-2 designates clothes by "body measurements, not garment measurements". Shoe and ring sizes have bodies (ISO 19407, ISO 8653); gas marks have none.
5. **Finding (measured, products opened):** every converter leads with a fixed row of 5 to 10 everyday categories, then groups or lists the rest, with a search. Three fail Reflow at 390 px (696, 748 and 509 px wide).
6. **Google's box** (asserted, its help page): data rate, frequency, flow, force and points yes; torque, density, acceleration, sizes, gas marks, paper and glucose no; never a table.
7. **Could not reach:** Google's results page (a bot check), convertunits.com, iso.org and the ANSI previews (403), iteh.es (DNS), i.sis.se (TLS).
8. **Tool calls:** about 97 of the 150 budget.
9. **Files:** claims.csv (57 claims), sources.md, claims1.jsonl, claims2.jsonl; downloads/ (screenshots, signals.json, wild-*.json).
10. **Cost (the orchestrator's record):** the harness reported about 242,000 tokens for the gathering sitting and 250,000 for the sitting that delivered this report.
