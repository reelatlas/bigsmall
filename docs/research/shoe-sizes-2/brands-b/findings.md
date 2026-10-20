# Brands' charts, worker B: findings (shoe sizes 2, wave 1)

Worker report, 2026-10-20. Delivered as the worker's reply and saved here by the orchestrator. Brands: Clarks, Dr. Martens, Birkenstock, Timberland, UGG, Crocs, Hoka, On, Brooks, Salomon.

Six of the ten brands publish a size chart I could read on their own sites: Clarks, Dr. Martens, Birkenstock, Crocs, Salomon and Brooks. Five of those give a foot length for every size. The other four (UGG, HOKA, Timberland, On) could not be reached: each refused both the script and the harness fetcher, and nothing was bypassed. I transcribed 3,623 cells from 44 charts and recorded 69 claims.

Brooks counts with a caveat: its main site refused everything, and the chart I read is on Brooks Running Australia's own help centre. Dr. Martens was read only through the fetcher, so the rows with a blank cell need a checker (details under Dr. Martens below).

## Per brand

**Clarks: reached, read by script, 850 cells.**

- **IE and GB** (`clarks.com/en-ie/fitguide`, `/en-gb/fitguide`). The two pages are the same, all six tables cell for cell. Three charts:
  - Womens: UK 3 to 9.
  - Mens: UK 5 to 14, with no 11½, 12½ or 13½.
  - Kids & Babies: UK 2 to 13½, then 1 to 10.
  - Adult columns: "Clarks UK Size | Clarks EU Size | Standard EU Size | Foot Length (Millimetres) (MMs)". Kids have no Standard EU column.
  - Lengths are whole mm, 4 to 5 mm per half size, for example UK 7 = 254. The length is the foot's, measured with a ruler from heel to the longest toe.
  - Disclaimer: "\*These measurements do not correlate to measuring with a Clarks foot gauge."
  - Widths are given, noted only.
- **US** (`/en-us/fit-guide/womens`, `/mens`). Women's US 5 to 12 against UK and "Foot Length (IN)" to one decimal. Men's US 7 to 15, same columns. No EU column.
  - Advice: "Consider sizing up slightly to accommodate potential swelling".
  - No US kids chart: `/kids` returned 404.
- **Australia** (`clarks.com.au`, "© 2026 Clarks"). Five tabs:
  - Mens: UK, EU, US, plus a fourth column headed "UK" in the markup that repeats UK. So there is no length on the men's chart.
  - Womens: UK, EU, US and CM. Its cm equal the IE mm ÷ 10 on all 13 shared sizes.
  - Kids: three tabs in CM, with leading zeros as printed ("04.5", "010").
  - Disclaimer: "there is no true conversion available. Therefore this chart is an approximate only. CM Measurements are for Foot Length, not Shoe Length."

**Dr. Martens: reached through the fetcher only, 242 cells.** Scripts got a 403 bot check ("Help us verify real visitors").

- **US** (`/us/en/about/size-guide`). Columns: "Foot length | Foot width | UK | EU | US Men's | US Women's".
  - Lengths 22 to 34; no unit is printed (they read as cm). UK 3 to 15, plus 6.5 and 9.5.
  - The 6.5 and 9.5 rows each have one blank. The fetcher put 8.5 and 11.5 under US Men's, but the women's column pattern says they belong to US Women's. Which cell is blank is unconfirmed; a checker should look.
