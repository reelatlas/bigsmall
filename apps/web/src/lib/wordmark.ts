/**
 * The header's wordmark at play (docs/UX-SPEC.md §1, "The wordmark at play"): what "bigsmall" can
 * turn into, and the split-flap frames between one phrase and the next. Pure, so the variety and
 * the timing math are unit-tested; scripts/wordmark-motion.ts puts it on the page. Every value is
 * a standard figure (SI, NIST); the wordplay is ours.
 */

export const WORDMARK = 'bigsmall';

const list = (items: string) => items.split('|');

/** Stand-ins for "big", shown before "small". */
const BIG = list(
  '∞|10⁹|10¹⁰⁰|Σ|ly|AU|pc|Mpc|TB|GW|ton|km|mi|MAX|XL|huge|vast|giga|mega|tera|Ω|≥|»|▲|↑',
);
/** Stand-ins for "small", shown after "big". */
const SMALL = list('µm|nm|Å|fm|ε|10⁻⁹|mg|µs|ns|bit|dx|δ|atom|tiny|xs|nano|pico|milli|·|◦|«|≤|▼|↓');
/** Opposites that replace both halves at once. */
const PAIRS = list(
  'giga nano|kilo milli|mega micro|tera pico|peta femto|exa atto|max min|∞ 0|▲ ▼|↑ ↓|≫ ≪|+ −|km mm|TB bit|GW mW|yr ns|ton mg|mile inch|hot cold|far near|heavy light|loud quiet|● ·|■ ▪|O o|BIG small|big SMALL|MACRO micro|galaxy quark|sun atom|whale krill|ocean drop',
).map((pair) => pair.split(' ') as [string, string]);
/** Letters of the wordmark and what each can pass for. */
const LOOKALIKES: Readonly<Record<string, string>> = {
  b: 'β6',
  i: 'ι1!ı',
  g: '9γ',
  s: '5σ$∫§',
  m: 'µ',
  a: 'α4∂@',
  l: 'ℓ1λ|',
};
/** Whole phrases: equations, constants, conversions, and wordplay on the name. */
const WHOLE = list(
  'E = mc²|F = ma|PV = nRT|a² + b² = c²|e^iπ + 1 = 0|F = Gm₁m₂/r²|v = d/t|p = mv|V = IR|P = IV|λ = c/f|ΔS ≥ 0|KE = ½mv²|W = Fd|ρ = m/V|E = hf|F = −kx|s = ½at²|' +
    'c = 299 792 458 m/s|g ≈ 9.81 m/s²|h ≈ 6.626e−34 J·s|Nₐ ≈ 6.022e23|k ≈ 1.381e−23 J/K|G ≈ 6.674e−11|π ≈ 3.14159|φ ≈ 1.618|e ≈ 2.71828|√2 ≈ 1.41421|' +
    '0 K = −273.15 °C|100 °C = 212 °F|−40 °C = −40 °F|37 °C ≈ 98.6 °F|1 in = 2.54 cm|1 ft = 0.3048 m|1 mi ≈ 1.609 km|1 lb ≈ 0.454 kg|1 oz ≈ 28.35 g|1 gal ≈ 3.785 L|' +
    '1 kn = 1.852 km/h|1 ly ≈ 9.461e15 m|1 AU ≈ 1.496e11 m|1 pc ≈ 3.26 ly|1 Å = 0.1 nm|1 KiB = 1024 B|1 B = 8 bit|1 d = 86 400 s|1 atm = 101 325 Pa|1 cal = 4.184 J|' +
    '1 hp ≈ 745.7 W|1 ha = 10 000 m²|1 L = 1000 cm³|1 t = 1000 kg|1 st = 14 lb|1 tbsp = 3 tsp|1 yd = 3 ft|' +
    'big > small|small < big|big ≫ small|big ∝ 1/small|bigsmall²|√bigsmall|big ⇄ small|smallbig|BIGsmall|bigSMALL|big ≠ small|⟨big∣small⟩|{big, small}|' +
    'big ∩ small = ∅|lim small→0|Δbig/Δsmall|big!|log(big)|small⁻¹|1 + 1 = 10₂',
);
/** Text art. */
const ART = list('▇▆▅▄▃▂▁|▁▂▃▄▅▆▇|●●●···|■■□□|O o ·|◆◇◆◇|▲△▴▵|big→→small|≋≋≋≋≋≋|‹‹big››');

/** Glyphs a letter flips through before it lands. */
const FLAP = '0123456789+−×÷=≈<>∞πΣΔλµΩ°%#*';

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]!;
}

/** The wordmark with one to three letters swapped for look-alikes: "bιgσmall". */
function lookalike(random: () => number): string {
  const letters = [...WORDMARK];
  const swaps = 1 + Math.floor(random() * 3);
  for (let n = 0; n < swaps; n += 1) {
    const at = Math.floor(random() * letters.length);
    const options = LOOKALIKES[WORDMARK[at]!];
    if (options) letters[at] = pick([...options], random);
  }
  return letters.join('');
}

function draw(random: () => number): string {
  const roll = random();
  if (roll < 0.17) return `${pick(BIG, random)}small`;
  if (roll < 0.34) return `big${pick(SMALL, random)}`;
  if (roll < 0.42) return `${pick(BIG, random)}${pick(SMALL, random)}`;
  if (roll < 0.56) return pick(PAIRS, random).join('');
  if (roll < 0.72) return lookalike(random);
  if (roll < 0.94) return pick(WHOLE, random);
  return pick(ART, random);
}

/** The next phrase, never the one showing now. */
export function nextPhrase(current: string, random: () => number = Math.random): string {
  for (;;) {
    const phrase = draw(random);
    if (phrase !== current) return phrase;
  }
}

/** How long a change takes: each position lands `step` ms after the one before it. */
export function flapDuration(from: string, to: string, step: number): number {
  return Math.max(from.length, to.length) * step;
}

/**
 * The text `elapsed` ms into a change from `from` to `to`, like a split-flap board: positions
 * land left to right, `step` ms apart, and until then each flips through glyphs, a new one every
 * `flip` ms. Positions past the end of `to` vanish when they land.
 */
export function flapFrame(
  from: string,
  to: string,
  elapsed: number,
  step: number,
  flip: number,
): string {
  const length = Math.max(from.length, to.length);
  const turn = Math.floor(elapsed / Math.max(flip, 1));
  let text = '';
  for (let at = 0; at < length; at += 1) {
    if (elapsed >= (at + 1) * step) text += to[at] ?? '';
    else
      text +=
        FLAP[((Math.imul(at + 1, 73856093) ^ Math.imul(turn + 1, 19349663)) >>> 0) % FLAP.length];
  }
  return text;
}

/**
 * How much faster than its resting pace the wordmark runs for a pointer moving at `speed` px/ms:
 * 1 at rest, about 0.2 at a brisk 1 px/ms, under 0.1 for a fast sweep.
 */
export function pace(speed: number): number {
  return 1 / (1 + speed * 3.5);
}
