import type { SKETCHBOOK_TIMING } from '../../lib/timing';
import type { Mood } from './burst';

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
  | 'math'
  | 'kin';

export interface Family {
  id: FamilyId;
  name: string;
  /** What the family is, for the lab's sheet. */
  blurb: string;
}

/** The rounds of sketches: the logo canvas's, then two drawn for the sketchbook (2026-10-15). */
export type Round = 1 | 2 | 3;

export interface Sketch {
  id: string;
  /** What a screen reader says for its tile. */
  name: string;
  family: FamilyId;
  round: Round;
}

export const FAMILIES: readonly Family[] = [
  { id: 'refined', name: 'Refined', blurb: 'The first mark, evolved. R6 is the mark.' },
  { id: 'abstract', name: 'Abstract', blurb: 'Shapes stepping down in size.' },
  { id: 'bold', name: 'Bold', blurb: 'Black and yellow, loud.' },
  { id: 'unique', name: 'Unique', blurb: 'Things that hold a big and a small.' },
  { id: 'fun', name: 'Fun', blurb: 'Characters and scenes.' },
  { id: 'measures', name: 'Measures', blurb: 'Tools that measure, big and small.' },
  { id: 'creatures', name: 'Creatures', blurb: 'A big animal and a small one.' },
  { id: 'outdoors', name: 'Outdoors', blurb: 'Big and small, outside.' },
  { id: 'seasons', name: 'Seasons', blurb: 'One for each time of year.' },
  { id: 'geometry', name: 'Geometry', blurb: 'Patterns from big to small.' },
  { id: 'math', name: 'Math', blurb: 'Calculus and friends, on a chalkboard.' },
  { id: 'kin', name: 'Kin', blurb: 'The mark’s own family.' },
];

/**
 * A round's sketches in a family, numbered from its letter in the order given, from `first`: r1,
 * r2 … , then a later round's on from where the family left off.
 */
const family = (
  id: FamilyId,
  letter: string,
  round: Round,
  names: readonly string[],
  first = 1,
): Sketch[] =>
  names.map((name, index) => ({ id: `${letter}${first + index}`, name, family: id, round }));

export const SKETCHES: readonly Sketch[] = [
  ...family('refined', 'r', 1, [
    'Side by side',
    'On a line',
    'Ring and dot',
    'A bite',
    'Orbit',
    'In front',
  ]),
  ...family('abstract', 'a', 1, ['Two squares', 'Ratio', 'Zoom', 'Ramp', 'Every size', 'Nested']),
  ...family('bold', 'b', 1, [
    'Big b, small s',
    'Equals',
    'Quarter and dot',
    'Steps down',
    'Small inside big',
    'Poster',
  ]),
  ...family('unique', 'u', 1, [
    'Nesting dolls',
    'Balance',
    'Lens',
    'To the power of small',
    'Measuring cups',
    'Seed and tree',
  ]),
  ...family('fun', 'f', 1, [
    'Buddies',
    'Snowman',
    'Planet and moon',
    'Big fish, little fish',
    'Peas in a pod',
    'Bounce',
  ]),
  ...family('measures', 'm', 2, [
    'Hour and minute',
    'Ruler',
    'Cup and teaspoon',
    'Kilo and gram',
    'Gauge',
    'Tape measure',
  ]),
  ...family('creatures', 'c', 2, [
    'Cat and kitten',
    'Whale and minnow',
    'Duck and duckling',
    'Bear and cub',
    'Elephant and mouse',
    'Hen and chick',
  ]),
  ...family('outdoors', 'o', 2, [
    'Sun and moon',
    'Mountain and pebble',
    'Balloons',
    'Cloud and drop',
    'Leaf and ladybug',
    'Pines',
  ]),
  ...family('seasons', 's', 2, ['Pumpkins', 'Gifts', 'Hearts', 'Eggs', 'Ice cream', 'Snowflakes']),
  ...family('geometry', 'g', 2, [
    'Golden spiral',
    'Halftone',
    'Thick to thin',
    'A slice',
    'Tunnel',
    'One small',
  ]),
  ...family('kin', 'k', 2, [
    'Squares in front',
    'Three in front',
    'Night',
    'Line',
    'Eclipse',
    'Mint',
  ]),
  ...family('abstract', 'a', 3, ['Venn', 'Ripples', 'Morse'], 7),
  ...family('fun', 'f', 3, ['Robots', 'Dice', 'UFO and cow'], 7),
  ...family('measures', 'm', 3, ['Thermometer', 'Hourglass', 'Protractor'], 7),
  ...family('creatures', 'c', 3, ['Frog and tadpole', 'Owl and owlet', 'Penguin and chick'], 7),
  ...family('outdoors', 'o', 3, ['Oak and acorn', 'Mushrooms', 'Cactus'], 7),
  ...family('seasons', 's', 3, ['Watermelon', 'Umbrella', 'Autumn leaves'], 7),
  ...family('geometry', 'g', 3, ['Hexagons', 'Cubes', 'Packed circles'], 7),
  ...family('math', 'x', 3, [
    'Area under a curve',
    'Riemann sum',
    'Tangent',
    'Infinity and epsilon',
    'Sierpinski',
    'Limit',
  ]),
];