- **UK** (`/uk/en_gb/shoe-size-guide`). The fetcher returned the table as flattened text with only five headers (no US Men's).
- **DK/EU** (`/dk/en_eu/shoe-size-guide`). Columns "UK | EUR | US WOMEN | US MEN | JAPAN", UK 3 to 15 in whole sizes, no length. JAPAN 22 to 34 equals the US page's length column.
- Advice:
  - "most run true to size", but sizes "can differ between silhouettes".
  - "If you are in-between sizes… using an insole in the larger size".
  - "With wear, DM's often stretch in width but not in length."
- No sentence says the length is the foot's. The kids tab was not in the fetched content.

**Birkenstock: reached, read by script, 384 cells.**

- **US** (`/us/fit-guide/`). The table maps a pair of US half sizes to a "BIRKENSTOCK Size", for women, men and kids side by side. The page also gives a formula: "Women's: U.S. size + 31 = EU size; Men's: U.S. size + 33 = EU size".
- **Printable template PDF** (US). A table of EU 24 to 50 against US Children, Ladies and Men, UK and MM. It was read from the PDF's text layer.
  - EU, UK and MM come through in order. The US rows' alignment to EU is my inference, consistent with the web chart.
  - MM is the foot's length: "use that millimeter measurement to find your shoe size… every BIRKENSTOCK has its shoe size and millimeter size written in the footbed".
- **GB (UK labels) and EU (en_NL)**. Adults and Kids charts give a foot-length range per size ("Length From/To", mm). The two pages are the same row for row (UK 2,5 = EU 35 = 221 to 225).
  - The template's single MM equals the range's upper bound at every size.
  - Foot widths are also given, noted only.
- **Malaysia** advice: "If are unsure about your size, we recommend choosing the next size up".

**Crocs: reached, read by script, 1,027 cells.**

- The page draws its chart from five data files on crocs.com: `/size-chart/{default,gb,emea,japan,korea}.json`, chosen by region. crocs.co.uk and crocs.de serve byte-identical gb and emea files.
- **Adults.** Default, GB and EMEA have 16 rows, Japan and Korea 12. Columns "US Women / US Men / UK Women / UK Men / EU / Japan / Korea", varying by region.
  - Whole sizes only. On every row US W = US M + 2 and UK W = UK M + 1.
  - EU is printed as ranges ("36-37").
- **Kids.** 19 rows, C1 to C13 then J1 to J6.
- Every length column is labelled "Heel to Toe Length", and the page says "Measure the point from your heel to your longest toe."
- **Contradictions inside the brand's own data:**
  - default.json gives cm and mm that disagree by about 1 cm on every adult row (cm "20" beside mm "210").
  - Korea's mm and the default mm part from US M8/W10 upward (265 against 270mm).
  - Kids EU and Korea values differ between default and gb/emea from C6 up.
- "Do you carry wide sizes? No."

**Salomon: reached, read by script, 945 cells.**

- **US** (`/en-us/sizingchart`). The charts are in the page's embedded Next.js data: Unisex, Men's, Women's and Kid's Footwear.
  - Columns "FOOT LENGTH (CM)" and "FOOT LENGTH (INCH)" (a toggle on the page), then UK, EUR in thirds ("36 2/3"), US ("4M / 5 W", "7 M", "9(Kid)") and JP.
  - Adult lengths run 21,5 to 32,5 cm in half-cm steps: 5 mm per UK half size.
  - JP is always the foot length + 0.5 cm.
  - Instructions: wear "the same socks", heel against the wall, "take the longer distance". A wide foot: "add +0.5 to your order size".
- **Norway.** Men's chart identical to the US one.
- **Singapore** (`sg.salomon.com`). Identical on every shared row. Its men's chart extends over the unisex range.
- Ski and snowboard boot charts were skipped as out of scope.

**Brooks: partly reached, 175 cells.**

- **brooksrunning.com** (en_us, en_gb, en_fr): Access Denied (403) to the script and the fetcher.
- **Brooks Australia help centre** (`support.brooksrunning.com.au`). A "Size Conversion Chart": US Men, US Women, UK Men, UK Women, Europe Unisex, "Japan Men (cm)", "Japan Women (cm)". No foot length.
  - Irregularities: Japan Men is 23 at US M 4 and at 4.5. Japan Women jumps from 27 to 28.
  - Disclaimer: "any two-dimensional measuring tool, such as a ruler or Brannock device® can only approximate your true shoe size… manufacturers use different lasts".
  - Also: "Sizing on Brooksrunning.com.au is displayed in US sizes only."

**UGG and HOKA: could not reach.** Both are Deckers sites. Scripts got a 406 "Access Denied… BLOCKED_EDGE". The fetcher failed every time with "Parse Error: Header overflow".

**Timberland: could not reach.** 403 on timberland.com (en-us, en-dk) and timberland.co.uk. The help.timberland.com articles failed the TLS handshake for curl, for Python and for the fetcher.

**On: could not reach.** on.com serves a 4 KB page that is built in the browser (it carries a Cloudflare challenge script), with no chart in it. The fetcher returned empty content.

For all four, the search engine's summaries are recorded only as leads (evidence level "reasoned"). Retailer copies seen in search results (Scheels, RunRepeat, outsole.nl, looksize and others) are listed as leads in `sources.md`; none was opened.

## Coverage by system and region

|             | US M/W               | UK                   | EU             | JP            | KR  | Length                                        |
| ----------- | -------------------- | -------------------- | -------------- | ------------- | --- | --------------------------------------------- |
| Clarks      | US site only         | yes                  | IE/GB/AU       | –             | –   | mm (IE/GB), in (US), cm (AU women's and kids) |
| Dr. Martens | yes                  | yes                  | yes            | DK only       | –   | cm (US/UK)                                    |
| Birkenstock | US page and template | GB page and template | yes            | –             | –   | mm                                            |
| Crocs       | yes                  | yes                  | yes            | yes           | yes | in/cm/mm, five regions                        |
| Salomon     | yes                  | yes                  | yes, in thirds | yes           | –   | cm/in                                         |
| Brooks (AU) | yes                  | yes                  | yes            | JP cm columns | –   | none                                          |

Other things missing:

- No brand charts CN, MX, AU or BR as its own column.
- Mondopoint appears only in Salomon's ski and snowboard charts, which I skipped.
- Every reached brand has a kids chart except Dr. Martens (its kids table was not captured). Brooks Australia's chart has no kids sizes.

## What is only partly known

- **Dr. Martens:** where the blanks fall in the half-size rows; whether the UK page has a US Men's column; the kids chart.
- **Clarks:** no US kids chart; the US hub page has no table in its HTML.
- **Brooks:** only the Australian help centre was read; the US/EU charts were unread.
- **Birkenstock:** the US alignment in the template is inferred.
- **Crocs:** which of its cm or mm column a region actually displays is not confirmed.
- **Salomon:** its Malaysia kids page had no table in its HTML.
- **Not reached:** four brands entirely.

## Reliability signals

- **The brands' own caveats:**
  - Clarks: its mm do "not correlate" with its own foot gauge.
  - Clarks Australia: "approximate only".
  - Brooks: a 2D measure "can only approximate"; lasts differ.
  - Dr. Martens: sizes differ by silhouette.
- **Foot against last:** foot length is stated outright by Clarks (ruler; AU "Foot Length, not Shoe Length"), Birkenstock (the foot measured on the template), Crocs ("Heel-to-Toe length" of the foot) and Salomon (foot measured in socks). Dr. Martens only heads its column "Foot length".
- **Contradictions:**
  - Crocs' cm against its mm.
  - Crocs' regional kids EU and KR.
  - Clarks' own EU against its "Standard EU" (UK 10: 44½ against 45).
  - Clarks kids against adult length at the same UK size (236 against 237 mm).
  - Brooks' repeated JP values.
- **Steps per size differ by brand:**
  - Clarks: about 8.4 mm per UK size.
  - Salomon and Crocs: 10 mm.
  - Birkenstock: ranges of 5 or 10 mm.

## Full foot-length chart against offsets alone

- **Full foot-length charts on the brand's own site:** Clarks, Birkenstock, Crocs and Salomon, plus Dr. Martens (US/UK pages, via the fetcher).
- **Cross-system offsets only:** Brooks Australia (and Dr. Martens' EU page, Clarks Australia men's, Birkenstock's US web table).

## Summary

1. A brand's own chart can be sourced for 6 of 10 brands; 5 give foot length per size.
2. Strongest findings:
   - Crocs' published data gives two lengths per size, about 1 cm apart (measured, from its JSON).
   - Salomon's JP = foot length + 0.5 cm on every adult row (measured).
   - Clarks prints its own EU beside a "Standard EU" and disowns its gauge (asserted by the page).
3. Could not reach: UGG, HOKA, Timberland, On, and Brooks' main site.
4. Read through the fetcher only: Dr. Martens; where the blanks fall in its two half-size rows needs a checker.
5. Tool calls: about 108 of 150.
6. Files are in the worker's folder (`shoe-sizes-2/brands-b/`): charts.csv, claims.csv, sources.md, downloads\ (the saved HTML, Crocs' JSON, Birkenstock's PDF), scripts\ (fetch.sh, tables.py, text.py, pdftext.py, salomon_tables.py, one b\_<brand>.py per brand, merge.py, write_sources.py, fetchlog.tsv).
7. Cost (the orchestrator's record): 236,915 tokens as the harness counts, 109 tool calls, about 16 minutes.
