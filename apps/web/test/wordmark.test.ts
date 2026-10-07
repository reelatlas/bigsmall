import { describe, expect, it } from 'vitest';
import {
  ART_GLYPHS,
  catalog,
  fitSteps,
  flapFrame,
  flapPlan,
  lineBreaks,
  nextArtGlyph,
  nextPhrase,
  pace,
  PHRASE_KINDS,
  sizesDownTo,
  WORDMARK,
  WORDMARK_TUNING,
  type PhraseKind,
} from '../src/lib/wordmark';

/** A repeatable stand-in for Math.random. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

/** A mix that draws only `kind`. */
const only = (kind: PhraseKind) =>
  Object.fromEntries(PHRASE_KINDS.map((each) => [each, each === kind ? 1 : 0])) as Record<
    PhraseKind,
    number
  >;

/** Stand-in glyph widths: narrow punctuation and letters, digits in the middle, wide symbols. */
const NARROW = new Set([..."il|!:;·.,ı'1jtfr"]);
const WIDE = new Set([...'mwMW%∞ΩΣΔ#']);
const widthOf = (glyph: string) => (NARROW.has(glyph) ? 0.3 : WIDE.has(glyph) ? 0.85 : 0.55);
const widthSum = (text: string) => [...text].reduce((sum, glyph) => sum + widthOf(glyph), 0);

const NARROW_SPACE = String.fromCharCode(0x202f);
const listKinds = PHRASE_KINDS.filter(
  (kind) => !['big', 'small', 'both', 'letters'].includes(kind),
);

describe('nextPhrase', () => {
  it('never repeats the phrase showing now', () => {
    const random = seeded(1);
    let current = WORDMARK;
    for (let n = 0; n < 500; n += 1) {
      const next = nextPhrase(current, WORDMARK_TUNING.mix, random);
      expect(next).not.toBe(current);
      current = next;
    }
  });

  it('has a great many combinations, of every kind', () => {
    const random = seeded(7);
    const seen = new Set<string>();
    for (let n = 0; n < 4000; n += 1) seen.add(nextPhrase('', WORDMARK_TUNING.mix, random));
    expect(seen.size).toBeGreaterThan(600);
    const all = catalog();
    for (const kind of listKinds) {
      expect(
        [...seen].some((phrase) => all[kind].includes(phrase)),
        kind,
      ).toBe(true);
    }
    expect([...seen].some((p) => p.endsWith('small') && !p.startsWith('big'))).toBe(true);
    expect([...seen].some((p) => p.startsWith('big') && !p.endsWith('small'))).toBe(true);
  });

  it('draws only the kinds the mix weighs', () => {
    const random = seeded(3);
    const analogies = catalog().analogies;
    for (let n = 0; n < 200; n += 1) {
      expect(analogies).toContain(nextPhrase('', only('analogies'), random));
    }
    for (let n = 0; n < 200; n += 1) {
      const swapped = nextPhrase('', only('letters'), random);
      expect([...swapped]).toHaveLength(WORDMARK.length);
      expect(swapped).not.toBe(WORDMARK);
    }
  });

  it('still draws when every weight is zero', () => {
    const none = only('art');
    none.art = 0;
    expect(nextPhrase(WORDMARK, none, seeded(5))).not.toBe(WORDMARK);
  });
});

describe('catalog', () => {
  const all = catalog();

  it('lists phrases of every kind, none of them the name itself', () => {
    for (const kind of PHRASE_KINDS) {
      expect(all[kind].length, kind).toBeGreaterThan(0);
      for (const phrase of all[kind]) {
        expect(phrase.trim(), kind).toBe(phrase);
        expect(phrase, kind).not.toBe('');
        expect(phrase, kind).not.toBe(WORDMARK);
      }
    }
  });

  it('never lists a phrase twice', () => {
    const listed = listKinds.flatMap((kind) => all[kind]);
    expect(new Set(listed).size).toBe(listed.length);
  });

  it('groups the digits of long numbers with a narrow space that never breaks', () => {
    for (const phrase of PHRASE_KINDS.flatMap((kind) => all[kind])) {
      expect(phrase, phrase).not.toMatch(/\d \d/);
    }
    expect(all.constants).toContain(`c = 299${NARROW_SPACE}792${NARROW_SPACE}458 m/s`);
  });
});

describe('lineBreaks', () => {
  it('breaks at each space and after a colon', () => {
    expect(lineBreaks('big fish, small pond')).toContain('big fish,\nsmall pond');
    expect(lineBreaks('mansion:mousehole')).toEqual(['mansion:\nmousehole']);
    expect(lineBreaks('giganano')).toEqual([]);
  });

  it('keeps a grouped number on one line', () => {
    const group = `299${NARROW_SPACE}792${NARROW_SPACE}458`;
    const options = lineBreaks(`c = ${group} m/s`);
    expect(options.length).toBeGreaterThan(0);
    for (const option of options)
      expect(option.split('\n').some((l) => l.includes(group))).toBe(true);
  });
});

