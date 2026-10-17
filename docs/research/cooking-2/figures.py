"""Cooking's figures (2026-10-16), decided by the rule in cooking-2.md ("How a figure is decided"):
each ingredient's cup filled the way US recipes mean it, the weighings that count toward it, and
the figure their median gives (with fewer than three, USDA's measured cups, where they weighed it).
A liquid's figure is its density times the cup, from its density's references. The figures set
aside are kept with the reason, and each figure the first reconciliation gave, for the record.

Every figure here was read on its page (cooking-2/check.md, and six read the same day: Gold Medal,
Beranbaum's spaetzle, King Arthur's baking soda, Jacobsen, Allrecipes, the Food Buying Guide's nut
butters). write_ingredients.py writes packages/core/src/units/ingredients.ts from this file, and
core's test recomputes every figure by the same rule.
"""
from decimal import ROUND_HALF_EVEN, Decimal

U69 = "USDA's measured cups (1969)"
FF = 'USDA FoodData Central, Foundation Foods'
FBG = 'USDA Food Buying Guide'
KA = 'King Arthur Baking'
ATK = "America's Test Kitchen"
RLB = 'Rose Levy Beranbaum'
MS = 'Milk Street'
DK = 'Danish food composition table'
SR = 'USDA FoodData Central, SR Legacy'

# Why a figure is set aside (cooking-2.md, "Which figures count").
SR_WHY = "a compilation: most of its cups USDA's older weighings, their methods unstated"
LABEL = "a label: grams rounded on a serving of a few grams, on the FDA's label measures"
DIPPED = 'another method: dipped and swept'
AVERAGE = 'an average of published charts, not a weighing'

