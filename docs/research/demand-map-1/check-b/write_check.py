import csv, json, os, sys
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")
BASE = os.path.dirname(os.path.abspath(__file__))
D = "2026-10-19"
G_SPAM = "https://developers.google.com/search/docs/essentials/spam-policies"
G_HELP = "https://developers.google.com/search/docs/fundamentals/creating-helpful-content"
SUG = "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=<query url-encoded> (raw: downloads/suggest_NN.json)"
SEO = "https://www.seodata.dev/keyword/"
PROXY = ("Suggest proxy (suggestqueries.google.com, client=firefox, hl=en, gl=us; plain browser UA, no cookies, one request per query 1.2 s apart), "
         "not the results page; an absent '= ' line is weak evidence about the results page. ")
sug = json.load(open(os.path.join(BASE, "suggest_results.json"), encoding="utf-8"))
bing = json.load(open(os.path.join(BASE, "bing_results.json"), encoding="utf-8"))


def sw_for(row, mode):
    rs = [r for r in sug if r["row"] == row]
    if mode == "list":
        return " | ".join(r["query"] + " -> [" + "; ".join(r["suggestions"][:5]) + "]" for r in rs)
    if mode == "calc":
        return " | ".join(r["query"] + " -> " + (r["calc"][0] if r["calc"] else "(no '= ' line)") for r in rs)
    if mode == "b32":
        ok = all(r["calc"] == ["= 180.34 centimeters"] for r in rs)
        return ("all %d forms -> = 180.34 centimeters (%s): " % (len(rs), "every one" if ok else "NOT every one")) + "; ".join(r["query"] for r in rs)


b16 = "; ".join("%d %s" % (i + 1, b["url"].replace("https://", "").replace("www.", "")) for i, b in enumerate(bing[:5]))

