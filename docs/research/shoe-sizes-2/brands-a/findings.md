# Brands' charts, worker A: findings (shoe sizes 2, wave 1)

Worker report, 2026-10-20. Delivered as the worker's reply and saved here by the orchestrator. Brands: Nike, Adidas, New Balance, Puma, Asics, Converse, Vans, Skechers, Reebok, Under Armour.

**Answer.** Yes, for six of the ten brands. Nike, Under Armour, Reebok, Puma, Skechers and Asics each have their own charts on their own domains, and I recorded every cell from them. Converse is a seventh only in part: converse.com refused me, so its record comes from converse.ca, whose footer reads "© 2026 Converse Canada". Adidas, New Balance and Vans could not be reached. Every one of their sites, in every region I tried, refused both my script and the harness's fetcher (403, Akamai "Access Denied" or a security page), and I did not get around any of them. In total: 5,925 cells in `charts.csv` and 56 claims in `claims.csv`.

## Per brand

**Nike** (nike.com/us, read by script, cross-checked on nike.com/gb)

- **Charts:** Men's, Women's, and three for kids: Big Kids (1Y - 7Y), Little Kids (8C - 3Y), Babies & Toddlers (1C - 10C).
- **Columns:** US - Men, US - Women, US - Kids (Y), UK, CM / JP, EU, Foot Length (in) in sixteenths, Foot Length (cm) to 0.1. The toddler chart adds Age (Months).
- **How it was read:** from the page's embedded data. It matches the rendered table cell for cell. The cm row sits behind an IMPERIAL/METRIC toggle and is in the data too.
- **Foot or last:** the foot, stated. _"Please note the CM size displayed on shoe boxes and labels is different than Foot Length (cm)."_ The method marks _"the tip of the big toe and the outermost part of the heel."_
- **Advice:** _"Apply the longer of the two measurements … If the measurement is between sizes, we recommend sizing up."_
- **Quirks:** UK and CM/JP values repeat (US M 6.5 and 7 are both UK 6). The women's chart gives foot length only up to US W 17; the cells beyond are blank.
- **GB against US:** the same cells, but no US Kids row, labels written "US—Men", and an extra-wide girth worded differently (widths noted only).

**Under Armour** (US, UK, AU, all read by script)

- **Charts:** Men's, Women's, Boys' (US only).
- **Columns:** US Men/Women/Youth, Inches (as Unicode fractions), CM, Euro, UK. The UK site has no inches.
- **Foot or last:** the foot, stated. _"We start with the true foot, which means we measure from heel to toe. That measurement (in centimeters) is then translated into our standard sizes."_
- **Advice:** _"If your measurement is between chart numbers, we recommend sizing up."_ Also _"\*Due to the metric/imperial conversions, there will be some instances where two US sizes will equal one UK size or one CM size."_ AU alone adds _"Measurements are desired standards, some variability may occur."_
- **Regional difference:** the men's chart is the same in all three regions. The women's chart differs. The US site has US W 5 = 22.5 cm, UK 3; the UK and AU sites have 22 cm, UK 2.5. The UK sizes differ up to US W 8 and the CM differs at most sizes.
- **Inches:** the US inch column does not match its own CM (US M 7 is 9 11/16 in, which is 24.6 cm, against CM 25). The AU women's inches are CM ÷ 2.54 written in thirds, sevenths and ninths.

**Reebok** (reebok.com and reebok.ca, read by script)

- **Charts:** Men's, Women's, Unisex, a "Special Unisex" guide, and Grade School, Preschool, and Toddler & Baby.
- **Columns:** US sizes and _Heel-Toe Measurement (in)_ only, to 0.1 in. There is no UK, EU or cm anywhere on reebok.com.
- **Foot or last:** the foot. _"Mark the end of your longest toe … Take the larger of the two foot length values and compare it with our sizing chart."_
- **Contradiction:** the Unisex guide puts US M 2 = US W 3.5; the Special Unisex guide puts US M 2 = US W 3, at the same inches. The special page does not say which products it covers.
- **reebok.ca:** the same inches, with two apparent typos recorded as printed (US Women "7.5" at 9", US Men "4.5" at 8.5"). It adds boots charts with ranges ("5 - 5 ½").
- **Not reached:** reebok.co.uk did not answer; reebok.eu's path was a 404.

