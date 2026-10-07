/**
 * The header's wordmark at play (docs/UX-SPEC.md §1, "The wordmark at play"): what "bigsmall" can
 * turn into, how often each kind comes up, and the split-flap frames between one phrase and the
 * next. Pure, so the variety and the frame math are unit-tested; lib/wordmark-motion.ts
 * puts it on the page, and /dev/wordmark-lab tunes it. Every figure is a standard or published
 * value (SI, CODATA, NIST, the IAU's nominal solar values); the wordplay is ours (ADR 0004).
 */

import { WORDMARK_SIZES, type WordmarkSize } from './recipes';

export const WORDMARK = 'bigsmall';

/** Groups digits in long numbers ("299_792_458" in a list): narrow, and never broken across lines. */
const DIGIT_GROUP = String.fromCharCode(0x202f);

const list = (items: string) => items.split('|').map((item) => item.replaceAll('_', DIGIT_GROUP));

/** Stand-ins for "big", shown before "small". */
const BIG = list(
  '∞|10⁹|10¹⁰⁰|Σ|ly|AU|pc|Mpc|TB|GW|ton|km|mi|MAX|XL|XXL|huge|vast|giga|mega|tera|peta|yotta|Ω|≥|»|▲|↑',
);
/** Stand-ins for "small", shown after "big". */
const SMALL = list(
  'µm|nm|Å|fm|ε|10⁻⁹|mg|µs|ns|bit|dx|δ|atom|tiny|wee|mini|xs|nano|pico|milli|femto|yocto|quark|·|◦|«|≤|▼|↓',
);
/** Letters of the name and what each can pass for. */
const LOOKALIKES: Readonly<Record<string, string>> = {
  b: 'β6',
  i: 'ι1!ı',
  g: '9γ',
  s: '5σ$∫§',
  m: 'µ',
  a: 'α4∂@',
  l: 'ℓ1λ|',
};
/** Opposites in place of both halves, written as they show. */
const PAIRS = list(
  'giganano|kilomilli|megamicro|terapico|petafemto|yottayocto|exa:atto|maximini|MACROmicro|BIGsmall|bigSMALL|' +
    'maxmin|∞0|▲▼|↑↓|≫≪|+−|●·|■▪|Oo|km:mm|TB:bit|GW:mW|yr:ns|ton:mg|mile:inch|XL:xs|vast:tiny|hot:cold|far:near|' +
    'loud:quiet|heavy:light',
);
/** Something big to something small, as big is to small. */
const ANALOGIES = list(
  'whale:krill|ocean:drop|galaxy:quark|sun:atom|universe:atom|oak:acorn|redwood:seed|sequoia:sprout|' +
    'baobab:bonsai|mountain:pebble|Everest:anthill|boulder:grain|dune:grain|elephant:ant|moose:mouse|hippo:flea|' +
    'bison:beetle|mammoth:mite|condor:gnat|shark:minnow|kraken:krill|dragon:dragonfly|lion:kitten|Goliath:David|' +
    'Jupiter:Pluto|planet:pea|moon:marble|quasar:quark|nebula:neutron|tuba:piccolo|epic:haiku|feast:crumb|' +
    'pumpkin:pea|melon:seed|bonfire:spark|volcano:candle|avalanche:flake|glacier:snowflake|iceberg:ice cube|' +
    'tsunami:ripple|storm:drizzle|thunder:whisper|roar:squeak|Pacific:puddle|river:trickle|forest:leaf|' +
    'canyon:crack|cathedral:brick|stadium:seat|blimp:bubble|mansion:mousehole|marathon:step|century:second|' +
    'light-year:inch|mountain:molehill|metropolis:hamlet|castle:sandcastle|jumbo jet:kite|galleon:raft|' +
    'orca:guppy|rhino:tick|giraffe:gecko|organ:kazoo|symphony:hum|saga:limerick|banquet:snack|star:ember|' +
    'sea:sip|giant:pixie',
);
/** Idioms of size and measure. */
const IDIOMS = list(
  'big fish, small pond|drop in the ocean|tip of the iceberg|needle in a haystack|a stone’s throw|' +
    'light-years ahead|by a mile|inch by inch|give an inch|the whole 9 yards|every ounce|pound for pound|' +
    'a hair’s breadth|a split second|in a nanosecond|pint-sized|byte-sized|bit by bit|little by little|' +
    'baby steps|giant leap|small world|small talk|small fry|small potatoes|small print|think big|big picture|' +
    'big deal|big bang|big shot|less is more|tiny but mighty|larger than life|tall order|short and sweet|' +
    'jumbo shrimp|ohm sweet ohm|watt’s up|minute details|second to none|tons of fun',
);
/** Laws and identities of physics and mathematics. */
const EQUATIONS = list(
  'E = mc²|F = ma|PV = nRT|a² + b² = c²|e^iπ + 1 = 0|F = Gm₁m₂/r²|v = d/t|p = mv|V = IR|P = IV|P = I²R|' +
    'λ = c/f|v = fλ|ΔS ≥ 0|KE = ½mv²|W = Fd|ρ = m/V|E = hf|λ = h/p|F = −kx|s = ½at²|Δx·Δp ≥ ℏ/2|S = k ln W|' +
    'T² ∝ a³|F = qvB|Q = mcΔT|P = F/A|P = ρgh|F = ρgV|τ = r × F|L = Iω|ω = 2πf|g = GM/r²|n = c/v|j = σT⁴|' +
    'ΔG = ΔH − TΔS|∇·B = 0|∇·E = ρ/ε₀|pH = −log[H⁺]|A = πr²|C = 2πr|V = 4πr³/3|i² = −1|φ² = φ + 1|' +
    '0.999… = 1|Σ2⁻ⁿ = 2|eˣ = Σxⁿ/n!|sin²θ + cos²θ = 1|E² = (pc)² + (mc²)²|1 + 1 = 10₂|g ≈ π² m/s²|' +
    'ζ(2) = π²/6|R = Nₐk|E = pc|v = √(2gh)|T = 2π√(L/g)|F = q(E + v × B)|c = 1/√(ε₀µ₀)|ΔE·Δt ≥ ℏ/2|' +
    'n₁ sin θ₁ = n₂ sin θ₂|∮B·dl = µ₀I|sin x ≈ x|eˣ ≈ 1 + x|(1 + 1/n)ⁿ → e|a = v²/r|ε = −dΦ/dt',
);
/** Constants of nature and of mathematics. */
const CONSTANTS = list(
  'c = 299_792_458 m/s|g ≈ 9.81 m/s²|h ≈ 6.626e−34 J·s|ℏ ≈ 1.055e−34 J·s|Nₐ ≈ 6.022e23|k ≈ 1.381e−23 J/K|' +
    'G ≈ 6.674e−11|R ≈ 8.314 J/mol·K|σ ≈ 5.670e−8|ε₀ ≈ 8.854e−12 F/m|qₑ ≈ 1.602e−19 C|mₑ ≈ 9.109e−31 kg|' +
    'mₚ ≈ 1.673e−27 kg|α ≈ 1/137|ℓₚ ≈ 1.616e−35 m|tₚ ≈ 5.391e−44 s|M☉ ≈ 1.988e30 kg|M⊕ ≈ 5.972e24 kg|' +
    'R⊕ ≈ 6371 km|CMB ≈ 2.725 K|sound ≈ 343 m/s|π ≈ 3.14159|τ = 2π|φ ≈ 1.618|e ≈ 2.71828|γ ≈ 0.5772|' +
    '√2 ≈ 1.41421|√3 ≈ 1.732|ln 2 ≈ 0.693|googol = 10¹⁰⁰|µ₀ ≈ 1.257e−6 N/A²|mₙ ≈ 1.675e−27 kg|' +
    'a₀ ≈ 5.292e−11 m|R∞ ≈ 1.097e7 m⁻¹|F ≈ 96_485 C/mol|Φ₀ ≈ 2.068e−15 Wb|Z₀ ≈ 376.7 Ω|b ≈ 2.898e−3 m·K|' +
    'kₑ ≈ 8.988e9 N·m²/C²|T☉ ≈ 5772 K|R☉ ≈ 695_700 km|L☉ ≈ 3.828e26 W|g☾ ≈ 1.62 m/s²|c ≈ 186_282 mi/s|' +
    'ℏc ≈ 197.3 MeV·fm|mₑc² ≈ 511 keV|t₀ ≈ 13.8 Gyr|v⊕ ≈ 29.8 km/s|d☾ ≈ 384_400 km',
);
/** Conversions, the site's own trade. */
const CONVERSIONS = list(
  '0 K = −273.15 °C|0 °C = 273.15 K|100 °C = 212 °F|−40 °C = −40 °F|37 °C = 98.6 °F|°F = °C × 9/5 + 32|' +
    '1 in = 2.54 cm|1 ft = 0.3048 m|1 ft = 12 in|1 yd = 3 ft|1 mi = 5280 ft|1 mi ≈ 1.609 km|1 km ≈ 0.621 mi|' +
    '1 m ≈ 3.281 ft|1 nmi = 1852 m|1 fur = 660 ft|1 fathom = 6 ft|1 lb ≈ 0.454 kg|1 kg ≈ 2.205 lb|' +
    '1 lb = 16 oz|1 oz ≈ 28.35 g|1 st = 14 lb|1 t = 1000 kg|1 ct = 200 mg|1 gr = 64.79891 mg|1 gal ≈ 3.785 L|' +
    '1 gal = 4 qt|1 qt ≈ 946 mL|1 cup ≈ 236.6 mL|1 fl oz ≈ 29.57 mL|1 tbsp = 3 tsp|1 L = 1000 cm³|' +
    '1 mL = 1 cm³|1 ha = 10_000 m²|1 acre ≈ 4047 m²|1 kn = 1.852 km/h|1 mph ≈ 1.609 km/h|1 km/h ≈ 0.278 m/s|' +
    '1 ly ≈ 9.461e15 m|1 AU ≈ 1.496e11 m|1 pc ≈ 3.26 ly|1 Å = 0.1 nm|1 µm = 1000 nm|1 B = 8 bit|' +
    '1 KiB = 1024 B|1 MiB = 1024 KiB|1 GB = 1000 MB|1 d = 86_400 s|1 h = 3600 s|1 wk = 604_800 s|' +
    '1 yr ≈ 3.156e7 s|1 atm = 101_325 Pa|1 bar = 100 kPa|1 psi ≈ 6.895 kPa|1 mmHg ≈ 133.3 Pa|1 cal = 4.184 J|' +
    '1 kWh = 3.6 MJ|1 BTU ≈ 1055 J|1 eV ≈ 1.602e−19 J|1 hp ≈ 745.7 W|1 N ≈ 0.2248 lbf|1 J = 1 N·m|' +
    '1 W = 1 J/s|1 rad ≈ 57.3°|360° = 2π rad|0 K = −459.67 °F|1 mi = 1760 yd|1 yd = 0.9144 m|' +
    '1 lb = 7000 gr|1 cup = 16 tbsp|1 pt = 2 cups|1 gal = 128 fl oz|1 ft² ≈ 0.0929 m²|1 m³ = 1000 L|' +
    '1 Mbps = 125 kB/s|1 mpg ≈ 0.425 km/L|1 lbf ≈ 4.448 N|1 MPa ≈ 145 psi|1 kcal = 4.184 kJ|' +
    '1 ly ≈ 63_241 AU|1 pc ≈ 206_265 AU|1 kn = 1 nmi/h',
);
/** Wordplay on the name itself. */
const NAME = list(
  'big > small|small < big|big ≫ small|big ≠ small|big ≈ small|small ⊂ big|big ∪ small|big ∩ small = ∅|' +
    'big ∝ 1/small|big → small|small → big|big ⇄ small|∑small = big|∫small = big|d(big) = small|' +
    'small × 10ⁿ = big|big ÷ 10ⁿ = small|f(big) = small|bigsmall²|√bigsmall|smallbig|llamsgib|big.small|' +
    'big/small|big..small|[big, small]|{big, small}|⟨big∣small⟩|‖big‖ > ‖small‖|<bigsmall/>|bigsmall()|' +
    'big && small|big ?? small|lim small→0|big → ∞|small → 0|Δbig/Δsmall|log(big)|small⁻¹|big!|big² ≫ small²|' +
    'BIGˢᵐᵃˡˡ|ᵇⁱᵍSMALL',
);
/** Text art. */
const ART = list(
  '▇▆▅▄▃▂▁|▁▂▃▄▅▆▇|▁▃▅▇▅▃▁|█▓▒░|░▒▓█|⣿⣶⣤⣀|●•·|■▪·|◉◎○|●●●···|■■□□|O o ·|oOo|◆◇◆◇|▲△▴▵|★☆✦✧|' +
    '≋≋≋≋≋≋|∿∿∿∿|big→→small|‹‹big››|›››small|◐◑◒◓|◴◵◶◷|◜◝◞◟|▏▎▍▌▋▊▉█|█▉▊▋▌▍▎▏|⣀⣤⣶⣿|⠁⠃⠇⡇⣇⣧⣷⣿|' +
    '∙∘○◯|◯○∘∙|·∙•●|◇◈◆|□▣■|❚❙❘|≫>›|‹<≪|O○◦·|Oo.oO|•○●○•|⋆✦★✦⋆|♩♪♫♬|⌢⌣⌢⌣|·:∴∷|▂▄▆█▆▄▂|' +
    'BIG ʙɪɢ ᴮᴵᴳ|kMGTPE|mµnpfa|10⁰ 10¹ 10²',
);
/** What the theme's art can flip to: a symbol or a short expression. */
export const ART_GLYPHS: readonly string[] = list(
  'π|∞|Σ|∫|Δ|λ|µ|Ω|φ|ℏ|∂|∇|√|≈|∝|±|÷|°|%|e|c²|x²|10ⁿ|n!|½|∅|⊂|≫|∴|∎|★|θ|ψ|σ|τ|ε|η|ω|Γ|Φ|Ψ|Λ|ℓ|' +
    'ℵ|∮|∏|⊗|⊕|≡|≠|∀|∃|⅓|¾|i²|2ⁿ|hν|mc²|dx',
);