# id: method, basis, counted [(by, grams or (low, high), detail[, sd])], aside [(by, grams, why)], note, first
# USDA's rows carry the standard deviation of its cups (check.csv), the yardstick each figure is
# checked against (cooking-2.md, "Checked against USDA's cups").
FIGURES = {
    # Flours
    'all-purpose-flour': dict(
        method='spooned and leveled', basis='weighed',
        counted=[(U69, 126, '510 cups', 2.8), (KA, 120, None), (RLB, 121, None),
                 ('Food Network Kitchen', (125, 130), None), ('Stella Parks, Serious Eats', 128, None),
                 ('Gold Medal', 136, '3⅓ cups a pound')],
        aside=[(SR, 125, SR_WHY), (ATK, 142, DIPPED), (f'{MS}, Flour Power', 130, AVERAGE),
               ('Allrecipes', 121, 'could not be read: the site refuses requests'),
               ('Gold Medal label', 120, LABEL)],
        note="Dipped and swept, a cup holds 142 to 143 g (America's Test Kitchen, USDA's 1969 cups); sifted first, 116 g (USDA). USDA's SR Legacy table gives 125 g.",
        first=125),
    'bread-flour': dict(
        method='spooned and leveled', basis='weighed',
        counted=[(U69, 123, '40 cups', 3.5), (KA, 120, None), (RLB, 129, None), ('Zojirushi', 118, 'fluffed'),
                 ('Gold Medal', 136, '3⅓ cups a pound')],
        aside=[(SR, 137, SR_WHY), (ATK, 156, DIPPED), (U69, 136, DIPPED), (f'{MS}, Flour Power', 137, AVERAGE),
               ('Erik Jacobsen', 113, "not shown to be weighed: what spooning 'usually' gives"),
               ('Peter Reinhart', 127, 'a best guess, quoted secondhand'), ('Zojirushi', 182, 'another method: scooped')],
        note="Dipped and swept, a cup holds 136 to 156 g (USDA's 1969 cups 136 g, America's Test Kitchen 156 g). USDA's SR Legacy gives 137 g, about what a dipped cup weighs.",
        first=123),
    'whole-wheat-flour': dict(
        method='stirred, spooned, and leveled', basis='weighed',
        counted=[(U69, 120, '45 cups', 3.3), (KA, 113, 'its Premium 100%')],
        aside=[(SR, 120, SR_WHY), (FBG, 120, "repeats SR Legacy's figure"), (ATK, 156, DIPPED),
               (f'{MS}, Flour Power', 140, AVERAGE),
               ('FAO/INFOODS, measured in France', 130, "a density for food tables, a powder's fill unstated"),
               ('Gold Medal label', 120, LABEL), ("Bob's Red Mill label", 152, LABEL)],
        note="Dipped and swept, a cup holds about 156 g (America's Test Kitchen).",
        first=120),
    'cake-flour': dict(
        method='spooned and leveled, unsifted', basis='weighed',
        counted=[(U69, 111, '300 cups', 2.4), (RLB, 113, None)],
        aside=[(ATK, 113, DIPPED), (U69, 119, DIPPED), ("Bob's Red Mill label", 112, LABEL),
               (KA, 120, "another flour: King Arthur's own unbleached cake flour"),
               (f'{MS}, Flour Power', 120, AVERAGE), (SR, 137, SR_WHY)],
        note="Sifted first, a cup holds 99 to 100 g (USDA's 1969 cups, Rose Levy Beranbaum); dipped, 119 g (USDA). King Arthur's own unbleached cake flour is heavier, 120 g. USDA's SR Legacy gives 137 g, above even a dipped cup.",
        first=112),
    'almond-flour': dict(
        method='spooned and leveled', basis='weighed',
        counted=[(KA, 96, None)],
        aside=[(f'{MS}, Flour Power', 100, AVERAGE), (f'{SR}, ground almonds', 95, SR_WHY),
               (ATK, 113, DIPPED), ("Bob's Red Mill label", 112, LABEL)],
        note="Dipped, a cup holds about 113 g (America's Test Kitchen); Bob's Red Mill's label gives 112 g. Almond meal is lighter, 84 g (King Arthur Baking).",
        first=98),
    # Sugars
    'granulated-sugar': dict(
        method='spooned or poured, and leveled', basis='weighed',
        counted=[(U69, 196, '81 cups', 7.6), (KA, 198, None), (ATK, 198, 'dipped, which a free-flowing sugar does not mind'),
                 (RLB, 200, None), ('Domino Sugar', 202, '2¼ cups a pound'), (FF, 188, '2006 samples')],
        aside=[(SR, 200, SR_WHY)],
        note="Measuring cups vary more than sugar does: three dry measuring cups held 182, 201, and 212 g of the same sugar (Rose Levy Beranbaum's kitchen).",
        first=198),
    'brown-sugar': dict(
        method='firmly packed', basis='weighed',
        counted=[(U69, 211, '118 cups', 22.5), (KA, 213, None), (RLB, 217, 'light brown'), (ATK, 198, None),
                 ('Domino Sugar', (181, 194), '2⅓ cups a pound, 10 cups in 4 pounds')],
        aside=[(SR, 220, SR_WHY)],
        note="Packing moves it by more grams than any other ingredient here: USDA's 1969 cups varied by 22.5 g (one standard deviation).",
        first=211),
    'powdered-sugar': dict(
        method='spooned and leveled, unsifted', basis='weighed',
        counted=[(U69, 113, '40 cups', 5.4), (KA, 113, None), (RLB, (112, 114), None),
                 ('Domino Sugar', 121, '3¾ cups a pound')],
        aside=[(ATK, 113, DIPPED), (SR, 120, SR_WHY)],
        note="Sifted first, a cup holds 95 g (USDA's 1969 cups, 64 cups).",
        first=113),
    # Fats and oils
    'butter': dict(
        method='by the stick, half a cup each', basis='weighed',
        counted=[(ATK, 227, None), (KA, 226, None), (RLB, 227, None),
                 ('Land O Lakes', 227, '32 tablespoons a pound'), (FBG, 227, 'a pound is 2 cups')],
        aside=[(SR, 227, SR_WHY)],
        note='A US stick is a quarter pound and half a cup, its wrapper marked in tablespoons.',
        first=227),
    'vegetable-oil': dict(
        method='poured to the line', basis='density',
        counted=[('Codex Alimentarius CXS 210, soybean oil', (217, 218), 'at 20 °C'),
                 ('Codex Alimentarius CXS 210, canola oil', (216, 217), 'at 20 °C'),
                 (DK, 218, 'oil in general, 1996, read in FAO/INFOODS')],
        aside=[(f'{SR}, canola oil', 218, SR_WHY)],
        note="Soybean oil is the usual US vegetable oil, canola the next. Cups filled by hand weigh about 4% less: USDA's 1969 cups 209 g, America's Test Kitchen 210 g, Milk Street 206 g.",
        first=217),
    'olive-oil': dict(
        method='poured to the line', basis='density',
        counted=[('Codex Alimentarius CXS 33', (215, 216), 'at 20 °C')],
        aside=[('FAO/INFOODS', 217, 'taken from a physics web page'), (SR, 216, SR_WHY)],
        note="Cups filled by hand weigh less: America's Test Kitchen 210 g.",
        first=216),
    'shortening': dict(
        method='packed and leveled', basis='weighed',
        counted=[(MS, 187, 'measured several times, averaged'), ("Crisco's 1-cup baking stick", 190, None),
                 (KA, 184, None), (ATK, 176, None)],
        aside=[(U69, 187, 'another method: spooned, not packed'), (SR, 205, SR_WHY), ('Crisco label', 192, LABEL)],
        note="USDA's 1969 cups, spooned rather than packed, weighed 187 g; USDA's SR Legacy gives 205 g, above every cup weighed.",
        first=188),
    # Dairy and eggs
    'milk': dict(
        method='poured to the line', basis='density',
        counted=[('University of Guelph, dairy science', (243, 244), 'from 20 °C to cold'),
                 (DK, 244, '1996, read in FAO/INFOODS')],
        aside=[(SR, 244, SR_WHY)],
        note="Cups filled by hand weigh a little less (USDA's 1969 cups: 241 g). Charts that write a cup of milk as 8 oz, 227 g, are 7% light.",
        first=244),
    'heavy-cream': dict(
        method='poured to the line, cold', basis='density',
        counted=[('University of Guelph, dairy science', (235, 238), 'from 20 °C to cold'),
                 (DK, 233, '38% fat, 1996, read in FAO/INFOODS')],
        aside=[(SR, 238, SR_WHY)],
        note="Cold cream is denser than warm; used cold, it takes the middle of the two. Cups filled by hand weigh a little less (USDA's 1969 cups: 232 g).",
        first=237),
    'sour-cream': dict(
        method='spooned and leveled', basis='weighed',
        counted=[(U69, 236, '32 cups', 9.4), (ATK, 236, None), (DK, 238, 'about 18% fat, 1996, read in FAO/INFOODS')],
        aside=[(SR, 230, SR_WHY), (KA, 227, 'a convention: every cup written as 8 oz')],
        note=None,
        first=236),
    'yogurt': dict(
        method='spooned and leveled', basis='weighed',
        counted=[(U69, 245, '11 cups', 4.6), (DK, 244, '1996, read in FAO/INFOODS')],
        aside=[(SR, 245, SR_WHY), (KA, 227, 'a convention: every cup written as 8 oz')],
        note="Greek yogurt is thicker; no source we found has weighed a cup of it (USDA's survey tables reuse plain yogurt's 245 g).",
        first=245),
    'shredded-cheddar': dict(
        method='loosely filled, 4 oz a cup as recipes count it', basis='weighed',
        counted=[(KA, 113, None), (ATK, 113, '8 oz to 2 cups'), (FBG, 113, 'a pound to about 4 cups'),
                 (FF, 105, '2014 samples'), (U69, 98, '20 cups', 11.4)],
        aside=[('Sargento label', 112, LABEL), (SR, 113, SR_WHY)],
        note='Recipes and packages count 4 oz of cheese to a cup (an 8 oz bag holds 2 cups); a cup filled lightly by hand weighs less.',
        first=113),
    # Liquids and syrups
    'water': dict(
        method='poured to the line', basis='density',
        counted=[('NIST (IAPWS-95)', (236, 237), 'from 20 °C to 4 °C')],
        aside=[(SR, 237, SR_WHY)],
        note='Charts that write a cup of water as 8 oz, 227 g, are 4% light.',
        first=236),
    'honey': dict(
        method='poured or spooned to the line', basis='density',
        counted=[("White's honey density table", (335, 339), 'from 18% to 15% water; 336 g at the US average, 17.2%')],
        aside=[(KA, 336, 'a weighing, where a liquid goes by its density'),
               ('National Honey Board', 340, '12 oz a cup, rounded'), (SR, 339, SR_WHY)],
        note="Cups filled by hand weigh less (USDA's 1969 cups: 325 g). King Arthur Baking weighs 336 g; the National Honey Board says 12 oz, 340 g.",
        first=336),
    'maple-syrup': dict(
        method='poured to the line', basis='density',
        counted=[('Sucrose density tables (NBS C440)', (313, 317), "at the US and Canadian grades' 66 to 68.9 Brix"),
                 ("USDA's Maple Sirup Producers Manual", 315, 'at 67.5 Brix')],
        aside=[(KA, 312, 'a weighing, where a liquid goes by its density'), (SR, 315, SR_WHY)],
        note="Pure maple syrup at about 67 Brix. King Arthur Baking weighs 312 g.",
        first=314),
    'molasses': dict(
        method='poured to the line', basis='density',
        counted=[("Grandma's Molasses specification", 332, '11.7 lb a gallon'),
                 ('Sucrose density tables (NBS C440)', (332, 334), "at 79 to 80 Brix (USDA's grades: at least 79)"),
                 ('NBS Circular C440', 331, 'a worked example, one molasses weighed')],
        aside=[(SR, 337, SR_WHY), (KA, 340, "honey's weight, applied to molasses")],
        note="Cups filled by hand weigh less (USDA's 1969 cups: 309 g); King Arthur Baking's 340 g treats molasses as honey.",
        first=332),
    # Baking
    'cocoa-powder': dict(
        method='spooned and leveled', basis='weighed',
        counted=[(U69, 86, '14 cups', 8.9), (KA, 84, None), (MS, 85, 'measured several times, averaged')],
        aside=[(ATK, 85, "another method: dipped, by its rule for dry ingredients"), (SR, 86, SR_WHY)],
        note="Natural and Dutch-process weigh alike (America's Test Kitchen: 84 and 86 g).",
        first=85),
    'cornstarch': dict(
        method='spooned and leveled', basis='weighed',
        counted=[(U69, 125, '15 cups', 4.7), (KA, 112, None)],
        aside=[("Bob's Red Mill label", 128, LABEL), ('FAO/INFOODS, loosely packed', 128, 'taken from a physics web page'),
               (ATK, 113, "another method: dipped, by its rule for dry ingredients"),
               (f'{MS}, Flour Power', 133, AVERAGE), (SR, 128, SR_WHY)],
        note=None,
        first=125),
    'baking-soda': dict(
        method='spooned and leveled', basis='weighed',
        counted=[('Church & Dwight (Arm & Hammer)', 239, 'its bulk density'), (RLB, 240, '5 g a teaspoon'),
                 (KA, 288, '3 g a half teaspoon')],
        aside=[(SR, 221, SR_WHY), ('Clabber Girl label', 230, "a label: the FDA's reference amount, 0.6 g")],
        note="About 5 g a teaspoon. Labels' 0.6 g an eighth of a teaspoon is the FDA's reference amount, not a weighing.",
        first=239),
    'baking-powder': dict(
        method='spooned and leveled', basis='weighed',
        counted=[(U69, 177, '27 cups, double-acting (sodium aluminum sulfate and phosphate)', 4.3),
                 (KA, 192, '4 g a teaspoon')],
        aside=[("Bob's Red Mill label", 192, LABEL), ('Clabber Girl label', 230, "a label: the FDA's reference amount, 0.6 g"),
               (RLB, 216, 'another method: dipped, 4.5 g a teaspoon'), (SR, 221, SR_WHY)],
        note="About 3.7 g a teaspoon. Kinds differ: USDA's 1969 cups weighed a phosphate powder at 217 g and a tartrate powder at 181 g.",
        first=192),
    'table-salt': dict(
        method='spooned and leveled', basis='weighed',
        counted=[(U69, 292, '27 cups', 3.0), (FF, 293, '6.1 g a teaspoon, 2018 samples'), (KA, 288, '18 g a tablespoon')],
        aside=[(RLB, 288, 'another food: her salt is not named, her recipes fine sea salt'),
               ('Morton label', 288, LABEL), (SR, 292, SR_WHY)],
        note="About 6 g a teaspoon. Kosher salt differs by brand: Diamond Crystal about 128 g a cup, Morton's 230 to 256 g.",
        first=290),
    'active-dry-yeast': dict(
        method='spooned and leveled', basis='weighed',
        counted=[('Red Star', 149, 'a 7 g packet, about 2¼ teaspoons'),
                 ("Fleischmann's", 151, 'a ¼ oz packet, about 2¼ teaspoons'),
                 (FBG, 146, None), (U69, 142, '22 cups', 4.9)],
        aside=[("Bob's Red Mill label", 154, LABEL), (SR, 192, SR_WHY)],
        note="About 3 g a teaspoon. USDA's SR Legacy gives 4 g a teaspoon (192 g a cup), heavier than every other source. Instant yeast weighs about the same (King Arthur Baking: 144 to 149 g).",
        first=147),
    # Grains
    'rolled-oats': dict(
        method='poured or spooned, and leveled', basis='weighed',
        counted=[(ATK, 85, None), (KA, 89, None), (U69, 75, '80 cups', 5.5)],
        aside=[("Bob's Red Mill label", 98, LABEL), (SR, 81, SR_WHY), (FBG, 81, "repeats SR Legacy's figure"),
               (FBG, 76, "about 6 cups a pound: USDA's 1969 cup, rounded")],
        note="Oats vary with the flake and the brand. Quick oats run 73 to 96 g a cup by source (USDA's 1969 cups 73 g, America's Test Kitchen 96 g).",
        first=85),
    'white-rice': dict(
        method='poured and leveled, uncooked', basis='weighed',
        counted=[(U69, 192, '28 cups', 11.2), (KA, 198, None), ('FAO/INFOODS', 194, 'measured by its compiler')],
        aside=[(FBG, 194, "about 2⅓ cups a pound: USDA's 1969 cup, rounded"), (SR, 185, SR_WHY)],
        note=None,
        first=195),
    # Mix-ins and spreads
    'chocolate-chips': dict(
        method='poured and leveled', basis='weighed',
        counted=[(U69, 167, '12 cups', 2.9), (KA, 170, None), (ATK, 170, None), (MS, 164, 'measured several times, averaged')],
        aside=[(SR, 168, SR_WHY), ("Hershey's label", 240, "a label: the FDA's reference amount, 15 g a tablespoon")],
        note="Labels' 15 g a tablespoon is the FDA's reference amount for baking chips, not a weighing.",
        first=168),
    'chopped-walnuts': dict(
        method='chopped, then measured', basis='weighed',
        counted=[(U69, 120, '13 cups', 5.2), (ATK, 119, None), (KA, 113, None), (MS, 112, 'measured several times, averaged')],
        aside=[(FBG, 121, 'another form: pieces, not chopped'), (SR, 117, SR_WHY)],
        note='"1 cup walnuts, chopped" means measure whole, then chop: America\'s Test Kitchen and Rose Levy Beranbaum weigh that cup at 96 to 106 g.',
        first=117),
    'chopped-pecans': dict(
        method='chopped, then measured', basis='weighed',
        counted=[(MS, 114, 'measured several times, averaged'), (KA, 114, 'diced'), (ATK, 119, None),
                 (U69, 108, '20 cups', 4.9), (FBG, 121, None)],
        aside=[(SR, 109, SR_WHY), (ATK, 113, 'another form: whole pecans, chopped after')],
        note='Whole pecans weigh 99 to 114 g a cup.',
        first=113),
    'peanut-butter': dict(
        method='packed and leveled', basis='weighed',
        counted=[(FF, 258, 'one cup weighed, 2013'), (ATK, 255, None), (KA, 270, None)],
        aside=[(U69, 251, 'another method: spooned, not packed'), ('Jif label', 264, LABEL),
               (SR, 258, "the same weighing as Foundation Foods'"),
               (FBG, 251, "one figure for every nut and seed butter: USDA's 1969 spooned cup")],
        note="USDA's 1969 cups, spooned rather than packed, weighed 251 g.",
        first=258),
    'eggs': dict(
        method='beaten, poured to the line', basis='density',
        counted=[('Azahra and others (2022)', 243, 'liquid whole egg, measured')],
        aside=[('Atilgan and Unluturk (2008)', 244, 'could not be read: quoted by Azahra and others'),
               (FBG, 241, 'a quart of eggs filled by hand'), (SR, 243, SR_WHY)],
        note="Whole eggs measured out of the shell weigh more: USDA's 1969 cups 251 g; five large eggs, about 250 g.",
        first=243),
}