export const SKETCH_BY_ID: ReadonlyMap<string, Sketch> = new Map(
  SKETCHES.map((sketch) => [sketch.id, sketch]),
);

/**
 * The grid's first sketches, before any play: the mark in the middle of the shipped row of three,
 * so it shows first, under reduced motion too (Sean, 2026-10-15), among sketches from the other
 * families, light and dark tiles in turn. The rest of the set follows in the catalog's order.
 */
export const START: readonly string[] = [
  'c1',
  'r6',
  'o3',
  'b5',
  's3',
  'u1',
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
 * (frames.ts), and Flap folds like a split-flap board's card. The rest move, Doors on pieces of
 * the tile like Flap.
 */
export const SKETCH_EFFECTS = [
  'glitch',
  'scramble',
  'flap',
  'scan',
  'dive',
  'blinds',
  'doors',
  'drop',
  'squash',
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
 * The changes that reach past the tile: Glitch's bands, shifted across the gap and into the next
 * tile; Blur's halo; Flip's and Tumble's near edge swinging toward the viewer; Flap's halves
 * falling; Squash's bounce above its base. The tile lets them out while they run (`data-reach`,
 * Sketchbook.tsx) and clips every other change, which never leaves it anyway. A trial in two steps
 * (Sean, 2026-10-17: the reach gave the tiles dimension, Glitch's most of all): the turns and
 * Squash first, whole layers under a transform; then Glitch and Blur, since the slivers an iPhone
 * kept in the gap were Glitch's bands left outside as a change ended, and the bands now come back
 * inside before it ends (frames.ts, `envelope`). His phone judges; a sliver puts Glitch back in.
 */
export const REACHING_EFFECTS: ReadonlySet<SketchEffect> = new Set([
  'glitch',
  'blur',
  'flip',
  'tumble',
  'flap',
  'squash',
]);

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

/** The order the tiles change in on Flip. */
export const WAVES = ['diagonal', 'rows', 'center', 'random'] as const;
export type Wave = (typeof WAVES)[number];

export interface SketchbookTuning {
  /** One effect for every change, or a different one each time. */
  effect: SketchEffect | 'mixed';
  easing: SketchEasing;
  /** How far a glitch shifts its slices and splits its edges, 0 to 1. */
  strength: number;
  /** How the Flip button answers a press: a mood of particles, or any, a new one each press. */
  particles: Mood | 'any';
  wave: Wave;
  /** Hovering keeps a tile changing until the pointer leaves; off, a hover changes it once. */
  cycle: boolean;
  /** The grid flips once as the page opens. */
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

/**
 * The settings Sean tuned in the lab and shipped on the About page (v3, 2026-10-15), every sketch
 * in the rotation, so one added later joins it.
 */
export const SKETCHBOOK_TUNING: SketchbookTuning = {
  effect: 'mixed',
  easing: 'ease',
  strength: 1,
  particles: 'any',
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
 * When each tile starts in a flip, in waves: tiles with the same rank start together, a wave
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