/** The kinds of phrase, in the order the lab lists them. */
export const PHRASE_KINDS = [
  'big',
  'small',
  'both',
  'letters',
  'pairs',
  'analogies',
  'idioms',
  'equations',
  'constants',
  'conversions',
  'name',
  'art',
] as const;
export type PhraseKind = (typeof PHRASE_KINDS)[number];

/** The sizes of the wordmark's ladder (WORDMARK_SIZES) from the largest down to `smallest`. */
export function sizesDownTo(smallest: WordmarkSize): readonly WordmarkSize[] {
  return WORDMARK_SIZES.slice(0, WORDMARK_SIZES.indexOf(smallest) + 1);
}

/** One way to set a phrase: a type size, on one line or two. */
export interface FitStep {
  size: WordmarkSize;
  lines: 1 | 2;
}

/**
 * The ways a phrase is tried, best first: one line at each size down to `smallest`, and from
 * `twoLinesFrom` down, two lines at a size before one line at the next, so a long idiom or
 * constant stays legible rather than shrinking further. Null never sets two lines.
 */
export function fitSteps(smallest: WordmarkSize, twoLinesFrom: WordmarkSize | null): FitStep[] {
  const from = twoLinesFrom ? WORDMARK_SIZES.indexOf(twoLinesFrom) : Infinity;
  return sizesDownTo(smallest).flatMap((size, index): FitStep[] =>
    index >= from
      ? [
          { size, lines: 1 },
          { size, lines: 2 },
        ]
      : [{ size, lines: 1 }],
  );
}

