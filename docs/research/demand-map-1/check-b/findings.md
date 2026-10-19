# Checker B: search, pages, and practice (wave 2 of the demand map)

The report as the checker returned it (Opus 5.5 at max effort, 2026-10-19, 37 tool calls, 235,144 tokens as the harness counts), saved by the orchestrator. The verdicts row by row are in `check.csv`; the requests are logged in `fetch_log.jsonl`; the rows checked are B01 to B44 of `../wave2-claims.csv`.

I checked all 44 rows: 40 are confirmed, 4 are corrected (B12, B39, B42, B44), and none are wrong, unreachable or unchecked. I opened every cited source myself and read none of the workers' notes.

## 1. Every row

| id  | verdict   | what the source says                                                                                                                                                                                                      |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B01 | confirmed | Spam policies, word for word: "Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users… no matter how it's created." Last updated 2026-08-28. |
| B02 | confirmed | "Doorway abuse is when sites or pages are created to rank for specific, similar search queries. They lead users to intermediate pages that aren't as useful as the final destination."                                    |
| B03 | confirmed | One of four listed doorway examples: "Generating pages to funnel visitors into the actual usable or relevant portion of a site".                                                                                          |
| B04 | confirmed | Listed doorway example: "Creating substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy". "The remedy" is the worker's inference, and the claim says so.             |
| B05 | confirmed | "Are you writing to a particular word count because you've heard or read that Google has a preferred word count? (No, we don't.)" Last updated 2026-10-05.                                                                |
| B06 | confirmed | "Are you using extensive automation to produce content on many topics?" It sits under Google's own lead-in: "Answering yes… is a warning sign".                                                                           |
| B07 | confirmed | "…such as clear sourcing, evidence of the expertise involved, background about the author or the site that publishes it…"                                                                                                 |
| B08 | confirmed | Post dated "Tuesday, March 5, 2024"; the sentence matches word for word.                                                                                                                                                  |
| B09 | confirmed | Both quotes are on seroundtable (Jul 26, 2023). I read the original of "often a fancy banner for spam" through X's public embed service (oEmbed, no login): July 25, 2023, same words.                                    |
| B10 | confirmed | Seroundtable, Sep 7, 2026. I also read the original through Bluesky's public API: @johnmu.com, 2026-09-07T12:13:56Z, same words.                                                                                          |
| B11 | confirmed | The same words appear on seroundtable and in the Bluesky original (post 3muwiaqvca222).                                                                                                                                   |
| B12 | corrected | The FAQPage documentation URL now redirects to Google's documentation changelog. The sentence is in the changelog entry of May 8 (2026), and a June 15 entry says the FAQ documentation was removed.                      |
| B13 | confirmed | The URL redirects to the Search Status Dashboard's ranking history, which lists: March 2024 core (5 Mar 2024, 45 days), March 2024 spam (5 Mar 2024, 14 d 21 h), May 2026 core (21 May 2026, 11 d 21 h).                  |
| B14 | confirmed | Ahrefs article, "Updated: September 2, 2026" (first published 2023-10-31). The quote is from Ahrefs' Director of Content Marketing, Ryan Law.                                                                             |
| B15 | confirmed | SEJ, April 10, 2026: "83% of winners let users complete the task they searched for, versus 50% of losers."                                                                                                                |
| B16 | confirmed | Bing re-run (en, US): the same five pages in the same order, each a page for 5 ft 10 in alone.                                                                                                                            |
| B17 | confirmed | The breadcrumb sentence matches word for word; last updated 2026-09-08.                                                                                                                                                   |
| B18 | confirmed | 1,830,000, updated 2026-05-30; "Monthly average for US, from the Google Ads API".                                                                                                                                         |
| B19 | confirmed | seodata 1,500,000 (updated 2026-05-30). Semrush's public unitconverters.net overview also shows 1,500,000 (US, Sep 2026).                                                                                                 |
| B20 | confirmed | 673,000, updated 2026-06-29. Against Semrush's 246,000 that is 2.74×.                                                                                                                                                     |
| B21 | confirmed | Semrush: "inches to cm I 1 246,000 0.43 0.8%"; page updated Oct 14, 2026.                                                                                                                                                 |
| B22 | confirmed | The H1 is "5 10 in cm": 90,500, updated 2026-10-12. "5'10 in cm" shows 90,500 (overlap 20/20) in the related list.                                                                                                        |
| B23 | confirmed | "grams in a cup 165,000" is in the cups-to-grams page's related list. "cups to grams" itself is 40,500.                                                                                                                   |
| B24 | confirmed | 49,500, updated 2026-09-15; "foot pounds to nm" and "ft lb to nm" are both 49,500.                                                                                                                                        |
| B25 | confirmed | "bar to psi 40,500" is in psi-to-bar's related list (overlap 17/20). "psi to bar" itself is 18,100.                                                                                                                       |
| B26 | confirmed | 40,500, updated 2026-07-31.                                                                                                                                                                                               |
| B27 | confirmed | Semrush, metric-conversions.org: "lbs to kg I 12 368,000 0.01 0.4%".                                                                                                                                                      |
| B28 | confirmed | Suggest response: [= 304800000 pounds; nm to ft lbs; …conversion; …calculator; …torque].                                                                                                                                  |
| B29 | confirmed | "5 10 in cm" has no "= " line; "5'10 in cm" gives "= 177.8 centimeters".                                                                                                                                                  |
| B30 | confirmed | "= 5.90551181 feet (5 feet 10 55/64 inches)".                                                                                                                                                                             |
| B31 | confirmed | Neither "1 cup flour in grams" nor "cups to grams" has a "= " line.                                                                                                                                                       |
| B32 | confirmed | All 14 forms give "= 180.34 centimeters".                                                                                                                                                                                 |
| B33 | confirmed | "= 155.7528 centimeters".                                                                                                                                                                                                 |
| B34 | confirmed | "5-11" gives "= -6"; "5-11 in cm" and "5 11 in cm" have no "= " line.                                                                                                                                                     |
| B35 | confirmed | "= 0.916666667 feet (11 inches)" and "= 71 inches"; "5 in cm" has none.                                                                                                                                                   |
| B36 | confirmed | "= 178.7525", "= 182.24500" and "= 181.61 centimeters".                                                                                                                                                                   |
| B37 | confirmed | "Do not use &prime; (′), &Prime; (″), apostrophe ('), or quote (")." The page shows the entity names; the CSV's rendering differs only in that.                                                                           |
| B38 | confirmed | Unacceptable column: "1 ft , 1 in (no comma)", "1 foot , 1 inch", "a man 6 foot 2 tall", "a 6-foot 2 man".                                                                                                                |
| B39 | corrected | Mixed units are also used "in expressing time durations". "Never metric" holds.                                                                                                                                           |
| B40 | confirmed | GPO 2000, rule 9.3, word for word. The 2016 edition's rule 9.3 is the same with one word added ("Where the omission…").                                                                                                   |
| B41 | confirmed | Both sentences are there (Whitenton, NN/g, Nov 10, 2013, modified 2024-08-02).                                                                                                                                            |
| B42 | corrected | The abstract says it, but the paper's results find no significant difference between the medium and the broadest structure.                                                                                               |
| B43 | confirmed | "static was significantly faster than adaptive for all three orders"; preferences 55% adaptable, 30% adaptive, 15% static; 27 subjects.                                                                                   |
| B44 | corrected | "Everything visible at once" is part of the definition of a mega menu, not a guideline. The labels are "concise, yet descriptive", not "distinct".                                                                        |

