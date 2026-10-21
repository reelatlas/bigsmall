import csv, os, shutil

OUT = r"C:\Users\seanr\AppData\Local\Temp\claude\c--Users-seanr-Projects-bigsmall\72156ac3-788f-4b0f-9ea0-8a17c276e2ea\scratchpad\shoe-sizes-3\browser-2"
D = "2026-10-21"
SK = "https://www.skechers.com.au/size-guide"
SKH = "https://help.skechers.com.au/hc/en-us/articles/1500009182222-HOW-CAN-I-BE-SURE-I-M-SELECTING-THE-RIGHT-SIZE"
CL = "https://www.clarks.com/en-gb/fitguide"
CLC = "https://www.clarks.com/en-gb/size-calculator"
CLM = "https://www.clarks.com/en-gb/measureandfit-at-home"
NB = "https://support.newbalance.com/hc/en-us/articles/211241357-How-do-New-Balance-shoes-fit-"
RB = "https://www.reebok.co.uk/"

# ---------- page texts (as get_page_text returned them, chrome chrome stripped of the repeated nav only where identical) ----------
SK_HEAD = """Title: Size guide
URL: https://www.skechers.com.au/size-guide
Source element: <main>
---
SIZE & FIT GUIDE
MENWOMENKIDSINFANTS

Sizes can vary by style and by brand and getting the right size for you is important to us. Not 100% sure? Use our True Fit size tool below. True Fit gives you personal fit and size recommendations for all Skechers styles, eliminating the guesswork from online shopping.

FIND YOUR TRUE FIT

Simply answer a few questions to get started - No measuring required.

FIND YOUR TRUE FIT
FOOTWEAR
"""
SK_TAIL = """HOW TO MEASURE FOOTWEAR
When you find a sneaker that you like, simply select your preferred size metric (US/EU/UK) and choose your size. If you are unsure of which size is right for you, here are some helpful tips:
Already own a pair of kicks in the brand?
Generally sizing tends to be standard across brands, although sizes can vary slightly depending on the style, shape and material of the shoe.
The size of the pair that you already own is a good guide!
Use the product information and reviews
Certain brands or styles can run a size larger or smaller. We'll include this information on the product page when we have this information
available, and often, fellow shoppers will leave reviews with size information that you can use.
Use our fitting tool "Truefit"
Answer a few simple questions about sizing of some of your current kicks and Truefit will provide you a recomendation on which size you should choose. Trufit leverages data from global brands and returns information based on sizing to give you the most accurate recomendation possible.
Measure your feet in CM
Stand with your heel against a wall. With a ruler or measuring tape, measure from the wall to the tip of your biggest toe in centimetres. Use our CM size matrix on the product page of the brand you're interested in and add that item to cart.
HOW TO MEASURE APPAREL
[apparel measuring text: chest, bust, sleeve, waist, hip, inseam; omitted, not footwear]
NEED ANSWERS TO A QUESTION?
Delivery / Sizing / Track Order / Returns / Contact
"""

SK_MEN = [("6","38.5","5","24.3"),("6.5","39","5.5","24.5"),("7","39.5","6","25"),("7.5","40","6.5","25.5"),("8","41","7","26"),("8.5","41.5","7.5","26.5"),("9","42","8","27"),("9.5","42.5","8.5","27.5"),("10","43","9","28"),("10.5","44","9.5","28.5"),("11","45","10","29"),("11.5","45.5","10.5","29.5"),("12","46","11","30"),("12.5","47","11.5","30.5"),("13","47.5","12","31"),("13.5","48","12.5","31.2"),("14","48.5","13","31.5"),("15","50.5","14","32"),("16","51","15","32.5")]
SK_WOMEN = [("5","35","2","22"),("5.5","35.5","2.5","22.5"),("6","36","3","23"),("6.5","36.5","3.5","23.5"),("7","37","4","24"),("7.5","37.5","4.5","24.5"),("8","38","5","25"),("8.5","38.5","5.5","25.5"),("9","39","6","26"),("9.5","39.5","6.5","26.5"),("10","40","7","27"),("10.5","40.5","7.5","27.5"),("11","41","8","28"),("11.5","41.5","8.5","28.5"),("12","42","9","29"),("13","43","10","31.5")]
SK_KIDS = [("1","1","32","13","20"),("2","2","33.5","1","21"),("3","3","35","2","22"),("4","4","36","3","23"),("5","5","37","4","23.5"),("6","6","38","5","24"),("7","7","39","6","25"),("11","11","27.5","10","17"),("12","12","28.5","11","18"),("13","13","30","12","19")]
SK_INF = [("5","20.5","4","11"),("6","21.5","5","12"),("7","22.5","6","13"),("8","24","7","14"),("9","25.5","8","15"),("10","26.5","9","16")]