/** The art's symbol steps down through these until it fits the art's square. */
export const ART_STEPS = fitSteps('text-base', null);

/** A phrase's two-line settings: broken at each space, or after a colon ("mansion:" over "mousehole"). */
export function lineBreaks(phrase: string): string[] {
  const options: string[] = [];
  for (let at = 1; at < phrase.length - 1; at += 1) {
    if (phrase[at] === ' ') options.push(`${phrase.slice(0, at)}\n${phrase.slice(at + 1)}`);
    else if (phrase[at - 1] === ':') options.push(`${phrase.slice(0, at)}\n${phrase.slice(at)}`);
  }
  return options;
}

/**
 * Everything about the play that is not a duration (those are WORDMARK_TIMING in lib/timing.ts).
 * /dev/wordmark-lab tunes both and copies them back here.
 */
export interface WordmarkTuning {
  /** How often each kind of phrase comes up, relative to the others. */
  mix: Record<PhraseKind, number>;
  /** How strongly pointer speed quickens the pace: pace = 1 / (1 + speed × gain). */
  gain: number;
  /** The share of the pointer's speed kept after each 60th of a second, so the pace eases back. */
  decay: number;
  /** How much a new speed reading counts against the speed so far. */
  response: number;
  /** The chance that the art flips to a symbol along with a phrase. */
  artAway: number;
  /** The chance that the art, showing a symbol, flips back to its drawing along with a phrase. */
  artBack: number;
  /** The smallest size a phrase may take. A phrase too long even here fails a browser test. */
  smallest: WordmarkSize;
  /** From this size down, a long phrase may take two lines before a smaller size; null never. */
  twoLinesFrom: WordmarkSize | null;
}

