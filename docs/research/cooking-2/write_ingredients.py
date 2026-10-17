"""Writes packages/core/src/units/ingredients.ts from the decided figures (figures.py), keeping
each ingredient's id, name, kind, aliases, and counted unit as they are. Run Prettier after.

usage: python -I write_ingredients.py <this folder>
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, sys.argv[1])
from figures import FIGURES, figure, spread  # noqa: E402

ROOT = pathlib.Path('C:/Users/seanr/Projects/bigsmall')
p = ROOT / 'packages/core/src/units/ingredients.ts'
s = p.read_text(encoding='utf-8')

head, rest = s.split('export const ingredients: readonly Ingredient[] = [\n', 1)
body, tail = rest.rsplit('];', 1)
entries = re.findall(r"(  // [^\n]*\n)?(  \{\n    id: '[^']+',.*?\n  \},\n)", body, flags=re.S)
assert len(entries) == 34, len(entries)


def ts(value):
    """A TypeScript string literal, single-quoted where it can be."""
    if "'" not in value:
        return "'" + value.replace('\\', '\\\\') + "'"
    return json.dumps(value, ensure_ascii=False)


def source(by, grams, detail):
    figure_ = f'[{grams[0]}, {grams[1]}]' if isinstance(grams, tuple) else f'{grams}'
    parts = [f'by: {ts(by)}', f'grams: {figure_}'] + ([f'detail: {ts(detail)}'] if detail else [])
    return '{ ' + ', '.join(parts) + ' }'


out = []
for comment, entry in entries:
    ident = re.search(r"id: '([^']+)'", entry).group(1)
    name = re.search(r"\n    name: ('[^']*'|\"[^\"]*\"),\n", entry).group(1)
    kind = re.search(r"\n    kind: '([^']+)',\n", entry).group(1)
    aliases = re.search(r"\n    aliases: (\[.*?\]),\n", entry, flags=re.S).group(1)
    counted = re.search(r"\n    counted: '([^']+)',\n", entry)
    decided = FIGURES[ident]
    low, high = spread(decided['counted'])
    lines = [
        '  {',
        f"    id: '{ident}',",
        f'    name: {name},',
        f"    kind: '{kind}',",
        f'    aliases: {aliases},',
        f'    gramsPerCup: {figure(ident)},',
        f"    method: {ts(decided['method'])},",
        f'    range: [{low}, {high}],',
    ]
    if decided['basis'] == 'density':
        lines.append('    byDensity: true,')
    lines.append('    sources: [')
    lines += [f'      {source(*each)},' for each in decided['counted']]
    lines.append('    ],')
    if decided['note']:
        lines.append(f"    note: {ts(decided['note'])},")
    if counted:
        lines.append(f"    counted: '{counted.group(1)}',")
    lines.append('  },')
    out.append((comment or '') + '\n'.join(lines) + '\n')

head = re.sub(
    r'/\*\*\n \* The ingredients Cooking converts through.*?\*/\n',
    """/**
 * The ingredients Cooking converts through (ADR 0021): the baking staples, each with the weight of
 * one US customary cup filled the way US recipes mean it (`method`), decided by one rule from the
 * weighings that count (docs/research/cooking-2.md, 2026-10-16): their median, or with fewer than
 * three USDA's measured cups. A liquid's cup is its density times the cup (`byDensity`). Densities
 * are measured, never exact: the table marks what crosses with ≈.
 */
""",
    head,
    count=1,
    flags=re.S,
)
p.write_bytes((head + 'export const ingredients: readonly Ingredient[] = [\n' + ''.join(out) + '];' + tail).encode('utf-8'))
print('ok', len(out))