def tbl(cols, rows):
    return " ".join(cols) + "\n" + "\n".join(" ".join(r) for r in rows) + "\n"

sk_text = ""
for tab, cols, rows in [("MEN", ["US MEN’S","EU","UK","CM"], SK_MEN), ("WOMEN", ["US WOMEN’S","EU","UK","CM"], SK_WOMEN),
                        ("KIDS", ["US KIDS PRE-SCHOOL","US KIDS GRADE-SCHOOL","EU","UK","CM"], SK_KIDS), ("INFANTS", ["US KIDS INFANT","EU","UK","CM"], SK_INF)]:
    sk_text += f"===== tab {tab} (clicked) =====\n" + SK_HEAD + tbl(cols, rows) + SK_TAIL + "\n"

SKH_TEXT = """Title: HOW CAN I BE SURE I'M SELECTING THE RIGHT SIZE? – Skechers AU - Customer Experience Centre
URL: """ + SKH + """
Source element: <article>
---
HOW CAN I BE SURE I'M SELECTING THE RIGHT SIZE?

Our website has features to help you order with confidence.

SIZE SELECTION
For ease, you can switch between US, UK, EU sizing, and centimeters, using the "choose size" dropdown above the size selector. This feature allows you to shop in the format that is easiest for you.

While your cart, and checkout, will display styles in the format you chose to shop in, your order confirmation will revert to the manufacturers format. Rest assured our Team will pack your order as per your selection.

AUSTRALIAN SIZING
Is the same as US sizing.

TRUFIT
Is a tool that provides tailored sizing recommendations based on footwear already in your wardrobe.
To use this feature, click on the "What's my size?" logo near the size selector, to open the tool.

TRY THEM ON
Remembering that a properly fitting shoe should feel snug at the heel and midfoot, with wiggle room around the toes.

Was this article helpful?
Still Need Help? Get in touch CONTACT US
"""

CL_W = [("3","35½","36","221"),("3½","36","36½","225"),("4","37","37","229"),("4½","37½","37½","233"),("5","38","38","237"),("5½","39","38½","241"),("6","39½","39","246"),("6½","40","40","250"),("7","41","41","254"),("7½","41½","41½","258"),("8","42","42","263"),("8½","42½","42½","267"),("9","43","43","272")]
CL_M = [("5","38","38","237"),("5½","39","38½","241"),("6","39½","39","246"),("6½","40","40","250"),("7","41","41","254"),("7½","41½","41½","258"),("8","42","42","263"),("8½","42½","42½","267"),("9","43","43","272"),("9½","44","44","276"),("10","44½","45","280"),("10½","45","45½","285"),("11","46","46","289"),("12","47","47","298"),("13","48","48","306"),("14","49½","49","314")]
CL_K = [("2","17½","101"),("2½","18","105"),("3","18½","109"),("3½","19","113"),("4","20","117"),("4½","20½","122"),("5","21","126"),("5½","22","130"),("6","22½","134"),("6½","23","138"),("7","24","142"),("7½","25","147"),("8","25½","151"),("8½","26","155"),("9","27","159"),("9½","27½","164"),("10","28","168"),("10½","28½","172"),("11","29","176"),("11½","29½","181"),("12","30","185"),("12½","31","189"),("13","32","193"),("13½","32½","198"),("1","33","202"),("1½","33½","206"),("2","34","210"),("2½","35","214"),("3","35½","219"),("3½","36","223"),("4","37","227"),("4½","37½","231"),("5","38","236"),("5½","39","240"),("6","39½","244"),("6½","40","249"),("7","41","253"),("7½","41½","257"),("8","42","261"),("8½","42½","265"),("9","43","269"),("9½","44","274"),("10","44½","278")]