export const WORDMARK_TUNING: WordmarkTuning = {
  mix: {
    big: 8,
    small: 8,
    both: 6,
    letters: 10,
    pairs: 8,
    analogies: 18,
    idioms: 10,
    equations: 16,
    constants: 10,
    conversions: 13,
    name: 7,
    art: 9,
  },
  gain: 3.5,
  decay: 0.92,
  response: 0.4,
  artAway: 0.45,
  artBack: 0.5,
  smallest: 'text-sm',
  twoLinesFrom: 'text-base',
};

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]!;
}

/** The name with one to three letters swapped for a look-alike or a capital: "bιgσmall", "bigSmall". */
function letters(random: () => number): string {
  const glyphs = [...WORDMARK];
  const swaps = 1 + Math.floor(random() * 3);
  for (let n = 0; n < swaps; n += 1) {
    const at = Math.floor(random() * glyphs.length);
    const letter = WORDMARK[at]!;
    const options = LOOKALIKES[letter];
    glyphs[at] = options && random() < 0.7 ? pick([...options], random) : letter.toUpperCase();
  }
  return glyphs.join('');
}

const DRAW: Readonly<Record<PhraseKind, (random: () => number) => string>> = {
  big: (random) => `${pick(BIG, random)}small`,
  small: (random) => `big${pick(SMALL, random)}`,
  both: (random) => `${pick(BIG, random)}${pick(SMALL, random)}`,
  letters,
  pairs: (random) => pick(PAIRS, random),
  analogies: (random) => pick(ANALOGIES, random),
  idioms: (random) => pick(IDIOMS, random),
  equations: (random) => pick(EQUATIONS, random),
  constants: (random) => pick(CONSTANTS, random),
  conversions: (random) => pick(CONVERSIONS, random),
  name: (random) => pick(NAME, random),
  art: (random) => pick(ART, random),
};

