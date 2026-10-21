import csv, os, re, sys
D = sys.argv[1]
W = os.path.join(D, "work")
DATE = "2026-10-21"

def split_bundle(path):
    txt = open(path, encoding="utf-8").read()
    parts = re.split(r"^=== FILE: (.+?) ===\n", txt, flags=re.M)
    for i in range(1, len(parts), 2):
        out = os.path.join(D, parts[i].strip())
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "w", encoding="utf-8").write(parts[i + 1])

split_bundle(os.path.join(W, "bundle1.txt"))
split_bundle(os.path.join(W, "bundle2.txt"))

# ---- charts ----
rows = []
def row_chart(brand, site, chart, url, lines):
    # lines: "label|c1|c2|..." ; label is the chart's own row label (its "column" here), cells indexed from 1
    for ln in lines:
        p = ln.split("|")
        for i, v in enumerate(p[1:], 1):
            rows.append([brand, site, chart, p[0], i, v, url, DATE, "chrome"])
def col_chart(brand, site, chart, url, header, body):
    h = header.split("|")
    for r, ln in enumerate(body, 1):
        p = ln.split("|")
        for c, v in zip(h, p):
            rows.append([brand, site, chart, c, r, v, url, DATE, "chrome"])

ON_M = "https://www.on.com/en-us/products/cloudmonster-61/mens"
row_chart("On", "on.com/en-us", "Size Guide - Mens Shoes (Cloudmonster product page, Size chart)", ON_M, [
 "US|7|7.5|8|8.5|9|9.5|10|10.5|11|11.5|12|12.5|13|13.5|14|15",
 "BR|37|38|39|N/A|40|41|N/A|42|N/A|43|44|45|46|47|N/A|47",
 "MX|25|25.5|26|26.5|27|27.5|28|28.5|29|29.5|30|30.5|31|31.5|32|33",
 "EU|40|40.5|41|42|42.5|43|44|44.5|45|46|47|47.5|48|48.5|49|50",
 "JP|25|25.5|26|26.5|27|27.5|28|28.5|29|29.5|30|30.5|31|31.5|32|33",
 "UK|6.5|7|7.5|8|8.5|9|9.5|10|10.5|11|11.5|12|12.5|13|13.5|14.5"])
ON_W = "https://www.on.com/en-us/products/cloud-6-3wf1006/womens/barberry-ox-shoes-3WF10065455"
row_chart("On", "on.com/en-us", "Size Guide - Womens Shoes (Cloud 6 product page, Size chart)", ON_W, [
 "US|5|5.5|6|6.5|7|7.5|8|8.5|9|9.5|10|10.5|11|12",
 "BR|33|34|N/A|35|36|37|N/A|38|39|N/A|40|41|42|43",
 "MX|22|22.5|23|23.5|24|24.5|25|25.5|26|26.5|27|27.5|28|29",
 "EU|36|36.5|37|37.5|38|38.5|39|40|40.5|41|42|42.5|43|44",
 "JP|22|22.5|23|23.5|24|24.5|25|25.5|26|26.5|27|27.5|28|29",
 "UK|3|3.5|4|4.5|5|5.5|6|6.5|7|7.5|8|8.5|9|10"])