**Puma** (au.puma.com, nz.puma.com, eu.puma.com/de/en, eu.puma.com/en_GB, all read by script)

- **AU and NZ:** identical, cell for cell. Unisex (AU, US Men, US Women, UK, FR), Men's and Women's (US, UK, EU, _Length cm_ in 5 mm steps), Kids (age groups).
- **Foot or last:** not stated anywhere.
- **Typo:** Youth US 6.5 has EU "3.5", recorded as printed.
- **EU pages:** no length column, and DE, FR, IT and ES all repeat one number. The two EU pages disagree on women's sizes: de/en has UK 6 at both EU 39 and 40, and US 7 at EU 37; en_GB has US 6.5 at EU 37.
- **Not reached:** the US chart redirects to help.us.puma.com, which refused both tools (403).

**Skechers** (skechers.com and skechers.co.uk, read by script)

- **Charts:** Women's, Men's, Kids' (most US sizes suffixed "-L", unexplained), Infant & Toddler.
- **Columns:** USA, UK, EU only. No length.
- **Disclaimer:** _"Skechers Performance running and walking footwear sizes may vary."_
- **US against UK:** the US men's chart prints EU 42.5 for US 9, 9.5 and 10 alike; the UK site prints 42, 42.5, 43. Those are the only 2 differing cells of 204.
- **Kids' PDF:** a printable foot gauge on digital-assets.skechers.com, linked only inside an HTML comment, so it is not shown on the page. Its EU cells differ from the web chart (Toddler US 4 = EU 20 against 19.5 on the web). I recorded its tables from the text layer. Its length marks are drawn on a ruler, not tabulated, so no length per size was recorded.