/** A kind, drawn by its weight in `mix`; when every weight is zero, each kind is as likely. */
function kindOf(mix: Readonly<Record<PhraseKind, number>>, random: () => number): PhraseKind {
  const weighted = PHRASE_KINDS.filter((kind) => mix[kind] > 0);
  if (weighted.length === 0) return pick(PHRASE_KINDS, random);
  let roll = random() * weighted.reduce((sum, kind) => sum + mix[kind], 0);
  for (const kind of weighted) {
    roll -= mix[kind];
    if (roll < 0) return kind;
  }
  return weighted[weighted.length - 1]!;
}

/** The next phrase, its kind drawn by `mix`, never the one showing now. */
export function nextPhrase(
  current: string,
  mix: Readonly<Record<PhraseKind, number>> = WORDMARK_TUNING.mix,
  random: () => number = Math.random,
): string {
  for (let tries = 0; ; tries += 1) {
    const phrase = DRAW[kindOf(mix, random)](random);
    if (phrase !== current || tries > 20) return phrase;
  }
}

/** A symbol for the theme's art to flip to, never the one showing now. */
export function nextArtGlyph(current: string | null, random: () => number = Math.random): string {
  for (;;) {
    const glyph = pick(ART_GLYPHS, random);
    if (glyph !== current) return glyph;
  }
}

