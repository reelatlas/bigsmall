"""Record RunRepeat's sizing claims (exact words read by runrepeat.py from the saved pages)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rec import add_lead  # noqa: E402

S = "RunRepeat (size-chart pages)"
U = "https://runrepeat.com/size-charts/"
K = "reviewer/lab site compiling brand charts"
L = [
 ("adidas", "consistent with most brands", "We compared shoe size charts from 40+ brands to find out how adidas footwear measures across the board. Verdict: adidas size chart is consistent with most other brands.", "adidas", "no"),
 ("adidas", "same size as Nike/New Balance/HOKA within half a size; Reebok shares scheme", "With an error margin of half a size, you're most likely to get the same size you have in adidas in the following brands: Nike , New Balance , HOKA , etc. As adidas' subsidiary, Reebok also shares the brand's sizing scheme.", "adidas", "no"),
 ("ASICS", "consistent with industry average", "Based on the data from 40+ brands in our database, we found that ASICS shoe sizes are generally consistent with the industry average.", "asics", "no"),
 ("ASICS", "matches adidas/Brooks/NB; half size off Nike and Saucony in women's", "ASICS' sizing scheme primarily corresponds to that of adidas , Brooks , and New Balance . However, there tends to be a half-size difference in women's sizes with Nike and Saucony .", "asics", "no"),
 ("ASICS", "290 mm row: ASICS men's 11.5 where others 11", "Shoe length (mm) | ASICS | Nike | New Balance | Brooks | Saucony | adidas ... 290 | 11.5 | 11 | 11 | 11 | 11 | 11", "asics", "yes (mm per size, labelled Shoe length)"),
 ("Brooks", "brand recommends half to full size larger than casual shoe; same as ASICS/NB/Saucony", "On its official website, Brooks recommends going half-a-size to a full size larger than your casual dress shoe. However, if you already own a pair of running shoes from ASICS , New Balance , or Saucony , you can most likely go with the same size.", "brooks", "no"),
 ("Converse", "Chuck Taylor half size below regular US size", "Men | 9 | 9 | 8.5 ... Women | 7 | 7 | 6.5 (columns: Regular US size | Regular Converse size | Converse Chuck Taylor size)", "converse", "no"),
 ("Converse", "two-size gap men's to women's", "According to the brand's official sizing scheme, there is a two-size difference between men's and women's US sizes. For example, men's US size 7 equals women's US size 9.", "converse", "no"),
 ("HOKA", "same size as NB/adidas/ASICS; half-size adjustments vs Nike and ASICS", "The sizing scheme of HOKA matches most running shoe brands, including New Balance and adidas . However, half-size adjustments may be necessary for brands like Nike and ASICS .", "hoka", "no"),
 ("HOKA", "women's one US size above men's", "Please note that HOKA's women's sizes are one US size bigger than men's. Ladies should refer to the number next to \"W\" when ordering unisex shoes from HOKA.", "hoka", "no"),
 ("New Balance", "consistent with most athletic brands", "We put together the data from 40+ brand shoe size charts to find out how New Balance sizes compare to other brands. Verdict: New Balance is consistent with most popular athletic brands .", "new-balance", "no"),
 ("Nike", "consistent with most athletic brands", "We used the data from 40+ brand shoe size charts to see how Nike sizes differ from the rest of the market. Verdict: Nike shoe sizing is consistent with most other athletic brands.", "nike", "no"),
 ("Nike", "used to run small, now true to size in their tests", "Nike shoes used to be notorious for running small, but over the last couple of years, nearly all Nike shoes we've tested proved to be true to size and consistent with other popular athletic brands.", "nike", "no"),
 ("Nike", "unisex W is 1.5 above M", "As you can see, women's size is 1.5 US bigger than men's. So ladies should refer to the number next to \"W\" when ordering unisex shoes from Nike.", "nike", "no"),
 ("Converse", "Chuck 70s run large; Jordan and Converse share Nike's approach", "As Nike's subsidiaries, Jordan and Converse share Nike's approach to shoe sizing. ... However, Converse has its own page dedicated to shoe sizing because some of its models (like the Chuck 70s) run large.", "nike", "no"),
 ("On", "consistent with industry average; mostly true to size", "Comparing On shoe sizes to 40+ other athletic shoe brands, we found that its sizing scheme is consistent with the industry average.", "on", "no"),
 ("On", "brand recommends half size bigger in some silhouettes", "Sometimes you will find that the brand itself recommends getting a half size bigger in certain silhouettes.", "on", "no"),
 ("Puma", "men's same as adidas/Nike/Reebok; women's half size off adidas/Reebok", "However, there are small (half-size) discrepancies in women's sizes because PUMA has a 1.5 US size difference between men's and women's sizes whereas brands like adidas and Reebok only have 1 US size difference.", "puma", "no"),
 ("Reebok", "shares adidas scheme; consistent with Nike except women's", "As a subsidiary of adidas , Reebok shares the brand's sizing scheme as well. It also tends to be consistent with size charts of other popular brands like Nike (except women's sizes), and New Balance .", "reebok", "no"),
 ("Reebok", "1.5 size gap men's to women's (contradicts its own table and adidas page)", "Please note that there is a 1.5 size difference between men's and women's sizes so you can adjust the size if only men's sizes are presented.", "reebok", "no"),
 ("Salomon", "true to size in their wear tests and lab measurements", "Based on our wear tests and lab measurements, a vast majority of Salomon shoes and boots run true to size and provide ample toebox space.", "salomon", "no"),
 ("Salomon", "5 mm between foot length and Mondopoint (CM) size", "Please note that there is a 5-mm difference between a foot length and a Mondopoint (CM) size.", "salomon", "no"),
 ("Skechers", "5 mm per half size; consistent with NB/Saucony/ASICS/Brooks; 0.5-1 size off Nike/adidas", "However, there can be 0.5 to 1 US size discrepancies with Nike and adidas , as their sizing schemes differ.", "skechers", "no"),
 ("Timberland", "consistent with Merrell/KEEN/Salomon; some boots run shorter or longer", "Please keep in mind that not all Timberland boots fit precisely as stated in the brand size chart. Some models can run shorter or longer than the expected internal length, others can have more tapered toebox shapes.", "timberland", "no"),
 ("Under Armour", "true to size; women's 1.5 above men's", "It is extensively praised for running true to size and being coherent with other major athletic brands.", "under-armour", "no"),
 ("Vans", "unisex last; half-size deviation possible; Old Skool/Sk8-Hi snug", "Because of Vans' unisex sizing scheme where one last is used for both men's and women's sneakers, there can be a slight (half-a-size) deviation from other athletic brands.", "vans", "no"),
 ("Vans", "Converse Chucks half size below Vans/Nike/adidas at same mm", "Shoe length (MM) | Vans | Nike | adidas | Converse (Chuck Taylor/Chuck 70) ... 270 | 9 | 9 | 9 | 8.5", "vans", "yes (mm per size, labelled Shoe length)"),
]
for b, claim, ex, slug, foot in L:
    print(add_lead(b, S, K, claim, ex, U + slug, "script", "", "", foot))