HK = "https://www.hoka.com/en/us/sizing-information.html"
row_chart("HOKA", "hoka.com/en/us", "Sizing Information: Women, Footwear, Regular", HK, [
 'Foot Length (CM)|22.0|22.4|22.9|23.3|23.7|24.1|24.5|25.0|25.4|25.8|26.2|26.7|27.1|27.5|27.9',
 'Foot Length (IN)|8" 21/32|8" 13/16|9" 1/64|9" 11/64|9" 21/64|9" 31/64|9" 41/64|9" 27/32|10"|10" 5/32|10" 5/16|10" 33/64|10" 43/64|10" 53/64|10" 63/64',
 'Regular Width Length (MM)|87|88|89|90|91|92|93|94|95|96|97|98|99|100|101',
 'US|5|5.5|6|6.5|7|7.5|8|8.5|9|9.5|10|10.5|11|11.5|12',
 'UK|3.5|4|4.5|5|5.5|6|6.5|7|7.5|8|8.5|9|9.5|10|10.5',
 'Europe|36|36 2/3|37 1/3|38|38 2/3|39 1/3|40|40 2/3|41 1/3|42|42 2/3|43 1/3|44|44 2/3|45 1/3',
 'Japan (CM)|22|22.5|23|23.5|24|24.5|25|25.5|26|26.5|27|27.5|28|28.5|29',
 'Mexico (CM)|22|22.5|23|23.5|24|24.5|25|25.5|26|26.5|27|27.5|28|28.5|29',
 'China|220|225|230|235|240|245|250|255|260|265|270|275|280|285|290'])
row_chart("HOKA", "hoka.com/en/us", "Sizing Information: Men, Footwear, Regular", HK, [
 'Foot Length (CM)|23.0|23.4|23.9|24.3|24.7|25.1|25.6|26.0|26.4|26.8|27.2|27.7|28.1|28.5|28.9|29.4|29.8|30.2|30.6|31.1|31.5',
 'Foot Length (IN)|9" 1/16|9" 7/32|9" 13/32|9" 9/16|9" 23/32|9" 7/8|10" 5/64|10" 15/64|10" 25/64|10" 35/64|10" 45/64|10" 29/32|11" 1/16|11" 7/32|11" 3/8|11" 37/64|11" 47/64|11" 57/64|12" 3/64|12" 1/4|12" 13/32',
 'Regular Width Length (MM)|92|93|94|95|96|97|98|99|100|101|102|103|104|105|106|107|108|109|111|112|113',
 'US|5|5.5|6|6.5|7|7.5|8|8.5|9|9.5|10|10.5|11|11.5|12|12.5|13|13.5|14|14.5|15',
 'UK|4.5|5|5.5|6|6.5|7|7.5|8|8.5|9|9.5|10|10.5|11|11.5|12|12.5|13|13.5|14|14.5',
 'Europe|37 1/3|38|38 2/3|39 1/3|40|40 2/3|41 1/3|42|42 2/3|43 1/3|44|44 2/3|45 1/3|46|46 2/3|47 1/3|48|48 2/3|49 1/3|50|50 2/3',
 'Japan (CM)|23|23.5|24|24.5|25|25.5|26|26.5|27|27.5|28|28.5|29|29.5|30|30.5|31|31.5|32|32.5|33',
 'Mexico (CM)|23|23.5|24|24.5|25|25.5|26|26.5|27|27.5|28|28.5|29|29.5|30|30.5|31|31.5|32|32.5|33',
 'China|230|235|240|245|250|255|260|265|270|275|280|285|290|295|300|305|310|315|320|325|330'])
row_chart("HOKA", "hoka.com/en/us", "Sizing Information: All Gender, Footwear, Regular (as printed, foot length and width rows 21 cells, size rows 22)", HK, [
 'Foot Length (CM)|23.0|23.4|23.9|24.3|24.7|25.1|25.6|26.0|26.4|26.8|27.2|27.7|28.1|28.5|28.9|29.4|29.8|30.2|30.6|31.1|31.5',
 'Regular Width Length (MM)|92|93|94|95|96|97|98|99|100|101|102|103|104|105|106|107|108|109|111|112|113',
 'US|M4/W5|M4½/W5½|M5/W6|M5½/W6½|M6/W7|M6½/W7½|M7/W8|M7½/W88½|M8/W9|M8½/W9½|M9/W10|M9½/W10½|M10/W11|M10½/W11½|M11/W12|M11½/W12½|M12/W13|M12½/W13½|M13/W14|M13½/W14½|M14/W15|M15/W16',
 'UK|3½|4|4½|5|5½|6|6½|7|7½|8|8½|9|9½|10|10½|11|11½|12|12½|13|13½|14½',
 'Europe|36|36⅔|37⅓|38|38⅔|39⅓|40|40⅔|41⅓|42|42⅔|43⅓|44|44⅔|45⅓|46|46⅔|47⅓|48|48⅔|49⅓|50⅔',
 'Japan (CM)|22|22½|23|23½|24|24½|25|25½|26|26½|27|27½|28|28½|29|29½|30|30½|31|31½|32|33',
 'Mexico (CM)|22|22½|23|23½|24|24½|25|25½|26|26½|27|27½|28|28½|29|29½|30|30½|31|31½|32|33',
 'China|220|225|230|235|240|245|250|255|260|265|270|275|280|285|290|295|300|305|310|315|320|330'])