# The figure each liquid takes within its references, and why (cooking-2.md, "Liquids").
LIQUID = {
    'vegetable-oil': 217, 'olive-oil': 216, 'milk': 244, 'heavy-cream': 237, 'water': 236,
    'honey': 336, 'maple-syrup': 314, 'molasses': 332, 'eggs': 243,
}


def middle(grams):
    """A source's figure for the median: a range counts at its middle."""
    return (grams[0] + grams[1]) / 2 if isinstance(grams, tuple) else grams


def to_gram(value):
    """Rounded to the gram, a half to the even gram (ISO 80000-1)."""
    return int(Decimal(str(value)).quantize(Decimal(1), rounding=ROUND_HALF_EVEN))


def decide(counted):
    """The rule: the median of the counted weighings; with fewer than three, USDA's measured cups'
    figure where they weighed it."""
    if len(counted) < 3:
        usda = [middle(grams) for by, grams, *_ in counted if by == U69]
        if usda:
            return to_gram(usda[0])
    values = sorted(middle(grams) for _, grams, *_ in counted)
    n = len(values)
    median = values[n // 2] if n % 2 else (values[n // 2 - 1] + values[n // 2]) / 2
    return to_gram(median)


def spread(counted):
    lows = [grams[0] if isinstance(grams, tuple) else grams for _, grams, *_ in counted]
    highs = [grams[1] if isinstance(grams, tuple) else grams for _, grams, *_ in counted]
    return min(lows), max(highs)


def figure(ident):
    entry = FIGURES[ident]
    if entry['basis'] == 'density':
        grams = LIQUID[ident]
        low, high = spread(entry['counted'])
        assert low <= grams <= high, ident
        return grams
    return decide(entry['counted'])


def against_usda(ident):
    """How far the figure sits from USDA's measured cup, in USDA's own standard deviations, where
    USDA weighed the cup and reported one; None otherwise."""
    entry = FIGURES[ident]
    for by, grams, *rest in entry['counted']:
        if by == U69 and len(rest) == 2:
            return (middle(grams), rest[1], (figure(ident) - middle(grams)) / rest[1])
    return None


for _ident in FIGURES:
    figure(_ident)
    _check = against_usda(_ident)
    assert _check is None or abs(_check[2]) <= 2, (_ident, _check)