CL_TEXT = ("Title: Shoe Size Chart & Guide - Shoe Size Conversion | Clarks\nURL: " + CL + "\nSource element: <main>\n---\n"
"FINDING YOUR PERFECT FIT\nCHOOSE YOUR SIZE GUIDE\nWomens\nMens\nKids & Babies\n\n"
"We know correctly fitting shoes are important which is why we offer whole and half sizes and a range of widths for a perfect fit!\n\n"
"Wear your favourite footwear in the comfort and style that you would expect from Clarks by using our shoe fitting guide.\n\n"
"WOMENS CLARKS SHOE SIZES\n" + tbl(["Clarks UK Size","Clarks EU Size","Standard EU Size","Foot Length (Millimetres)"], CL_W) +
"(each row followed by a 'Shop size N' link)\nWOMENS CLARKS SHOE WIDTHS\nWidth Description\nD Standard Fit\nE Wide Fit\nEE Extra Wide Fit\n"
"MENS CLARKS SHOE SIZES\n" + tbl(["Clarks UK Size","Clarks EU Size","Standard EU Size","Foot Length (Millimetres)"], CL_M) +
"MENS CLARKS SHOE WIDTHS\nWidth Description\nG Standard Fit\nH Wide Fit\n"
"HOW TO MEASURE YOUR FEET\nRemember to measure both feet, making a note of the longest.\n\n"
"Place your foot on a flat surface with your heel against a straight edge.\n\n"
"Place a ruler beside your foot touching the straight edge your heel is also touching, then take the length in millimetres from the tip of your longest toe to your heel.\n\n"
"(Please be aware that your longest toe may not always be your big toe.)\n\n"
"*These measurements do not correlate to measuring with a Clarks foot gauge. For this method, follow these instructions.\n\n"
"KIDS & BABIES CLARKS SHOE SIZES\n" + tbl(["Clarks UK Size","Clarks EU Size","Foot Length (Millimetres)"], CL_K) +
"KIDS CLARKS SHOE WIDTHS\nWidth Description\nE Narrow Fit\nF Standard Fit\nG Wide Fit\nH Extra Wide Fit\n"
"KIDS FITTINGS\nBook an in-store fitting appointment.\nIn-Store Fitting\nMEASURE & FIT AT HOME\nWe're passionate about the importance of properly fitted shoes.\n"
"Find out how to ensure the best fit for your child from the comfort of your own home.\nMeasure & Fit at Home\nKIDS FAQS\nGot a question?\nView our Kids FAQs\n")

CLC_TEXT = """Title: Clarks Shoe Size Calculator - Toddlers & Kids | Clarks
URL: https://www.clarks.com/en-gb/size-calculator
Source element: <main>
---
SIZE CALCULATOR

Use the size calculator below in conjunction with your Clarks foot gauge to determine your child's Clarks shoe size.

SIZE CALCULATOR
Measurements
Enter Length

Enter Width

Calculate size

Use the size calculator above in conjunction with your Clarks Foot Gauge to determine your child's Clarks shoe size. If you found a slight difference between feet, enter the largest length and width measurements.

*Please note, foot gauge measurements are exclusive to this method of measuring and are not in standard millimetres (mm).

How to use a foot gauge

Toddler guide   (href https://clarks.a.bigcontent.io/v1/static/Toddler-gauge-step-by-step-guide-2025, not opened)
Junior guide    (href https://clarks.a.bigcontent.io/v1/static/Junior-gauge-step-by-step-guide-2025, not opened)
NEED MORE HELP?

Comfort starts with the perfect fit. Our in-store experts ensure every step feels right.

First Shoes, School Fittings, Quiet Times & Adults Fittings.

Book a fitting appointment

Updated on: 06 July 2026

[Validation hints shown under the fields after an out-of-range entry, read from a zoomed screenshot:]
Length: Enter a number between 97-281
Width: Enter a number between 67-227
[Out-of-table result text:] No size was found
"""