col_chart("HOKA", "hoka.com/en/us", "Sizing Information: Kids, Footwear", HK, "Size|Foot Length (in)|Foot Length (cm)", [
 "3.5 Youth|8.66''|22", "4 Youth|8.86''|22.5", "4.5 Youth|9.06''|23", "5 Youth|9.25''|23.5",
 "5.5 Youth|9.45''|24", "6 Youth|9.65''|24.5", "6.5 Youth|9.84''|25", "7 Youth|10.04''|25.5"])

UG = "https://www.ugg.com/sizing-information.html"
H7 = "Heel to Toe (IN)|UK|EU|Japan (CM)|Mexico (CM)|China (MM)"
def sp(s): return s.replace(" ", "|")
col_chart("UGG", "ugg.com", "Size Information: Footwear, Women's", UG, "US Women's|" + H7, [sp(x) for x in
 "5 8.7 3 36 22 22 220;5.5 8.9 3.5 36.5 22.5 22.5 225;6 9.1 4 37 23 23 230;6.5 9.3 4.5 37.5 23.5 23.5 235;7 9.5 5 38 24 24 240;7.5 9.7 5.5 38.5 24.5 24.5 245;8 9.8 6 39 25 25 250;8.5 10.0 6.5 39.5 25.5 25.5 255;9 10.2 7 40 26 26 260;9.5 10.4 7.5 40.5 26.5 26.5 265;10 10.6 8 41 27 27 270;10.5 10.8 8.5 41.5 27.5 27.5 275;11 11.0 9 42 28 28 280;11.5 11.2 9.5 42.5 28.5 28.5 285;12 11.4 10 43 29 29 290;13 11.8 11 44 30 30 300;14 12.2 12 45 31 31 310;15 12.6 13 48 32 32 320".split(";")])
col_chart("UGG", "ugg.com", "Size Information: Footwear, Men's", UG, "US Men's|" + H7, [sp(x) for x in
 "3 8.3 2 36 21 21 210;4 8.7 3 37 22 22 220;4.5 8.9 3.5 37.5 22.5 22.5 225;5 9.1 4 38 23 23 230;5.5 9.3 4.5 38.5 23.5 23.5 235;6 9.4 5 39 24 24 240;6.5 9.6 5.5 39.5 24.5 24.5 245;7 9.8 6 40 25 25 250;7.5 10.0 6.5 40.5 25.5 25.5 255;8 10.2 7 41 26 26 260;8.5 10.4 7.5 41.5 26.5 26.5 265;9 10.6 8 42 27 27 270;9.5 10.8 8.5 42.5 27.5 27.5 275;10 11.0 9 43 28 28 280;10.5 11.2 9.5 43.5 28.5 28.5 285;11 11.4 10 44 29 29 290;11.5 11.6 10.5 44.5 29.5 29.5 295;12 11.8 11 45 30 30 300;13 12.2 12 46 31 31 310;14 12.6 13 48.5 32 32 320;15 13.0 14 49.5 33 33 330;16 13.4 15 50.5 34 34 340;17 13.8 16 51 35 35 350;18 14.2 17 52 36 36 360".split(";")])