describe('fitSteps', () => {
  it('tries two lines at a size before one line at the next', () => {
    expect(fitSteps('text-sm', 'text-base')).toEqual([
      { size: 'text-3xl', lines: 1 },
      { size: 'text-2xl', lines: 1 },
      { size: 'text-xl', lines: 1 },
      { size: 'text-lg', lines: 1 },
      { size: 'text-base', lines: 1 },
      { size: 'text-base', lines: 2 },
      { size: 'text-sm', lines: 1 },
      { size: 'text-sm', lines: 2 },
    ]);
  });

  it('never sets two lines without a size to start from', () => {
    expect(fitSteps('text-lg', null).map((step) => step.lines)).toEqual([1, 1, 1, 1]);
    expect(sizesDownTo('text-xl')).toEqual(['text-3xl', 'text-2xl', 'text-xl']);
  });
});

describe('flapPlan', () => {
  it('flips each position only through glyphs no wider than the one that lands', () => {
    const glyphs = [...'big fish:1.5'];
    const plan = flapPlan(glyphs, widthOf);
    glyphs.forEach((glyph, at) => {
      for (const flap of plan[at]!) expect(widthOf(flap)).toBeLessThanOrEqual(widthOf(glyph));
    });
    expect(plan[3]).toEqual([]);
    // A narrow letter flips through narrow glyphs.
    expect(plan[1]!.length).toBeGreaterThan(0);
  });

  it('uses the room a phrase leaves free, and prefers the symbols to punctuation', () => {
    const tight = flapPlan(['o'], widthOf)[0]!;
    const roomy = flapPlan(['o'], widthOf, 1.6)[0]!;
    expect(roomy.length).toBeGreaterThan(tight.length);
    expect(roomy).toContain('∞');
    expect(roomy).not.toContain('.');
  });

  it('keeps every frame of a change within the phrase’s width times the stretch', () => {
    const random = seeded(11);
    for (let n = 0; n < 200; n += 1) {
      const phrase = nextPhrase('', WORDMARK_TUNING.mix, random);
      const glyphs = [...phrase];
      const stretch = 1 + random();
      const plan = flapPlan(glyphs, widthOf, stretch);
      for (let landed = 0; landed <= glyphs.length; landed += 1) {
        for (let turn = 0; turn < 12; turn += 1) {
          const frame = flapFrame(glyphs, plan, landed, turn);
          expect(widthSum(frame)).toBeLessThanOrEqual(widthSum(phrase) * stretch + 1e-9);
        }
      }
    }
  });
});

describe('flapFrame', () => {
  const glyphs = [...'E = mc²'];
  const plan = flapPlan(glyphs, widthOf, 2);

  it('shows landed positions, flips the rest, and ends on the phrase', () => {
    const partway = flapFrame(glyphs, plan, 3, 0);
    expect(partway.slice(0, 3)).toBe('E =');
    expect(partway).toHaveLength(glyphs.length);
    expect(partway.slice(3)).not.toBe(' mc²');
    expect(flapFrame(glyphs, plan, glyphs.length, 9)).toBe('E = mc²');
  });

  it('shows a new glyph each turn, the same one within a turn', () => {
    expect(flapFrame(glyphs, plan, 0, 4)).toBe(flapFrame(glyphs, plan, 0, 4));
    expect(flapFrame(glyphs, plan, 0, 4)).not.toBe(flapFrame(glyphs, plan, 0, 5));
  });

  it('shows a position with nothing to flip through at once', () => {
    expect(flapFrame(glyphs, plan, 0, 0)[1]).toBe(' ');
  });
});

describe('the art', () => {
  it('flips to short symbols, never the one showing', () => {
    for (const glyph of ART_GLYPHS) expect([...glyph].length).toBeLessThanOrEqual(3);
    const random = seeded(2);
    let current: string | null = null;
    for (let n = 0; n < 100; n += 1) {
      const next = nextArtGlyph(current, random);
      expect(next).not.toBe(current);
      current = next;
    }
  });
});

describe('pace', () => {
  it('is the resting pace for a still pointer and quickens with speed and gain', () => {
    expect(pace(0)).toBe(1);
    expect(pace(1)).toBeLessThan(0.25);
    expect(pace(3)).toBeLessThan(pace(1));
    expect(pace(1, 7)).toBeLessThan(pace(1, 3.5));
  });
});
