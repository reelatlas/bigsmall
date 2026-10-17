"""USDA FoodData Central, FNDDS (survey) and Foundation Foods: each candidate food for an ingredient,
and its household portions by volume (cup, tablespoon, teaspoon, fluid ounce), with grams per US cup.

usage: python -I usda_portions.py <zip> <dataset label>
"""
import csv
import io
import re
import sys
import zipfile
from collections import defaultdict

zip_path, label = sys.argv[1], sys.argv[2]
z = zipfile.ZipFile(zip_path)
root = z.namelist()[0].split('/')[0]


def rows(name):
    with z.open(f'{root}/{name}') as raw:
        yield from csv.DictReader(io.TextIOWrapper(raw, encoding='utf-8'))


# Each ingredient, the description patterns that find its foods (case-insensitive).
PATTERNS = {
    'all-purpose-flour': [r'flour.*(white|all.purpose)', r'all.purpose.*flour'],
    'bread-flour': [r'flour.*bread', r'bread flour'],
    'whole-wheat-flour': [r'flour.*whole', r'whole.wheat flour', r'wheat flour, whole'],
    'cake-flour': [r'flour.*cake', r'cake flour'],
    'almond-flour': [r'almond.*(flour|meal|ground)', r'flour, almond'],
    'granulated-sugar': [r'^sugars?, (white|granulated)', r'sugar, white', r'granulated'],
    'brown-sugar': [r'sugars?, brown', r'brown sugar'],
    'powdered-sugar': [r'sugars?, powdered', r'powdered sugar', r'confectioner'],
    'butter': [r'^butter'],
    'vegetable-oil': [r'^oil, (canola|vegetable|soybean)', r'canola oil', r'vegetable oil'],
    'olive-oil': [r'oil, olive', r'olive oil'],
    'shortening': [r'shortening'],
    'milk': [r'^milk, whole', r'milk, (whole|3\.25)'],
    'heavy-cream': [r'cream, (heavy|fluid, heavy)', r'heavy cream', r'whipping cream'],
    'sour-cream': [r'sour cream', r'cream, sour'],
    'yogurt': [r'yogurt.*(plain|whole)', r'^yogurt, plain'],
    'shredded-cheddar': [r'cheese, cheddar', r'cheddar cheese'],
    'water': [r'^water', r'beverages, water'],
    'honey': [r'^honey'],
    'maple-syrup': [r'maple syrup', r'syrups?, maple'],
    'molasses': [r'molasses'],
    'cocoa-powder': [r'cocoa.*powder', r'cocoa, dry'],
    'rolled-oats': [r'oats', r'oatmeal, (dry|uncooked)', r'cereals, oats'],
    'white-rice': [r'rice, white.*(raw|uncooked|dry)'],
    'cornstarch': [r'cornstarch', r'corn starch'],
    'baking-soda': [r'baking soda'],
    'baking-powder': [r'baking powder'],
    'table-salt': [r'^salt, table', r'table salt'],
    'active-dry-yeast': [r'yeast'],
    'chocolate-chips': [r'chocolate.*chips', r'semisweet chocolate', r'chips, chocolate'],
    'chopped-walnuts': [r'walnuts'],
    'chopped-pecans': [r'pecans'],
    'peanut-butter': [r'peanut butter'],
    'eggs': [r'^egg, whole', r'^eggs?, (whole|raw)'],
}
COMPILED = {key: [re.compile(p, re.I) for p in pats] for key, pats in PATTERNS.items()}

units = {r['id']: r['name'] for r in rows('measure_unit.csv')}
foods = {r['fdc_id']: r['description'] for r in rows('food.csv')}
portions = defaultdict(list)
for r in rows('food_portion.csv'):
    portions[r['fdc_id']].append(r)

CUP = {'cup': 1, 'tablespoon': 1 / 16, 'tbsp': 1 / 16, 'teaspoon': 1 / 48, 'tsp': 1 / 48, 'fl oz': 1 / 8}
VOLUME = re.compile(r'\b(cup|tablespoon|tbsp|teaspoon|tsp|fl oz)s?\b', re.I)


def cups_of(text, amount):
    """How many US cups a portion is, from its words and amount, or None."""
    m = VOLUME.search(text)
    if not m:
        return None
    word = m.group(1).lower()
    if word in ('tablespoon', 'tbsp'):
        each = 1 / 16
    elif word in ('teaspoon', 'tsp'):
        each = 1 / 48
    elif word == 'fl oz':
        each = 1 / 8
    else:
        each = 1
    try:
        n = float(amount) if amount not in ('', None) else 1.0
    except ValueError:
        n = 1.0
    return n * each


print(f'# {label}: {zip_path}')
for key, pats in COMPILED.items():
    print(f'\n## {key}')
    for fdc_id, description in foods.items():
        if not any(p.search(description) for p in pats):
            continue
        shown = []
        for p in portions.get(fdc_id, []):
            unit = units.get(p['measure_unit_id'], '')
            words = ' '.join(x for x in [unit if unit != 'undetermined' else '', p.get('portion_description', ''), p.get('modifier', '')] if x)
            cups = cups_of(words, p.get('amount'))
            if not cups:
                continue
            grams = float(p['gram_weight'])
            shown.append(f"{p.get('amount') or ''} {words} = {grams:g} g -> {grams / cups:.1f} g/cup")
        if shown:
            print(f'- {fdc_id} {description}')
            for line in shown:
                print(f'    {line}')