col_chart("UGG", "ugg.com", "Size Information: Footwear, All-Gender", UG, "US Women's|US Men's|Heel to Toe (IN)|UK|EU|Japan (CM)|Mexico (CM)|China", [sp(x) for x in
 "4 3 8.3 2 34.5 21 21 210;5 4 8.7 3 36 22 22 220;5.5 4.5 8.9 3.5 36.5 22.5 22.5 225;6 5 9.1 4 37 23 23 230;6.5 5.5 9.3 4.5 37.5 23.5 23.5 235;7 6 9.5 5 38 24 24 240;7.5 6.5 9.7 5.5 38.5 24.5 24.5 245;8 7 9.8 6 39.5 25 25 250;8.5 7.5 10.0 6.5 40 25.5 25.5 255;9 8 10.2 7 40.5 26 26 260;9.5 8.5 10.4 7.5 41 26.5 26.5 265;10 9 10.6 8 42 27 27 270;10.5 9.5 10.8 8.5 42.5 27.5 27.5 275;11 10 11.0 9 43 28 28 280;11.5 10.5 11.2 9.5 43.5 28.5 28.5 285;12 11 11.4 10 44 29 29 290;12.5 11.5 11.6 10.5 44.5 29.5 29.5 295;13 12 11.8 11 45.5 30 30 300;14 13 12.2 12 47 31 31 310;15 14 12.4 13 48.5 31.5 31.5 315;16 15 12.6 14 50 32 32 320;17 16 12.8 15 50.5 32.5 32.5 325;18 17 13.0 16 51 33 33 330;19 18 13.2 17 52 33.5 33.5 335".split(";")])
col_chart("UGG", "ugg.com", "Size Information: Footwear, Big Kids (4-10 Years)", UG, "US Children's|Heel to Toe (IN)|Heel to Toe (MM)|UK|EU|Japan (CM)|Mexico (CM)|China (MM)", [sp(x) for x in
 "8T 5.9 150.5 7 25 15 15 150;9T 6.3 158.9 8 26 16 16 160;10T 6.6 167.4 9 27.5 17 17 170;11T 6.9 175.8 10 28.5 17.5 17.5 175;12T 7.3 184.3 11 30 18.5 18.5 185;13K 7.6 192.8 12 31 19.5 19.5 195;1K 7.9 201.2 13 32.5 20 20 200;2K 8.3 209.7 1 33.5 21 21 210;3K 8.6 218.1 2 35 22 22 220;4K 8.9 226.6 3 36 22.5 22.5 225;5K 9.3 235.1 4 37 23.5 23.5 235;6K 9.6 243.5 5 38 24.5 24.5 245".split(";")])

CR = "https://www.crocs.com/size-chart"
row_chart("Crocs", "crocs.com", "Size Chart: Adult", CR, [
 "Heel to Toe Length (Inches)|7 5/8″|8″|8 3/8″|8 5/8″|9″|9 3/8″|9 5/8″|10″|10 3/8″|10 5/8″|11″|11 3/8″|11 5/8″|12″|12 3/8″|12 5/8″",
 "Heel to Toe Length (Centimeters)|20cm|21cm|22cm|23cm|24cm|25cm|26cm|27cm|28cm|29cm|30cm|31cm|32cm|33cm|34cm|35cm",
 "US Women|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19",
 "US Men|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17",
 "UK Women|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17",
 "UK Men|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16",
 "EU|33-34|34-35|36-37|37-38|38-39|39-40|41-42|42-43|43-44|45-46|46-47|48-49|49-50|50-51|51-52|52-53",
 "Japan|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35",
 "Korea|210mm|220mm|230mm|240mm|250mm|260mm|270mm|280mm|290mm|300mm|310mm|320mm|330mm|340mm|350mm|360mm"])