For B28 to B36 I re-ran each query once against Google's autocomplete endpoint (a second apart, no cookies). These are suggestions, not the results page, so a missing calculator line is weak evidence that the results page has no answer box.

## 2. The corrected rows

- **B12.** The changelog reads: "May 8 Deprecating the FAQ rich result feature. What: Added a deprecation notice to the FAQ rich result documentation. Why: This feature will no longer appear in Google Search starting May 7, 2026." A later entry, June 15, reads: "Removing documentation for the FAQ rich result feature… Why: The FAQ rich result feature is no longer shown in Google Search results, as announced in the changelog entry in May 2026."
  - **What differs:** the cited `…/structured-data/faqpage` now redirects to `https://developers.google.com/search/updates#removing-faq-rich-result`. The claim itself holds; cite the changelog instead.
- **B39.** The guideline row reads: "Mixed units are traditionally used with the imperial and US customary systems … and in expressing time durations … but are not used with metric units." For times, the table accepts 1:30:07, 1:30 and 1 h 30 min 7 s, and rejects 1:30′07″, 1:30′, 1 hr 30 min 7 sec and 1 h 30 m 7 s. For metric, it accepts 1.33 m and 133 cm and rejects 1 m 33 cm.
  - **What differs:** the claim's "only imperial and US customary" leaves out time durations.