**Asics** (asics.com/nz by script; asics.com/sg by the harness's fetcher after the script was refused)

- **Charts:** Men's/Unisex, Women's, Kids (K sizes), plus a Work Boot chart and a sandal chart in S–XL ranges.
- **Columns:** US, UK, EU, CM, and the other gender's US size. CM is in quarter centimetres in places (25.75, 28.25).
- **Foot or last:** not stated. NZ says _"all of our ASICS shoes come in US sizes."_
- **NZ against SG:** SG has 4H and 14H, which NZ omits. Women's US 5 is 22 cm in NZ and 22.5 cm in SG.
- **Caveat on SG:** its cells were transcribed by the fetcher's model, which lined the page's column-by-column text up into rows. They are flagged for a checker.
- **Not reached:** the US chart and nine other regions refused the script. The fetcher got through to the US site but found no chart at the paths I tried (404).

**Converse** (converse.ca only)

- **Charts:** Women's and Men's, each split into Chuck Taylor All Star and Standard Sneakers; Toddlers (1C–10.5C) and Kids (10C–6Y).
- **Columns:** US, UK, EU, cm, in. The cm and in columns are not labelled foot or shoe; the page's How to Measure is of the foot, heel to toe.
- **Advice:** _"These sneakers run large — we recommend going down a half size,"_ and _"All other styles: fit may vary."_ The Chuck chart gives 0.5 cm more than the Standard chart at the same US size.
- **Unknown:** whether converse.ca is run by Converse itself or by a distributor; the page does not say.

**Adidas, New Balance, Vans:** could not reach. Adidas refused every region and path I tried, and its old static chart host (dtbsupport.whs.adidas.com) no longer resolves. New Balance refused every region and its PDF, and its support site failed TLS. Vans refused every region; vans.com.au answered but builds its page by script, with no chart in the HTML. The search results quoted cells from third-party copies (runrepeat, scheels, size.ly). I kept those as leads only and did not record them.

## The four questions

**1. Coverage by system and region.**

- **US men's and women's:** all seven reached brands.
- **UK and EU:** all except Reebok's US site, which has neither.
- **JP or CM label:** Nike only, its CM/JP row.
- **A cm column of some kind:** Under Armour, Puma (AU and NZ), Asics, Converse. Reebok has inches only. Skechers has no length at all.
- **Kids:** all seven. Under Armour's kids chart is Boys' only.
- **Regions:** US for five brands. Second regions: Nike GB; Under Armour UK and AU; Skechers UK; Puma AU, NZ and two EU pages, but not the US; Asics NZ and SG only; Reebok Canada; Converse Canada only.
- **Missing:** no JP, CN, KR or MX columns at any brand except Nike's CM/JP and Puma's AU column.

**2. What is only partly known.**

- **Not reached at all:** Adidas, New Balance, Vans.
- **Home site not read:** Puma US and the UK site, Asics US, converse.com.
- **Fetcher's transcription, not my parse:** Asics SG.
- **Not tabulated:** the Skechers PDF's ruler marks.
- **Sites disagreeing:**
  - Skechers US against UK: 2 cells.
  - Under Armour women's, US against UK and AU: most rows.
  - Puma's two EU pages, and Puma EU against AU.
  - Asics NZ against SG.
  - Reebok's two unisex guides.
- **Apparent typos, recorded as printed:** Reebok CA (two cells), Puma AU kids "3.5", Skechers US men's three EU 42.5s.
- **Images:** no chart was an image.

**3. Reliability signals.**

- **What the brands say of their own charts:**
  - Under Armour: "desired standards, some variability may occur" (AU), and that its conversions are not one-to-one.
  - Converse: Chucks run half a size large and fit "may vary".
  - Skechers: performance shoes "may vary".
  - Nike, Under Armour and Converse: between sizes, size up.
- **Foot against last:** only Nike, Under Armour and Reebok say outright that their length is the foot's. Nike also warns that the box's CM is not the foot length.
- **What the numbers show (reasoned from the cells):**
  - Nike's foot length rises about 1/6 in (4.2 mm) per half size, while its CM/JP label rises 5 mm. So CM/JP minus foot length grows from 0.3 to 2.8 cm across the men's chart. On the toddler chart the label sits 0.7 to 2.1 cm _below_ the foot.
  - Reebok's inches rise 0.1 and 0.2 in alternately, also about 1/6 in.
  - Under Armour, Puma, adult Converse and Asics step 5 mm per half size in cm. That is a grid, not a measured rule, and Asics breaks it with quarter centimetres.
  - Repeated cells (Nike, Under Armour, Converse, Puma EU) show that the brands' own conversions are not one-to-one.

**4. A full foot-length chart against cross-system offsets alone.**

- **Full foot-length chart, said to be the foot:**
  - Nike: in and cm, every adult and kids chart; women's only to US W 17.
  - Under Armour: cm (and US inches) for men, women and boys, stated as the true foot.
  - Reebok: inches only, US sizes only, every audience, stated as heel-toe.
- **A length column whose meaning is not stated:** Puma AU and NZ (Length cm), Asics (CM), Converse CA (cm and in).
- **Cross-system offsets only:** Skechers (web and PDF) and Puma EU.
- **Unknown:** Adidas, New Balance, Vans.

## Summary

1. Six of the ten brands have charts on their own domains, recorded cell for cell. Converse was read only from converse.ca. Adidas, New Balance and Vans could not be reached.
2. Strongest finding (asserted by the page): Nike, Under Armour and Reebok say outright that their length is the foot's, and Nike says its box CM differs from foot length.
3. Strongest finding (measured): one brand's charts disagree across its own sites. Under Armour's women's chart differs between the US and the UK/AU sites, Skechers' men's EU column between US and UK, Puma's EU pages with each other, and Asics NZ with SG.
4. Strongest finding (reasoned): Nike's foot length rises about 4.2 mm per half size while its CM/JP label rises 5 mm, so the label and the foot drift 0.3 to 2.8 cm apart. Most brands' cm columns are a 5 mm grid.
5. Could not reach: Adidas (every region), New Balance (every region, and its PDF), Vans (every region; AU builds its page by script), Puma US, Asics US, converse.com.
6. Flagged for a checker: Asics SG, read by the harness's fetcher. Four apparent typos were recorded as printed.
7. Tool calls: about 106.
8. Files, in the worker's folder (`shoe-sizes-2/brands-a/`): charts.csv, claims.csv, sources.md; supporting: `steps.txt` (the length steps), `fetchlog.tsv`, the per-brand `cells\` and `claims\` JSON, and `scripts\`; the downloads in `downloads\`.
9. Not touched: the repository (two docs read, nothing written), pnpm, git, and the `brands-b` folder.
10. Cost (the orchestrator's record): 229,647 tokens as the harness counts, 105 tool calls, about 17 minutes.