row_chart("Crocs", "crocs.com", "Size Chart: Kids' (Typical Age header: Little Kids (Under 1) | (1-2 Years Old) | (2-5 Years Old) | Big Kids (5+ Years Old))", CR, [
 "Heel to Toe Length (Inches)|3 1/4″|3 7/8″|4 1/8″|4 1/2″|4 7/8″|5 1/8″|5 1/2″|5 7/8″|6 1/8″|6 1/2″|6 7/8″|7 1/8″|7 1/2″|7 7/8″|8 1/8″|8 1/2″|8 7/8″|9 1/8″|9 1/2″",
 "Heel to Toe Length (Centimeters)|9cm|9.8cm|10.7cm|11.5cm|12.3cm|13.2cm|14cm|14.9cm|15.7cm|16.6cm|17.4cm|18.3cm|19.1cm|20cm|20.8cm|21.7cm|22.5cm|23.3cm|24.2cm",
 "US|C1|C2|C3|C4|C5|C6|C7|C8|C9|C10|C11|C12|C13|J1|J2|J3|J4|J5|J6",
 "UK|-|2|3|4|5|6|7|8|9|10|11|12|13|1|2|3|4|5|6",
 "EU|-|17-18|18-19|19-20|20-21|21-22|22-23|23-24|24-25|25-26|26-27|27-28|28-29|29-30|30-31|31-32|32-33|33-34|35-36",
 "Japan|-|-|-|12|13|14|15|15.5|16.5|17.5|18|18.5|19|19.5|20|21|22|23|24",
 "Korea|-|-|-|115|120|130|140|150|155|165|175|180|190|200|210|220|230|240|250"])

AM = "https://www.asics.com/my/en-my/shoe-size-guide"
row_chart("Asics", "asics.com/my/en-my", "Shoe Size Guide: MEN'S/UNISEX SHOE SIZES", AM, [
 "US|4|4H|5|5H|6|6H|7|7H|8|8H|9|9H|10|10H|11|11H|12|12H|13",
 "EURO|36|37|37.5|38|39|39.5|40|40.5|41.5|42|42.5|43.5|44|44.5|45|46|46.5|47|48",
 "CM|22.5|23|23.5|24|24.5|25|25.25|25.5|26|26.5|27|27.5|28|28.25|28.5|29|29.5|30|30.5",
 "UK|3|3.5|4|4.5|5|5.5|6|6H|7|7H|8|8H|9|9H|10|10H|11|11H|12"])
row_chart("Asics", "asics.com/my/en-my", "Shoe Size Guide: WOMEN'S SHOE SIZES", AM, [
 "US|5|5H|6|6H|7|7H|8|8H|9|9H|10|10H|11|11H|12",
 "EURO|35.5|36|37|37.5|38|39|39.5|40|40.5|41.5|42|42.5|43.5|44|44.5",
 "CM|22.5|22.75|23|23.5|24|24.5|25|25.5|25.75|26|26.5|27|27.5|28|28.5",
 "UK|3|3.5|4|4.5|5|5.5|6|6.5|7|7.5|8|8.5|9|9.5|10"])
row_chart("Asics", "asics.com/my/en-my", "Shoe Size Guide: KIDS' SHOE SIZES", AM, [
 "CM|12|12.5|13|13.25|13.5|14|14.5|14.75|15|15.5|16|16.5|17.0|17.25|17.5|18|18.5|19|19.5|19.75|20|20.5|21|21.5|22|22.25|22.5|23|23.5|24|24.5|25|25.5",
 "US|K4|K4H|K5|K5H|K6|K6H|K7|K7H|K8|K8H|K9|K9H|K10|K10H|K11|K11H|K12|K12H|K13|K13H|1|1H|2|2H|3|3H|4|4H|5|5H|6|6H|7",
 "UK|K3|K3.5|K4|K4.5|K5|K5.5|K6|K6.5|K7|K7.5|K8|K8.5|K9|K9.5|K10|K10.5|K11|K11.5|K12|K12.5|K13|K13.5|1|1.5|2|2.5|3|3.5|4|4.5|5|5.5|6",
 "EURO|19.5|20.5|21|21.5|22.5|23|23.5|24|25|25.5|26|26.5|27|28|28.5|29.5|30|30.5|31.5|32|32.5|33|33.5|34.5|35|35.5|36|37|37.5|38|39|39.5|40"])