- **B42.** I read the paper itself, through the PDF linked from the Microsoft Research page. It had 19 subjects and three structures: 8x8x8, 16x32 and 32x16.
  - Results: "fastest in the 16x32 hierarchy (Avg. RT=36 seconds…), second fastest in the 32x16 hierarchy (Avg. RT = 46 seconds…), and slowest in the 8x8x8 hierarchy (Avg. RT = 58 seconds…)."
  - Significance: "the 8x8x8 hierarchy was significantly slower than both of the broader, shallower hierarchies. However, there was no significant difference between the 16x32 and the 32x16 hierarchies for reaction time."
  - Preference: Table 2 shows "the 32x16 hierarchy was ranked as most preferred more often."
  - **What differs:** "a medium breadth and depth beat the broadest shallow structure" is the abstract's overstatement. Depth hurting is supported; medium beating broadest is not significant, and people preferred the broadest.
- **B44.** The article says "mega menus have the following characteristics: … Everything visible at once — no scrolling …". Its "main grouping guidelines" are: "Keep a medium level of granularity. Don't offer huge groups … Conversely, don't make the individual groups so small …" and "Use concise, yet descriptive labels for each group."
  - **What differs:** one of the three is part of the definition, not a guideline, and the label wording is "descriptive", not "distinct".

## 3. What I could not reach

No row was blocked. seodata.dev took 8 requests, all answered (HTTP 200), none rate-limited. Semrush's public pages loaded without an account or JavaScript. Bing returned a normal results page.

Gaps inside rows:

- **B09:** the original of Mueller's second post ("not always spam", status 1683887059440742411) gave 404 from X's embed service. I did not try x.com itself, so that quote rests on seroundtable's embed.
- **B16:** the "second index" mentioned in the evidence column was not re-checked.
- **B15:** I read SEJ's report, not Zyppy's own write-up.

## 4. What bears on how the claims are used

- **B28:** "= 304800000 pounds" is the number of nanometres in a foot labelled "pounds", not a torque conversion (1 N·m ≈ 0.7376 ft·lbf). Google's calculator mishandles this query, so a working answer box should not be assumed.
- **seodata volumes:**
  - Close variants carry identical figures (kg to lbs and four variants all at 1,830,000; all ten nm/ft-lb variants at 49,500). They look grouped, so summing them would double count.
  - The buckets are coarse: "centimetre to inch" (1,830,000) is above the head term "cm to inches", and "inch cm" is 1,500,000.
  - B22: the page does not say whether "5'10" and "5 10" are one merged keyword or two keywords with the same figure.
  - B23 and B25: those figures come from another keyword's related list, and "bar to psi" overlaps only 17/20.
- **B14:** this is one Ahrefs staff member describing Ahrefs' own tools, with no figures.
- **B15:** the study is a correlation (Spearman) on third-party traffic estimates over 400+ sites, not Search Console data.
- **B13:** later updates exist (spam updates in Jun, Aug and Sep 2026); May 2026 is still the latest core update.
- **B09 and B10:**
  - B09 leaves out Mueller's own "not always spam".
  - B10's context is a site generating "all possible combinations" of domains and technologies.
- **B16:** 8 of Bing's top 10 are specific to 5'10; the other 2 are general converters. Bing stands in for Google here.
- **B37 and B38:**
  - B37: the Manual of Style allows a prime for organ stops when explained.
  - B38: dropping the second unit ("a man 6 foot 2 tall") is listed as unacceptable.
- **B39:** the Manual of Style accepts colon and h/min/s forms for times and rejects primes for minutes and seconds. This matters for paces.
- **B40:** cite the 2016 edition. I did not search for anything newer.
- **B41:** the same article says "there's no single right answer, and going too far to either extreme will backfire."
- **B43:** the static menu was an optimal split menu built from item frequencies known in advance. The adaptable menu was not significantly slower than static unless it was presented first.

## Summary

1. 40 confirmed, 4 corrected (B12, B39, B42, B44), 0 wrong, 0 could not reach, 0 not checked.
2. Most consequential, B42 (measured, a controlled study): only "depth hurt" holds; the medium structure's lead over the broadest was not significant, and people preferred the broadest.
3. Second, B39 (asserted guidance): mixed units are also standard for time durations, which bears on paces.
4. Third, B44 (reasoned guidance): "everything visible at once" is part of the definition, not a guideline, and labels are "descriptive", not "distinct".
5. Also notable: B12's citation needs moving to the changelog (substance holds), and B28's Google answer is a misparse.
6. Requests: 8 to seodata (of the 12 allowed), 30 autocomplete queries, 1 Bing search, all answered.
7. Tool calls: 38 of the 150 budget.
8. Verdicts: `check.csv` in this folder.
9. The script that wrote it, and every request logged: `write_check.py` and `fetch_log.jsonl`.
10. Raw pages, PDFs and the 30 suggest responses: the checker's `downloads/` folder in the session's scratchpad (not kept).