/**
 * Every phrase of each kind, for the lab's sheet and the browser test that nothing is cut off.
 * Letters lists each single swap; two or three at once keep the name's length.
 */
export function catalog(): Record<PhraseKind, readonly string[]> {
  const swaps = [...WORDMARK].flatMap((letter, at) =>
    [...(LOOKALIKES[letter] ?? ''), letter.toUpperCase()].map(
      (glyph) => WORDMARK.slice(0, at) + glyph + WORDMARK.slice(at + 1),
    ),
  );
  return {
    big: BIG.map((big) => `${big}small`),
    small: SMALL.map((small) => `big${small}`),
    both: BIG.flatMap((big) => SMALL.map((small) => big + small)),
    letters: [...new Set(swaps)],
    pairs: PAIRS,
    analogies: ANALOGIES,
    idioms: IDIOMS,
    equations: EQUATIONS,
    constants: CONSTANTS,
    conversions: CONVERSIONS,
    name: NAME,
    art: ART,
  };
}

/** Glyphs a position flips through before it lands. */
const FLAP = [...'0123456789+−×÷=≈<>∞πΣΔλµΩ°%#*'];
/** Narrow ones, for narrow letters (i, l, punctuation) that few of the others fit. */
const FLAP_NARROW = [...'|!:;·.,ı'];

/**
 * For each glyph of a phrase, the glyphs its position may flip through before it lands: only
 * those no wider than the glyph times `stretch`, the share of its room the phrase leaves free
 * (room ÷ the phrase's width, so 1 for a phrase that fills it). Every frame of a change then fits
 * where the phrase fits, and the size fitted to the phrase holds throughout; a short phrase
 * flickers through the whole set. Narrow glyphs join only where few others fit. Spaces, and glyphs
 * narrower than every flap glyph, have none and show at once. `widthOf` measures a glyph in the
 * phrase's font.
 */
export function flapPlan(
  glyphs: readonly string[],
  widthOf: (glyph: string) => number,
  stretch = 1,
): string[][] {
  return glyphs.map((glyph) => {
    if (glyph.trim() === '') return [];
    const room = widthOf(glyph) * stretch;
    const fits = (flap: string) => flap !== glyph && widthOf(flap) <= room;
    const main = FLAP.filter(fits);
    return main.length >= 3 ? main : [...main, ...FLAP_NARROW.filter(fits)];
  });
}

/**
 * A phrase partway through landing, like a split-flap board: the first `landed` positions show
 * their glyphs, and each of the rest shows one of its flap glyphs, a new one every `turn`.
 */
export function flapFrame(
  glyphs: readonly string[],
  plan: readonly (readonly string[])[],
  landed: number,
  turn: number,
): string {
  let text = '';
  for (const [at, glyph] of glyphs.entries()) {
    const options = plan[at] ?? [];
    const flap = (Math.imul(at + 1, 73856093) ^ Math.imul(turn + 1, 19349663)) >>> 0;
    text += at < landed || options.length === 0 ? glyph : (options[flap % options.length] ?? glyph);
  }
  return text;
}

/**
 * How much faster than its resting pace the wordmark runs for a pointer moving at `speed` px/ms:
 * 1 at rest, about 0.2 at a brisk 1 px/ms with the default gain, under 0.1 for a fast sweep.
 */
export function pace(speed: number, gain: number = WORDMARK_TUNING.gain): number {
  return 1 / (1 + speed * gain);
}