CLM_TEXT = """Title: Measure Kids' Shoe Size At Home | Clarks UK
URL: https://www.clarks.com/en-gb/measureandfit-at-home
Source element: <main>
---
MEASURE AT HOME
FOOT GAUGES

For the perfect fit, we recommend visiting our in-store experts. But if you can't make it in, try our hassle-free at-home guides to help growing feet get the support they need.

Already got your measurements?

Size Calculator here
How to use a Foot Gauge
1. Buy a foot gauge
2. Measure your child's feet
3. Calculate their size

Buy a junior gauge

Buy a toddler gauge

SIZE CALCULATOR

Input your measurements into the calculator below to get their shoe size.

Measurements
Enter Length

Enter Width

Calculate size
NEED MORE HELP?

If you need a helping hand or just aren't sure, book an appointment with an expert shoe fitter at your local store.

Book a fitting appointment
Store locator

Updated on: 06 July 2026
"""

NB_TEXT = "Could not reach. " + NB + "\nAttempt 1 (in a batch): 'Navigation to this domain is not allowed'.\nAttempt 2 (after a 10 s wait): same.\nAttempt 3 (standalone navigate): navigation reported done, but get_page_text and screenshot both failed: 'Frame with ID 0 is showing error page'.\nAttempt 4 (end of session): navigate done, get_page_text: 'Frame with ID 0 is showing error page'.\nNo text obtained.\n"
RB_TEXT = "Could not reach. " + RB + "\nAttempt 1: navigate done; find: 'Permission denied for reading pages on this domain'.\nAttempt 2 (after 10 s): same.\nAttempt 3: screenshot: 'Frame with ID 0 is showing error page'.\nAttempt 4 (later): navigate done; screenshot: 'Permission denied for this action on this domain'; after a further 10 s wait, same.\nNo text obtained; the size guide was never reached.\n"

os.makedirs(os.path.join(OUT, "pages"), exist_ok=True)
os.makedirs(os.path.join(OUT, "screenshots"), exist_ok=True)
for name, txt in [("skechers-au-size-guide", sk_text), ("skechers-au-help-right-size", SKH_TEXT), ("clarks-uk-fitguide", CL_TEXT),
                  ("clarks-uk-size-calculator", CLC_TEXT), ("clarks-uk-measureandfit-at-home", CLM_TEXT),
                  ("newbalance-support-fit", NB_TEXT), ("reebok-uk", RB_TEXT)]:
    with open(os.path.join(OUT, "pages", name + ".txt"), "w", encoding="utf-8") as f:
        f.write(txt)

# ---------- screenshots ----------
SRC = r"C:\Users\seanr\AppData\Local\Temp\claude-chrome-screenshots-1RlLPq"
shots = [("screenshot-1792620983405-12.jpg", "skechers-au-size-guide-men.jpg"),
         ("screenshot-1792620983405-13.jpg", "skechers-au-size-guide-women.jpg"),
         ("screenshot-1792621003174-14.jpg", "skechers-au-size-guide-kids.jpg"),
         ("screenshot-1792621003174-15.jpg", "skechers-au-size-guide-infants.jpg"),
         ("screenshot-1792621290988-16.jpg", "clarks-uk-size-calculator-result.jpg"),
         ("screenshot-1792621362217-17.jpg", "clarks-uk-fitguide-kids-1.jpg"),
         ("screenshot-1792621362217-18.jpg", "clarks-uk-fitguide-kids-2.jpg"),
         ("screenshot-1792621362218-19.jpg", "clarks-uk-fitguide-kids-3.jpg")]
