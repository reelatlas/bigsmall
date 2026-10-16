import type { SKETCHBOOK_TIMING } from '../../lib/timing';

/**
 * The sketchbook (docs/UX-SPEC.md §1, the About page): the logo sketches from the logo canvas's
 * rounds, each a big thing and a small one on a 32-unit tile, played as the About page's easter
 * egg and tuned in /dev/sketchbook-lab. The art is one file per sketch in
 * src/assets/sketchbook/<id>.svg, in colors of its own like the brand assets, so the token guard
 * does not reach it (docs/DESIGN-SYSTEM.md, "The sketchbook"); SketchSprite.astro sets every
 * sketch on the page once, and a tile shows one by its id. Pure; tested in node.
 */

export type FamilyId =
  | 'refined'
  | 'abstract'
  | 'bold'
  | 'unique'
  | 'fun'
  | 'measures'
  | 'creatures'
  | 'outdoors'
  | 'seasons'
  | 'geometry'
  | 'kin';

export interface Family {
  id: FamilyId;
  name: string;
  /** The logo canvas's round it came from (Sean chose R6 from round 1 on 2026-10-15). */
  round: 1 | 2;
  /** What the family is, for the lab's sheet. */
  blurb: string;
}

export interface Sketch {
  id: string;
  /** What a screen reader says for its tile. */
  name: string;
  family: FamilyId;
}

export const FAMILIES: readonly Family[] = [
  { id: 'refined', name: 'Refined', round: 1, blurb: 'The first mark, evolved. R6 is the mark.' },
  { id: 'abstract', name: 'Abstract', round: 1, blurb: 'Shapes stepping down in size.' },
  { id: 'bold', name: 'Bold', round: 1, blurb: 'Black and yellow, loud.' },
  { id: 'unique', name: 'Unique', round: 1, blurb: 'Things that hold a big and a small.' },
  { id: 'fun', name: 'Fun', round: 1, blurb: 'Characters and scenes.' },
  { id: 'measures', name: 'Measures', round: 2, blurb: 'Tools that measure, big and small.' },
  { id: 'creatures', name: 'Creatures', round: 2, blurb: 'A big animal and a small one.' },
  { id: 'outdoors', name: 'Outdoors', round: 2, blurb: 'Big and small, outside.' },
  { id: 'seasons', name: 'Seasons', round: 2, blurb: 'One for each time of year.' },
  { id: 'geometry', name: 'Geometry', round: 2, blurb: 'Patterns from big to small.' },
  { id: 'kin', name: 'Kin', round: 2, blurb: 'The mark’s own family.' },
];

/** A family's sketches, numbered from its letter in the order given: r1, r2 … */
const family = (id: FamilyId, letter: string, names: readonly string[]): Sketch[] =>
  names.map((name, index) => ({ id: `${letter}${index + 1}`, name, family: id }));

export const SKETCHES: readonly Sketch[] = [
  ...family('refined', 'r', [
    'Side by side',
    'On a line',
    'Ring and dot',
    'A bite',
    'Orbit',
    'In front',
  ]),
  ...family('abstract', 'a', ['Two squares', 'Ratio', 'Zoom', 'Ramp', 'Every size', 'Nested']),
  ...family('bold', 'b', [
    'Big b, small s',
    'Equals',
    'Quarter and dot',
    'Steps down',
    'Small inside big',
    'Poster',
  ]),
  ...family('unique', 'u', [
    'Nesting dolls',
    'Balance',
    'Lens',
    'To the power of small',
    'Measuring cups',
    'Seed and tree',
  ]),
  ...family('fun', 'f', [
    'Buddies',
    'Snowman',
    'Planet and moon',
    'Big fish, little fish',
    'Peas in a pod',
    'Bounce',
  ]),
  ...family('measures', 'm', [
    'Hour and minute',
    'Ruler',
    'Cup and teaspoon',
    'Kilo and gram',
    'Gauge',
    'Tape measure',
  ]),
  ...family('creatures', 'c', [
    'Cat and kitten',
    'Whale and minnow',
    'Duck and duckling',
    'Bear and cub',
    'Elephant and mouse',
    'Hen and chick',
  ]),
  ...family('outdoors', 'o', [
    'Sun and moon',
    'Mountain and pebble',
    'Balloons',
    'Cloud and drop',
    'Leaf and ladybug',
    'Pines',
  ]),
  ...family('seasons', 's', ['Pumpkins', 'Gifts', 'Hearts', 'Eggs', 'Ice cream', 'Snowflakes']),
  ...family('geometry', 'g', [
    'Golden spiral',
    'Halftone',
    'Thick to thin',
    'A slice',
    'Tunnel',
    'One small',
  ]),
  ...family('kin', 'k', ['Squares in front', 'Three in front', 'Night', 'Line', 'Eclipse', 'Mint']),
];

export const SKETCH_BY_ID: ReadonlyMap<string, Sketch> = new Map(
  SKETCHES.map((sketch) => [sketch.id, sketch]),
);

/**
 * The grid's first sketches, before any play: the mark near the middle of the default grid, four
 * by three, among sketches from the other families, light and dark tiles in turn. The rest of the
 * set follows in the catalog's order.
 */
export const START: readonly string[] = [
  'c1',
  'u1',
  'o3',
  'b5',
  's3',
  'r6',
  'm1',
  'g1',
  'f3',
  'c3',
  'a6',
  'o5',
];

/**
 * How a tile changes from one sketch to the next. The first four echo the name at play (Sean,
 * 2026-10-15): Glitch, Scramble, and Scan step frame by frame like its split-flap letters
 * (frames.ts), and Flap folds like a split-flap board's card. The rest move.
 */