ROWS = [
 dict(id="B01", verdict="confirmed",
  sw="""Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users. This abusive practice is typically focused on creating large amounts of unoriginal content that provides little to no value to users, no matter how it's created.""",
  url=G_SPAM,
  notes="""Words match exactly. Footer 'Last updated 2026-08-28 UTC.' (before date_read; no change). 'However they are made' renders 'no matter how it's created'; the definition also turns on 'not helping users' and 'little to no value to users'."""),
 dict(id="B02", verdict="confirmed",
  sw="""Doorway abuse is when sites or pages are created to rank for specific, similar search queries. They lead users to intermediate pages that aren't as useful as the final destination.""",
  url=G_SPAM, notes="""Exact. Last updated 2026-08-28 UTC."""),
 dict(id="B03", verdict="confirmed",
  sw="""Examples of doorway abuse include: ... Having multiple domain names or pages targeted at specific regions or cities that funnel users to one page; Generating pages to funnel visitors into the actual usable or relevant portion of a site""",
  url=G_SPAM, notes="""Exact; one of four listed examples of doorway abuse. 'Elsewhere' is the claim's gloss; Google says 'into the actual usable or relevant portion of a site'."""),
 dict(id="B04", verdict="confirmed",
  sw="""Creating substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy""",
  url=G_SPAM, notes="""Exact, and listed as an example of doorway abuse (stronger than 'a sign'). Google's contrast is pages that resemble search results versus a clearly defined, browseable hierarchy; 'a hierarchy is the remedy' is the worker's inference (labelled as such), not Google's words; 'near-duplicate' paraphrases 'substantially similar'."""),
 dict(id="B05", verdict="confirmed",
  sw="""Answering yes to some or all of the questions below is a warning sign that you should reevaluate how you're creating content: ... Are you writing to a particular word count because you've heard or read that Google has a preferred word count? (No, we don't.)""",
  url=G_HELP, notes="""Exact. Footer 'Last updated 2026-10-05 UTC.' (before date_read; no change)."""),
 dict(id="B06", verdict="confirmed",
  sw="""Answering yes to some or all of the questions below is a warning sign that you should reevaluate how you're creating content: ... Are you using extensive automation to produce content on many topics?""",
  url=G_HELP, notes="""Exact; 'warning sign' is Google's own lead-in to the search-engine-first list. Last updated 2026-10-05 UTC."""),
 dict(id="B07", verdict="confirmed",
  sw="""Does the content present information in a way that makes you want to trust it, such as clear sourcing, evidence of the expertise involved, background about the author or the site that publishes it, such as through links to an author page or a site's About page?""",
  url=G_HELP, notes="""Exact (the CSV stops before 'such as through links to an author page or a site's About page?'). A self-assessment question, not a statement about ranking. Last updated 2026-10-05 UTC."""),
 dict(id="B08", verdict="confirmed",
  sw="""This new policy builds on our previous spam policy about automatically-generated content, ensuring that we can take action on scaled content abuse as needed, no matter whether content is produced through automation, human efforts, or some combination of human and automated processes.""",
  url="https://developers.google.com/search/blog/2024/03/core-update-spam-policies",
  notes="""Post 'What web creators should know about our March 2024 core update and new spam policies', dated 'Tuesday, March 5, 2024'. Sentence exact."""),
 dict(id="B09", verdict="confirmed",
  sw="""I love fire, but also programmatic SEO is often a fancy banner for spam. - John Mueller (@JohnMu) July 25, 2023 | To be fair, programmatic SEO is not always spam but hey: Forever the optimist. - (@JohnMu) July 25, 2023""",
  url="https://www.seroundtable.com/programmatic-seo-banner-for-spam-google-35766.html ; https://publish.twitter.com/oembed?url=https://twitter.com/JohnMu/status/1683881977529634816",
  notes="""Both quotes are on the seroundtable page (Barry Schwartz, Jul 26, 2023; datePublished 2023-07-26). Original of the first post read through X's public oEmbed endpoint (no login): same words, July 25, 2023, status 1683881977529634816. The second post (status 1683887059440742411, 'not always spam') gave 404 on oEmbed, so its original could not be reached; it rests on the seroundtable embed. The claim leaves out the 'not always spam' qualifier."""),
 dict(id="B10", verdict="confirmed",
  sw="""Programmatic SEO like this often leads to a site that's either spam, borderline spam, or low quality. It's easy to spin something up with many pages, it's hard to provide real value to users. Our systems have possibly lost faith in your site providing good value to users based on the old pages.""",
  url="https://www.seroundtable.com/google-lose-faith-42032.html ; https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread (post at://did:plc:4cv34f5o756rx377sm3mhrhm/app.bsky.feed.post/3muwiaqve6k22)",
  notes="""Seroundtable, Sep 7, 2026 8:37 am (datePublished 2026-09-07T08:37-04:00). Original read on Bluesky's public API: @johnmu.com, createdAt 2026-09-07T12:13:56Z, same words. Context: a reply to the owner of a site 'like a BuiltWith for new sites'; Mueller: 'it sounds like a programmatic SEO play, where you iterate through a large list of domain names, technologies, and attributes - finding all possible combinations.' 'Combinatorial page sets' is faithful to that."""),
 dict(id="B11", verdict="confirmed",
  sw="""It's easy for a programmer to do, even easier with code generators now. You end up with tons of pages that have "some" value, but the overall picture is not that exciting. Expanding it with even more generated data ("what does php mean?" etc) doesn't make it more useful for users.""",
  url="https://www.seroundtable.com/google-lose-faith-42032.html ; Bluesky post at://did:plc:4cv34f5o756rx377sm3mhrhm/app.bsky.feed.post/3muwiaqvca222",
  notes="""Same words on seroundtable and in the original Bluesky post (createdAt 2026-09-07T12:13:56Z). 'Adds nothing' slightly strengthens 'doesn't make it more useful for users'; 'generated definitions' is a fair reading of the example."""),
 dict(id="B12", verdict="corrected",
  sw="""May 8 Deprecating the FAQ rich result feature Why: This feature will no longer appear in Google Search starting May 7, 2026. ... June 15 ... Removing documentation for the FAQ rich result feature ... Why: The FAQ rich result feature is no longer shown in Google Search results""",
  corr="""The cited URL no longer holds the FAQPage documentation: .../structured-data/faqpage redirects to https://developers.google.com/search/updates#removing-faq-rich-result. The sentence is in the Search Central documentation changelog, entry May 8 (2026), and a June 15 (2026) entry says the FAQ documentation was removed because 'The FAQ rich result feature is no longer shown in Google Search results'. The substance holds (no FAQ rich results from 2026-05-07); cite the changelog, not the FAQPage page.""",
  url="https://developers.google.com/search/docs/appearance/structured-data/faqpage -> https://developers.google.com/search/updates#removing-faq-rich-result",
  notes="""Changelog footer 'Last updated 2026-10-16 UTC.' The entry is dated May 8 but names May 7, 2026 as the start."""),
 dict(id="B13", verdict="confirmed",
  sw="""March 2024 spam update | 5 Mar 2024 | 14 days, 21 hours; March 2024 core update | 5 Mar 2024 | 45 days; May 2026 core update | 21 May 2026 | 11 days, 21 hours""",
  url="https://developers.google.com/search/updates/ranking -> https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history",
  notes="""The cited URL redirects to the Google Search Status Dashboard, 'History for Ranking'. All three entries are there. Later 2026 entries: September 2026 spam update (24 Sep), August 2026 spam update (18 Aug), June 2026 spam update (24 Jun); before May: March 2026 core (27 Mar) and spam (24 Mar) updates. The May 2026 core update is the latest core update listed."""),
 dict(id="B14", verdict="confirmed",
  sw="""Ahrefs' free tools are consistently among our highest-traffic pages, holding steady even as AI answers eat into clicks elsewhere. Searchers want to do something, not read about it, and a calculator is a lot harder for Google to summarize out of existence than a paragraph is.""",
  url="https://ahrefs.com/blog/programmatic-seo/",
  notes="""'Programmatic SEO, Explained for Beginners' (Louise Linehan), 'Updated: September 2, 2026' (dateModified 2026-09-02; first published 2023-10-31). The words are 'our own Director of Content Marketing, Ryan Law', quoted in the article, about Ahrefs' own free tools: one company's observation of its own pages, no figures given, not a study."""),
 dict(id="B15", verdict="confirmed",
  sw="""Allows Task Completion: 83% of winners let users complete the task they searched for, versus 50% of losers. Sites don't need to sell anything to score here.""",
  url="https://www.searchenginejournal.com/what-400-sites-reveal-about-organic-traffic-gains/571632/",
  notes="""SEJ, Matt G. Southern, April 10, 2026 (published = modified). What was measured: 'An analysis of more than 400 websites by Zyppy founder Cyrus Shepard identifies five characteristics associated with whether a site gained or lost estimated organic traffic over the past 12 months', sites revisited from Lily Ray's December core update analysis; 'Traffic estimates come from third-party tools, not verified Search Console data'; association 'measured by Spearman correlation'. SEJ's report of the study; Zyppy's own write-up not read."""),
 dict(id="B16", verdict="confirmed",
  sw=b16,
  url="https://www.bing.com/search?q=5%2710+in+cm&setlang=en&cc=US",
  notes="""Re-run once (setlang=en, cc=US, plain browser UA, no cookies): a normal results page, no challenge, 10 organic results. The top five are the worker's five, in the same order, each a page for 5 ft 10 in alone. Of the top 10, 8 are specific to 5 ft 10 in (6 dedicated pages, plus miniwebtool ?feet=5&inches=10 and convertunits.com/from/5'10/to/cm), 2 are general converters (thecalculatorsite height converter, unitconverters.net feet-to-cm). Bing stands in for Google here; the 'second index' in the evidence column was not re-checked."""),
 dict(id="B17", verdict="confirmed",
  sw="""A breadcrumb trail on a page indicates the page's position in the site hierarchy, and it may help users understand and explore a site effectively.""",
  url="https://developers.google.com/search/docs/appearance/structured-data/breadcrumb",
  notes="""Exact. 'How To Add Breadcrumb (BreadcrumbList) Markup', footer 'Last updated 2026-09-08 UTC.', as the claim says; still documented on 2026-10-19."""),
 dict(id="B18", verdict="confirmed",
  sw="""Keyword · US · updated 2026-05-30 kg to lbs Monthly searches 1,830,000 CPC $0.65 Competition 0 Also searched kg a lbs 1,830,000 kg for pounds 1,830,000 kg to lb 1,830,000 kilograms to pounds 1,830,000 Monthly average for US, from the Google Ads API: the same numbers you'd see in Google Ads.""",
  url=SEO + "kg-to-lbs",
  notes="""The CSV's 'Monthly search volume for "kg to lbs" is 1,830,000' is the page's meta description; the visible label is 'Monthly searches'. Its variants carry the identical figure, which looks like Google Ads grouping close variants: summing variants would double count. The Google Ads origin is the site's own statement. One request, HTTP 200."""),
 dict(id="B19", verdict="confirmed",
  sw="""seodata.dev: 'Keyword · US · updated 2026-05-30 cm to inches Monthly searches 1,500,000 CPC $0.55'. Semrush (unitconverters.net overview): 'United States Sep 2026 Keyword Intent Position Volume CPC(USD) Traffic % cm to inches I 1 1,500,000 0.13 3.06%'""",
  url=SEO + "cm-to-inches ; https://www.semrush.com/website/unitconverters.net/overview/",
  notes="""Both tools show 1,500,000. Semrush's public page loaded without an account or JavaScript, 'Last updated: October 14, 2026', United States, Sep 2026. seodata's related list puts centimetre to inch, cm and inches, cms to inch at 1,830,000, above the head term: the buckets are coarse and vary by wording."""),
 dict(id="B20", verdict="confirmed",
  sw="""Keyword · US · updated 2026-06-29 inches to cm Monthly searches 673,000 CPC $0.00 Competition 0 Also searched inch cm 1,500,000 inch a cm 673,000 inch in cm 673,000 inch to centimeter 673,000""",
  url=SEO + "inches-to-cm",
  notes="""673,000 against Semrush's 246,000 (B21) is 2.74x, as the check says. 'inch cm' shows 1,500,000 on the same page."""),
 dict(id="B21", verdict="confirmed",
  sw="""United States Sep 2026 Keyword Intent Position Volume CPC(USD) Traffic % cm to inches I 1 1,500,000 0.13 3.06% unit conversion I 1 823,000 ... inches to cm I 1 246,000 0.43 0.8%""",
  url="https://www.semrush.com/website/unitconverters.net/overview/",
  notes="""Semrush's public overview, no account needed, 'Last updated: October 14, 2026'. The CSV row leaves out the CPC (0.43)."""),
 dict(id="B22", verdict="confirmed",
  sw="""Keyword · US · updated 2026-10-12 5 10 in cm Monthly searches 90,500 CPC $0.00 Competition 0 Also searched 5 10 in inches to cm 90,500 5'10 in cm 90,500 5 10 feet in cm 18,100 5 10 feet to cm 18,100 ... [related] 5'10 in cm 90,500 $0.00 20/20""",
  url=SEO + "5-10-in-cm",
  notes="""The H1 is '5 10 in cm' (meta: 'Monthly search volume for "5 10 in cm" is 90,500'); '5'10 in cm' appears only in the related lists, at 90,500 with overlap 20/20. Same figure, but the page does not say whether they are one merged keyword or two keywords in the same bucket. Other wordings sit lower: 5 foot 10 in cm, 5 ft 10 in cm, 5'10 feet in cm at 18,100; 5 10 en cm 12,100."""),
 dict(id="B23", verdict="confirmed",
  sw="""Keyword · US · updated 2026-08-20 cups to grams Monthly searches 40,500 CPC $2.31 Competition 0 Also searched grams in a cup 165,000 a cup in grams 110,000 how many grams are in a cup 90,500 how many grams in a cup 90,500""",
  url=SEO + "cups-to-grams",
  notes="""'grams in a cup' 165,000 is in the cups-to-grams page's related lists (CPC $0.84, overlap 20/20); it has no page of its own here. The page's own keyword, cups to grams, is 40,500."""),
 dict(id="B24", verdict="confirmed",
  sw="""Keyword · US · updated 2026-09-15 nm to ft lbs Monthly searches 49,500 CPC $0.31 Competition 0 Also searched foot pounds to nm 49,500 ft lb to nm 49,500 ft-lb to nm 49,500 newton m to ft lbs 49,500""",
  url=SEO + "nm-to-ft-lbs",
  notes="""All ten related keywords, both directions, show 49,500: one grouped bucket, most likely; don't add the directions together."""),
 dict(id="B25", verdict="confirmed",
  sw="""Keyword · US · updated 2026-09-15 psi to bar Monthly searches 18,100 CPC $0.00 Competition 0 Also searched bar psi 40,500 bar to psi 40,500 psi a bar 18,100 psi into bar 18,100 ... [related] bar to psi 40,500 $0.00 17/20""",
  url=SEO + "psi-to-bar",
  notes="""'bar to psi' 40,500 is in the related lists (overlap 17/20); the page's own 'psi to bar' is 18,100. No page for 'bar to psi' itself was read."""),
 dict(id="B26", verdict="confirmed",
  sw="""Keyword · US · updated 2026-07-31 shoe size converter Monthly searches 40,500 CPC $0.42 Competition 0.16 Monthly average for US, from the Google Ads API: the same numbers you'd see in Google Ads.""",
  url=SEO + "shoe-size-converter", notes="""No related list on this page."""),
 dict(id="B27", verdict="confirmed",
  sw="""United States Sep 2026 Keyword Intent Position Volume CPC(USD) Traffic % metric conversion I 2 823,000 0.56 24.07% ... lbs to kg I 12 368,000 0.01 0.4%""",
  url="https://www.semrush.com/website/metric-conversions.org/overview/",
  notes="""Semrush's public overview, no account needed, 'Last updated: October 14, 2026'. 12 is metric-conversions.org's position for the term. One tool's estimate; no seodata lookup was budgeted for lbs to kg."""),
 dict(id="B28", verdict="confirmed", sw=sw_for("B28", "list"), url=SUG,
  notes=PROXY + """The calculator line reproduces exactly. But it is a misparse, not a torque conversion: 304,800,000 is the number of nanometres in a foot (0.3048 m / 1e-9 m), labelled 'pounds'; 1 N·m is about 0.7376 ft·lbf. So Google's calculator mishandles 'nm to ft lbs', which argues against assuming a working converter box for this query."""),
 dict(id="B29", verdict="confirmed", sw=sw_for("B29", "list"), url=SUG,
  notes=PROXY + """'5 10 in cm': 8 suggestions, no '= ' line. "5'10 in cm": '= 177.8 centimeters'. Both as the check expects."""),
 dict(id="B30", verdict="confirmed", sw=sw_for("B30", "list"), url=SUG,
  notes=PROXY + """Exact: the decimal plus the pair in parentheses, in 64ths."""),
 dict(id="B31", verdict="confirmed", sw=sw_for("B31", "list"), url=SUG,
  notes=PROXY + """Neither '1 cup flour in grams' nor 'cups to grams' carries a '= ' line. Absence is weak evidence: it says nothing sure about the results page."""),
 dict(id="B32", verdict="confirmed", sw=sw_for("B32", "b32"), url=SUG,
  notes=PROXY + """All fourteen forms re-run, the straight and curly primes, the doubled apostrophe, the words, and 'five foot eleven' included; each returned exactly '= 180.34 centimeters' (71 in x 2.54)."""),
 dict(id="B33", verdict="confirmed", sw=sw_for("B33", "calc"), url=SUG,
  notes=PROXY + """5.11 x 30.48 = 155.7528, so the decimal-feet reading is confirmed."""),
 dict(id="B34", verdict="confirmed", sw=sw_for("B34", "calc"), url=SUG,
  notes=PROXY + """'5-11' -> '= -6' (subtraction); '5-11 in cm' and '5 11 in cm' have no '= ' line (their suggestions are '5 11 in cm height', '5 11 in cm to inches' ...)."""),
 dict(id="B35", verdict="confirmed", sw=sw_for("B35", "calc"), url=SUG,
  notes=PROXY + """All three reproduce. The rule ('in' after a number is inch, after a unit the connective) is the worker's reading of these responses, and it fits them."""),
 dict(id="B36", verdict="confirmed", sw=sw_for("B36", "calc"), url=SUG,
  notes=PROXY + """All three reproduce, the 'and a half' form and the trailing zeros of '182.24500' included (70.375, 71.75, 71.5 in x 2.54)."""),
 dict(id="B37", verdict="confirmed",
  sw="""Length, speed | inch, foot | in, ft | Do not use &prime; (′), &Prime; (″), apostrophe ('), or quote ("). Exception: in music, eight-foot pitch notation describes organ stops and wind instrument lengths in feet. A prime may be used with an explanation on first use""",
  url="https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Dates_and_numbers",
  notes="""In the 'Specific units' table (MOS:FOOT, MOS:INCH). The page shows the entity names ('&prime; (′), &Prime; (″)') where the CSV has '′ (′), ″ (″)': rendering only. The claim leaves out the music exception. Page last edited 15 October 2026, before date_read; the words match."""),
 dict(id="B38", verdict="confirmed",
  sw="""Acceptable: a wall 1 ft 1 in thick / a wall 1 foot 1 inch thick / a man 6 feet 2 inches tall / a 6-foot 2-inch man / a 6 ft 2 in man || Unacceptable: 1 ft , 1 in (no comma) / 1 foot , 1 inch / a man 6 foot 2 tall / a 6-foot 2 man""",
  url="https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Dates_and_numbers",
  notes="""Columns parsed from the table's HTML. '1 ft , 1 in (no comma)' and '1 foot , 1 inch' are Unacceptable, so the no-comma rule holds. Also Unacceptable: dropping the second unit ('a man 6 foot 2 tall', 'a 6-foot 2 man'), so the inch must be written."""),
 dict(id="B39", verdict="corrected",
  sw="""Mixed units are traditionally used with the imperial and US customary systems ... [a man 6 feet 2 inches tall; 1 US fl pt 8 oz] ... and in expressing time durations ... [1:30:07; 1 h 30 min 7 s] ... but are not used with metric units. [Acceptable: 1.33 m, 133 cm | Unacceptable: 1 m 33 cm]""",
  corr="""Not 'only' imperial and US customary: the same guideline adds '... and in expressing time durations ...' (acceptable 1:30:07, 1:30, 1 h 30 min 7 s; unacceptable 1:30′07″, 1:30′, 1 hr 30 min 7 sec, 1 h 30 m 7 s). 'Never metric' holds: '... but are not used with metric units', '1 m 33 cm' Unacceptable, '1.33 m' and '133 cm' acceptable.""",
  url="https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Dates_and_numbers",
  notes="""This bears on paces and durations: the MOS accepts colon forms and h/min/s for times and rejects primes for minutes and seconds."""),
 dict(id="B40", verdict="confirmed",
  sw="""9.3. Internal and terminal punctuation in symbols representing units of measure are to be omitted ... Where omission of terminal punctuation causes confusion; e.g., the symbol in (inch) mistaken for the preposition in, the symbol should be spelled out.""",
  url="https://www.govinfo.gov/content/pkg/GPO-STYLEMANUAL-2000/html/GPO-STYLEMANUAL-2000-13.htm ; https://www.govinfo.gov/content/pkg/GPO-STYLEMANUAL-2016/pdf/GPO-STYLEMANUAL-2016.pdf",
  notes="""2000 edition, Chapter 9 'Abbreviations and letter symbols', rule 9.3. The 2016 edition ('2016; official U.S. Government edition'; the newest edition I know of, no later one searched for) has the same rule 9.3 with one word added: 'Where the omission of terminal punctuation causes confusion; e.g., the symbol in (inch) mistaken for the preposition in, the symbol should be spelled out.' Cite 2016."""),
 dict(id="B41", verdict="confirmed",
  sw="""Flat hierarchies tend to work well if you have distinct, recognizable categories, because people don't have to click through as many levels. ... All other things being equal, deep hierarchies are more difficult to use.""",
  url="https://www.nngroup.com/articles/flat-vs-deep-hierarchy/",
  notes="""Kathryn Whitenton, NN/g, November 10, 2013 (dateModified 2024-08-02). The article also says 'there's no single right answer, and going too far to either extreme will backfire', and 'Categories that are specific and do not overlap are the easiest to understand.'"""),
 dict(id="B42", verdict="corrected",
  sw="""Abstract: '... increased depth did harm search performance on the web, a medium condition of depth and breadth outperformed the broadest shallow web structure overall.' Body: 'there was no significant difference between the 16x32 and the 32x16 hierarchies for reaction time.'""",
  corr="""The words are the abstract's own, but the paper's results don't show the medium structure beating the broadest one. With 19 subjects and three structures (8x8x8; 16x32; 32x16), the three-level 8x8x8 was significantly slower than both two-level structures (ANOVA F(2,36)=6.34, Bonferroni post-hoc). 16x32 (mean 36 s) against 32x16 (46 s) was not significant, 8x8x8 averaging 58 s, and 32x16 was ranked most preferred more often (Table 2). Read: depth hurt; medium against broadest is an untested lead in speed, and preference went to the broadest.""",
  url="https://www.microsoft.com/en-us/research/publication/web-page-design-implications-memory-structure-scent-information-retrieval/ ; https://www.microsoft.com/en-us/research/wp-content/uploads/2016/12/chi98_webdesign.pdf",
  notes="""Read the paper itself (the PDF linked from the Microsoft Research page; text via pdftotext, scan-quality) and the page's abstract. Larson & Czerwinski, CHI 98, April 1998."""),
 dict(id="B43", verdict="confirmed",
  sw="""The comparisons showed that static was significantly faster than adaptive for all three orders. ... Although the adaptable menu was preferred by the majority of subjects (55%), the adaptive menu did have support (30%). By contrast, only 15% of subjects wanted the static menu""",
  url="https://www.cs.ubc.ca/labs/edapt/papers/findlater2004.pdf",
  notes="""Read the paper itself (Findlater & McGrenere, 'A Comparison of Static, Adaptive, and Adaptable Menus', CHI 2004); 'a controlled lab study with 27 subjects'. Left out of the claim: the static menu was the optimal split menu, built from item frequencies 'known in advance of the task, as was done in our experiment', and 15% wanted it 'even though it was the optimal split menu'. Adaptable was not significantly different from static unless it came first, when it was significantly slower."""),
 dict(id="B44", verdict="corrected",
  sw="""The main grouping guidelines are: ... Keep a medium level of granularity. Don't offer huge groups with numerous options that require extensive time to scan. ... Use concise, yet descriptive labels for each group. || [characteristics] Everything visible at once — no scrolling""",
  corr="""Two of the three are grouping guidelines, and the labels are 'concise, yet descriptive', not 'distinct'. 'Everything visible at once — no scrolling' is not a guideline: it is in the article's list of the characteristics that define a mega menu ('mega menus have the following characteristics: ...').""",
  url="https://www.nngroup.com/articles/mega-menus-work-well/",
  notes="""Jakob Nielsen and Angie Li, NN/g, March 26, 2017 (dateModified 2023-06-27). The granularity guideline goes both ways: 'don't make the individual groups so small that the mega menu has an overabundance of groups'. 'Distinct' appears only in the screenshot captions."""),
]

ids = ["B%02d" % i for i in range(1, 45)]
assert [r["id"] for r in ROWS] == ids, [r["id"] for r in ROWS]
path = os.path.join(BASE, "check.csv")
with open(path, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["id", "verdict", "source_words", "correction", "url_read", "date_read", "notes"])
    for r in ROWS:
        sw = r["sw"]
        if len(sw) > 300:
            print("TRUNCATED", r["id"], len(sw))
            sw = sw[:297] + "..."
        w.writerow([r["id"], r["verdict"], sw, r.get("corr", ""), r["url"], D, r["notes"]])
print(Counter(r["verdict"] for r in ROWS))
for r in ROWS:
    if r["id"] in ("B16", "B28", "B29", "B30", "B31", "B32", "B34", "B35", "B36"):
        print(r["id"], "::", r["sw"][:300])
print("wrote", path)