with open(os.path.join(D, "charts.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["brand", "site", "chart", "column", "row", "value", "url", "date_read", "tool"]); w.writerows(rows)

# ---- claims ----
C = []
def cl(brand, kind, claim, words, url): C.append([f"BR{len(C)+1:03d}", brand, kind, claim, words, url, DATE, "chrome"])
cl("On","fit_direction","On's product-page Size & Fit panel calls the shoe true to size","True to size.",ON_M)
cl("On","fit_direction","Same line on the women's Cloud 6 panel","True to size.",ON_W)
cl("On","chart_columns","The product-page size chart prints US, BR, MX, EU, JP, UK and no foot-length column","US | BR | MX | EU | JP | UK",ON_M)
cl("HOKA","measure_how","Trace each foot","Trace the outline of each foot on a piece of paper.",HK)
cl("HOKA","measure_how","Heel to longest toe, straight line","In a straight line from the middle of the heel to the longest toe, measure the length of each foot.",HK)
cl("HOKA","measure_how","Use the longer foot","If one foot is longer than the other, take the larger measurement and compare to the chart on the next page.",HK)
cl("HOKA","label_to_foot","Foot length decides the size, rounded to the closest size within 2 mm","Foot length will determine your shoe size - round up or down to the closest size within 2mm.",HK)
cl("HOKA","length_column","The chart's length row is labelled the foot's length (cm and in), with a width row","Foot Length (CM) / Foot Length (IN) / Regular Width Length (MM)",HK)
cl("HOKA","length_column","Kids' chart column labelled the foot's length","Size | Foot Length (cm)",HK)
cl("HOKA","finder","A True Fit link on the page","FIND YOUR TRUE FIT / FIND OUT MORE",HK)
cl("Skechers","disclaimer","Performance running and walking sizes may vary","Skechers Performance running and walking footwear sizes may vary",(SK:="https://www.skechers.com/size-chart/"))
cl("Skechers","width","Women's Wide Fit equals W or D","Skechers Women's Wide Fit is equivalent to Women's W or D width.",SK)
cl("Skechers","fit_direction","Fit system intro","Every foot is unique so we've developed a signature fit system to help you find your favorite style in the best size to ensure the greatest comfort possible.",SK)
cl("Skechers","chart_columns","US chart columns: no CM or foot length","USA UK EU",SK)
NBF="https://www.newbalance.com/faqs/product-sizing/"; NBG="https://www.newbalance.com/size-guide.html"
cl("New Balance","fit_direction","Generally true to size; deviations noted on product pages","Our shoes generally run true to size and align with standard industry sizing. If a style runs smaller or larger, we note that on the product page to help you choose the best size.",NBF)
cl("New Balance","measure_how","Printable measuring tools for size and width","Download and print our sizing tools for men, women and kids to easily find your shoe size. These printable measuring charts help you find your size and width and offer tips for finding your best fit.",NBF)
cl("New Balance","between_sizes","Choose the larger size between sizes","Choose the larger size if your feet are between sizes. You can adjust for a better fit with socks, insoles and lacing patterns.",NBG)
cl("New Balance","measure_how","Try on late afternoon","Try shoes on in the late afternoon when your feet are at their largest due to normal swelling.",NBG)
cl("New Balance","fit_allowance","Toe room to wiggle","You should have enough room in the toe box to wiggle your toes.",NBG)
cl("New Balance","measure_how","Fit the larger foot","Be sure to try shoes on both feet. Your left and right feet may differ in length or width as much as a full size. Always buy shoes that fit your larger foot.",NBG)
cl("New Balance","disclaimer","Too-small purchases more common","People are more than twice as likely to buy a shoe that is too small than too big.",NBG)
cl("New Balance","length_column","Size guide's Find your size tables print a Length (cm)/(in) column, not said there to be the foot's","Men's US Size | Women's US Size | Length (cm) | Length (in) | UK size | EU size",NBG)
cl("UGG","chart_scope","Sizes shown in US measurements; chart converts to international","All sizes on our site are shown in standard measurements for the United States. The chart below shows how our sizes convert to international sizes.",UG)
cl("UGG","length_column","Chart column of heel-to-toe length","Heel to Toe (IN)",UG)
cl("UGG","length_column","Big Kids chart prints heel-to-toe in inches and mm","Heel to Toe (IN) | Heel to Toe (MM)",UG)
cl("UGG","measure_how","Stand on a line, heel and longest toe centred; mark both ends","Stand on the line with your heel and longest toe centered. ... Place a mark on the line at the tip of the longest toe and at the back of the heel.",UG)
cl("UGG","label_to_foot","Measured foot length, the larger foot, read against the chart","Measure the distance between the marks. Taking the larger of the two measurements, use the conversion chart to find your correct shoe size.",UG)
cl("UGG","finder","True Fit without measuring (Get Started / Sign In)","Get personal fit and size recommendations for every style. It’s fast, it's free, and there’s no measuring!",UG)
AD="https://www.adidas.com/us/help/size_charts/men-shoes"; ADB="https://www.adidas.com/us/blog/968383-how-to-measure-shoe-size"; ADU="https://www.adidas.co.uk/blog/1005401-how-to-measure-shoe-size"
cl("adidas","length_column","Chart's length rows","Heel-toe (INCH) / Heel-toe (cm)",AD)
cl("adidas","between_sizes","Between sizes: down for tight, up for loose","In between sizes? For a tight fit, go one size down. For a loose fit, go one size up.",AD)
cl("adidas","measure_how","Measure at end of day","Follow these easy steps to get the right size. For the best fit, measure your feet at the end of the day.",AD)
cl("adidas","measure_how","Length: big toe tip to outermost heel","1. Length: Measure the distance from the tip of your big toe to the outermost part of your heel.",AD)
cl("adidas","label_to_foot","Chart follows standard sizing","The adidas shoe size chart for men follows standard sizing. The shoe size chart should therefore reflect your normal fit but check the information on this page for more details.",AD)
cl("adidas","measure_how","Measure in usual socks","Before measuring, put on the socks you typically wear with your shoes.",ADB)
cl("adidas","measure_how","Big toe to outermost heel is the foot's length","After tracing your foot, use your ruler to measure the distance between your big toe and the outermost part of your heel to learn the length of your foot.",ADB)
cl("adidas","fit_allowance","Walking shoes: a thumb's width","aim for walking shoes with a thumb’s width between your longest toe and the front of the shoe.",ADB)
cl("adidas","fit_allowance","Running shoes: half a thumb's width","There should be half a thumb’s width of space at the front of your running shoe.",ADB)
cl("adidas","fit_direction","Up a half or full size for exercise","Keep in mind, feet tend to swell when you're active, so if you know you’ll be wearing the shoe while exercising, consider going up a half or even full size.",ADB)
cl("adidas","width","Width standard at US men's 9","In U.S. men’s sizing, if your foot width is about 4.2 inches at size 9, that’s standard; if it’s more than 4.4 inches, you’re in wide territory.",ADB)
cl("adidas","fit_direction","UK blog: up a half or full size for exercise","consider going up a half or full size when you know you will be using the shoe while exercising.",ADU)
cl("adidas","measure_how","UK blog: same measuring steps, in trainers' socks","Before measuring, put on the socks you typically wear with your trainers.",ADU)
cl("Crocs","between_sizes","Round up between sizes; wide feet normal size","Tip: If you're in between sizes, round up. For wide feet order your normal size.",CR)
cl("Crocs","length_column","Adult chart's length row","Heel to Toe Length",CR)
cl("Crocs","between_sizes","Kids: round up; juniors 3+ can use adult sizes","Tip: If your child is between sizes, round up. Juniors size 3 and up can also shop our adult sizes.",CR)
cl("Crocs","measure_how","FAQ points to the size chart","Size charts can be found in the link under the size selections on each product page or on our size chart page below:","https://www.crocs.com/customer-service/faqs")
cl("Crocs","measure_how","Page data (not visible text) carries a measuring line and a 'Learn how to measure' link","Measure your foot and find the right size for your Crocs shoes.","https://www.crocs.com/customer-service/faqs")
RE="https://www.reebok.eu/products/club-c-85-100074451-1536"
cl("Reebok","chart_columns","EU site's product Size guide prints Europe, UK, US only, no words","Europe | UK | US",RE)
AU="https://www.asics.com/us/en-us/aligned-size-charts/"
cl("Asics","measure_how","US: measure at the end of the day","Follow these steps to determine your shoe size. Do this during or at the end of the day for accuracy, as feet swell throughout the day.",AU)
cl("Asics","measure_how","US: heel against a wall, mark longest toe and heel","Place a piece of paper under your foot. Stand up straight and have your heel lightly touching against a wall. Mark the tip of your longest toe and heel on the paper. Measure the length of your feet from heel to toe.",AU)
cl("Asics","label_to_foot","US: compare the measurement with the chart directly (no allowance stated)","Repeat the steps for your other foot and compare the measurements with our size chart below.",AU)
cl("Asics","fit_direction","US: running shoes a half size up from casual","For running shoes, we generally recommend sizing up a half size from your casual shoe size.",AU)
cl("Asics","chart_columns","MY guide's charts: US, EURO, CM, UK; no measuring words","MEN'S/UNISEX SHOE SIZES: US / EURO / CM / UK",AM)
BK="https://www.birkenstock.com/my/things-to-know/fit-guide/"
cl("Birkenstock","measure_how","Heels against the wall; mark the longest toe","Place the sheets of paper on the floor. Stand straight on the paper with your heels against the wall. ... Measure the length: mark the longest toe of each foot.",BK)
cl("Birkenstock","width","Two footbed widths","To guarantee optimum comfort, we offer our original footbed in two widths: “regular” for normal to sturdy feet and “narrow” for slim and more narrow feet.",BK)
cl("Birkenstock","finder","Calculator takes each foot's length and width in mm","length-left / width-left / length-right / width-right (221 mm ..., 81 mm ...) / CALCULATE SIZE",BK)
with open(os.path.join(D, "claims.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["id","brand","kind","claim","exact_words","url","date_read","tool"]); w.writerows(C)

F = [
 ["Birkenstock", BK, v, "not obtained", "Calculator selects (length and width per foot, mm) set by script did not register (the form answered 'Please select a width'); per-select clicks were beyond the call budget. Width input tried: 95 mm.", DATE] for v in ["24.0","25.0","26.0","27.0","28.0"]]
F += [["Clarks (kids)", "https://www.clarks.co.uk/", "", "not reached", "Navigation to clarks.co.uk refused by the extension's site permission.", DATE],
      ["adidas", AD, "", "no finder", "No size finder taking a foot length on the size chart or either blog page.", DATE],
      ["Reebok", RE, "", "no finder", "EU product Size guide is a table only; reebok.co.uk unreadable (permission).", DATE],
      ["Skechers", SK, "", "no finder", "US size chart has no finder; skechers.com.au refused (permission).", DATE],
      ["HOKA", HK, "", "not probed", "True Fit link (FIND YOUR TRUE FIT); asks for shoes/personal profile, not a foot length.", DATE],
      ["UGG", UG, "", "not probed", "True Fit: 'Get Started / Sign In', 'there’s no measuring!'; not a foot-length finder.", DATE]]
with open(os.path.join(D, "finders.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["brand","finder_url","input_cm","output","exact_words","date_read"]); w.writerows(F)
print(len(rows), "chart cells;", len(C), "claims;", len(F), "finder rows")