export const SKETCH_EFFECTS = [
  'glitch',
  'scramble',
  'flap',
  'scan',
  'flip',
  'tumble',
  'pop',
  'slide',
  'iris',
  'blur',
  'spin',
  'fade',
] as const;
export type SketchEffect = (typeof SKETCH_EFFECTS)[number];

/** The effects that step frame by frame, at frameMs, rather than move on a curve. */
export const STEPPED_EFFECTS: ReadonlySet<SketchEffect> = new Set(['glitch', 'scramble', 'scan']);

/**
 * The curve a moving change or a flap follows: the theme's own (`--motion-ease`), its glide
 * (`--motion-glide`), or a spring that overshoots and settles (SPRING_EASING). The stepped
 * effects keep their frames' even pace.
 */
export const SKETCH_EASINGS = ['ease', 'glide', 'spring'] as const;
export type SketchEasing = (typeof SKETCH_EASINGS)[number];

/**
 * A spring, the one curve here no theme has: tried in the lab first; if it ships, it becomes a
 * motion token in every theme (docs/DESIGN-SYSTEM.md, "Motion").
 */
export const SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/** The order the tiles change in on Shuffle. */
export const WAVES = ['diagonal', 'rows', 'center', 'random'] as const;
export type Wave = (typeof WAVES)[number];

export interface SketchbookTuning {
  /** One effect for every change, or a different one each time. */
  effect: SketchEffect | 'mixed';
  easing: SketchEasing;
  /** How far a glitch shifts its slices and splits its edges, 0 to 1. */
  strength: number;
  wave: Wave;
  /** Hovering keeps a tile changing until the pointer leaves; off, a hover changes it once. */
  cycle: boolean;
  /** The grid shuffles once as the page opens. */
  intro: boolean;
  /** The sketches come shuffled, or in the catalog's order, family by family. */
  order: 'shuffled' | 'catalog';
  columns: number;
  rows: number;
  /** The largest a tile grows, and the room between tiles, in steps of the spacing scale (4 px). */
  tile: number;
  gap: number;
  /** The sketches in the rotation, by id. */
  set: readonly string[];
}

/** The settings the sketchbook plays by: these, or the lab's live copies. */
export interface SketchbookSettings {
  timing: Record<keyof typeof SKETCHBOOK_TIMING, number>;
  tuning: SketchbookTuning;
}

/** The settings Sean tuned in the lab and shipped on the About page (2026-10-15). */
export const SKETCHBOOK_TUNING: SketchbookTuning = {
  effect: 'mixed',
  easing: 'ease',
  strength: 1,
  wave: 'random',
  cycle: false,
  intro: true,
  order: 'shuffled',
  columns: 3,
  rows: 1,
  tile: 32,
  gap: 4,
  set: SKETCHES.map(({ id }) => id),
};

/** The tile's corner, as the art draws it: 7 of its 32 units. */
export const TILE_CORNER = `${(7 / 32) * 100}%`;

/** The sketches in the set, in START's order and then the catalog's. */
export function inOrder(set: readonly string[]): string[] {
  const wanted = new Set(set.filter((id) => SKETCH_BY_ID.has(id)));
  const first = START.filter((id) => wanted.has(id));
  const rest = SKETCHES.map(({ id }) => id).filter((id) => wanted.has(id) && !first.includes(id));
  return [...first, ...rest];
}

/** The grid's first `count` sketches: the set in order, repeated when it is smaller than the grid. */
export function startingSketches(set: readonly string[], count: number): string[] {
  const ordered = inOrder(set);
  if (ordered.length === 0) return [];
  return Array.from({ length: count }, (_, index) => ordered[index % ordered.length]!);
}

/** The items in a random order (Fisher–Yates), the list itself left as it was. */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const order = [...items];
  for (let index = order.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [order[index], order[other]] = [order[other]!, order[index]!];
  }
  return order;
}

/** The set as a deck to draw from: shuffled, or in the catalog's order. */
export function deckOf(
  set: readonly string[],
  order: SketchbookTuning['order'],
  random: () => number,
): string[] {
  const ids = SKETCHES.map(({ id }) => id).filter((id) => set.includes(id));
  return order === 'catalog' ? ids : shuffle(ids, random);
}

/**
 * Takes the next sketch from `deck` that is not showing, refilling the deck from the set when it
 * runs out, so every sketch shows before any comes back. When everything in the set is showing,
 * a sketch other than the tile's own. Null when the set is empty.
 */
export function draw(
  deck: string[],
  refill: () => string[],
  showing: ReadonlySet<string>,
  own: string | undefined,
): string | null {
  for (let pass = 0; pass < 2; pass++) {
    const index = deck.findIndex((id) => !showing.has(id));
    if (index >= 0) return deck.splice(index, 1)[0]!;
    deck.splice(0, deck.length, ...refill());
  }
  return deck.find((id) => id !== own) ?? deck[0] ?? null;
}

/**
 * When each tile starts in a shuffle, in waves: tiles with the same rank start together, a wave
 * step apart. Diagonal sweeps from the top left corner, rows read like a page, center ripples
 * out from the middle, and random starts them in any order.
 */
export function waveRanks(
  wave: Wave,
  count: number,
  columns: number,
  random: () => number,
): number[] {
  const rows = Math.ceil(count / columns);
  const place = (index: number) => ({ row: Math.floor(index / columns), column: index % columns });
  const indices = Array.from({ length: count }, (_, index) => index);
  switch (wave) {
    case 'rows':
      return indices;
    case 'diagonal':
      return indices.map((index) => place(index).row + place(index).column);
    case 'center':
      return indices.map((index) => {
        const { row, column } = place(index);
        return Math.hypot(row - (rows - 1) / 2, column - (columns - 1) / 2);
      });
    case 'random': {
      const order = shuffle(indices, random);
      return indices.map((index) => order.indexOf(index));
    }
  }
}