copied = []
for s, d in shots:
    p = os.path.join(SRC, s)
    if os.path.exists(p):
        shutil.copyfile(p, os.path.join(OUT, "screenshots", d)); copied.append(d)
    else:
        print("missing", p)

# ---------- charts.csv ----------
rows = []
def add(brand, site, chart, cols, data, url):
    for i, r in enumerate(data, 1):
        for c, v in zip(cols, r):
            rows.append([brand, site, chart, c, i, v, url, D, "chrome"])
add("Skechers", "skechers.com.au", "Size & Fit Guide, MEN, Footwear", ["US MEN’S","EU","UK","CM"], SK_MEN, SK)
add("Skechers", "skechers.com.au", "Size & Fit Guide, WOMEN, Footwear", ["US WOMEN’S","EU","UK","CM"], SK_WOMEN, SK)
add("Skechers", "skechers.com.au", "Size & Fit Guide, KIDS, Footwear", ["US KIDS PRE-SCHOOL","US KIDS GRADE-SCHOOL","EU","UK","CM"], SK_KIDS, SK)
add("Skechers", "skechers.com.au", "Size & Fit Guide, INFANTS, Footwear", ["US KIDS INFANT","EU","UK","CM"], SK_INF, SK)
add("Clarks", "clarks.com/en-gb", "WOMENS CLARKS SHOE SIZES", ["Clarks UK Size","Clarks EU Size","Standard EU Size","Foot Length (Millimetres)"], CL_W, CL)
add("Clarks", "clarks.com/en-gb", "MENS CLARKS SHOE SIZES", ["Clarks UK Size","Clarks EU Size","Standard EU Size","Foot Length (Millimetres)"], CL_M, CL)
add("Clarks", "clarks.com/en-gb", "KIDS & BABIES CLARKS SHOE SIZES", ["Clarks UK Size","Clarks EU Size","Foot Length (Millimetres)"], CL_K, CL)
with open(os.path.join(OUT, "charts.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["brand","site","chart","column","row","value","url","date_read","tool"]); w.writerows(rows)

# ---------- claims.csv ----------
C = [
 ("Skechers","how-to-measure","Measure the foot in cm from the wall at the heel to the tip of the biggest toe, then use the CM size matrix on the product page","Stand with your heel against a wall. With a ruler or measuring tape, measure from the wall to the tip of your biggest toe in centimetres. Use our CM size matrix on the product page of the brand you're interested in and add that item to cart.",SK),
 ("Skechers","sizes-vary","Sizes vary by style and brand","Sizes can vary by style and by brand and getting the right size for you is important to us.",SK),
 ("Skechers","sizes-vary","Sizing tends to be standard across brands but varies slightly by style, shape and material","Generally sizing tends to be standard across brands, although sizes can vary slightly depending on the style, shape and material of the shoe.",SK),
 ("Skechers","how-to-choose","An owned pair's size is a good guide","The size of the pair that you already own is a good guide!",SK),
 ("Skechers","how-to-choose","Some styles run large or small; noted on product pages when known","Certain brands or styles can run a size larger or smaller. We'll include this information on the product page when we have this information available",SK),
 ("Skechers","how-to-choose","True Fit recommends from owned footwear, no measuring","Simply answer a few questions to get started - No measuring required.",SK),
 ("Skechers","chart-scope","The guide's charts carry a CM column on all four tabs (Men, Women, Kids, Infants); the page does not say whether CM is the foot's length or the shoe's","US MEN’S EU UK CM",SK),
 ("Skechers","scale-equivalence","Australian sizing is the same as US sizing","AUSTRALIAN SIZING Is the same as US sizing.",SKH),
 ("Skechers","size-selector","The size selector switches between US, UK, EU and centimetres","For ease, you can switch between US, UK, EU sizing, and centimeters, using the \"choose size\" dropdown above the size selector.",SKH),
 ("Skechers","fit","A properly fitting shoe is snug at heel and midfoot with toe room","Remembering that a properly fitting shoe should feel snug at the heel and midfoot, with wiggle room around the toes.",SKH),
 ("Clarks","foot-length","The size charts' length column is headed Foot Length (Millimetres)","Foot Length (Millimetres)",CL),
 ("Clarks","how-to-measure","Measure both feet, heel against a straight edge, length in mm toe tip to heel","Place a ruler beside your foot touching the straight edge your heel is also touching, then take the length in millimetres from the tip of your longest toe to your heel.",CL),
 ("Clarks","how-to-measure","Note the longer foot","Remember to measure both feet, making a note of the longest.",CL),
 ("Clarks","gauge-differs","The chart's ruler measurements do not correlate with the Clarks foot gauge","*These measurements do not correlate to measuring with a Clarks foot gauge.",CL),
 ("Clarks","scale","Clarks prints both a Clarks EU size and a Standard EU size for adults","Clarks UK Size Clarks EU Size Standard EU Size Foot Length (Millimetres)",CL),
 ("Clarks","widths","Width letters: women D standard, E wide, EE extra wide; men G standard, H wide; kids E narrow, F standard, G wide, H extra wide","D Standard Fit / E Wide Fit / EE Extra Wide Fit; G Standard Fit / H Wide Fit; E Narrow Fit / F Standard Fit / G Wide Fit / H Extra Wide Fit",CL),
 ("Clarks","gauge-units","Foot gauge readings are their own unit, not millimetres","*Please note, foot gauge measurements are exclusive to this method of measuring and are not in standard millimetres (mm).",CLC),
 ("Clarks","how-to-choose","Enter the larger foot's length and width into the calculator","If you found a slight difference between feet, enter the largest length and width measurements.",CLC),
 ("Clarks","calculator-range","The calculator takes length 97-281 and width 67-227 (gauge units)","Enter a number between 97-281 / Enter a number between 67-227",CLC),
 ("Clarks","how-to-choose","In-store fitting recommended; at-home gauge as the alternative","For the perfect fit, we recommend visiting our in-store experts. But if you can't make it in, try our hassle-free at-home guides",CLM),
]
with open(os.path.join(OUT, "claims.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["id","brand","kind","claim","exact_words","url","date_read","tool"])
    for i, c in enumerate(C, 1):
        w.writerow([f"b2-{i:02d}", c[0], c[1], c[2], c[3], c[4], D, "chrome"])

# ---------- finders.csv ----------
F = [("length 15 (width empty)", "No size was found; Length hint 'Enter a number between 97-281', Width hint 'Enter a number between 67-227'"),
     ("length 150, width 120", "Results: 8.5 G"),
     ("length 170, width 120", "Results: 10 F"),
     ("length 190, width 120", "Results: 12.5 D"),
     ("length 210, width 120", "No size was found"),
     ("length 230, width 120", "No size was found"),
     ("length 210, width 160", "Results: 2 G"),
     ("length 230, width 160", "Results: 4.5 D"),
     ("length 170, width 160", "No size was found"),
     ("length 150, width 100", "Results: 8.5 D")]
with open(os.path.join(OUT, "finders.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["brand","finder_url","input","output","exact_words","date_read"])
    for inp, out in F:
        w.writerow(["Clarks", CLC, inp + " (Clarks foot gauge units, which the page says are not mm; typed into the Length and Width boxes, Calculate size clicked)", out.split(";")[0], out, D])

print(len(rows), "chart cells;", len(C), "claims;", len(F), "finder rows;", len(copied), "screenshots")
