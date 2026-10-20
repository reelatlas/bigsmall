import { formatNumber, minusSign, numberFormat } from './format';
import type { Separators } from './locale';
import { compactKey } from './normalize';
import {
  numberAt,
  readable,
  readableSeparators,
  RIGHT_QUOTE,
  SIGNS,
  skipSpace,
  toNumber,
} from './number';
import {
  PLACES_LIMIT,
  roundedScaled,
  roundToFraction,
  type FractionSize,
  type Rounded,
  type Rounding,
} from './rounded';
import type { Unit } from './types';
import { getUnit, units } from './units';

/**
 * Compound quantities (ADR 0026; docs/UX-SPEC.md §2, §7): a value in two or three units of one
 * kind, largest first, read from the box as one quantity ("5'11", "5 ft 11 in", "11 st 4",
 * "1h30", "45° 30′ 15″") and written back as one, the total rounded and then split, so it never
 * reads 5 ft 12 in. A pair is a unit of its own (`pair` on the unit, the ids of its parts), its
 * factor its first part's, so a plain number in it is that part: 6 in feet and inches is 6 ft.
 */

/** One part of a compound as typed: its number, and the part's unit by id. */
export interface CompoundPart {
  value: number;
  unit: string;
}

/** A compound the box holds: the pair it names, by id, and its parts as typed. */
export interface Compound {
  unit: string;
  parts: CompoundPart[];
}

/**
 * A compound read from text: with its value in the pair's first part, where it ended, and its
 * canonical text.
 */
export interface CompoundRead extends Compound {
  value: number;
  /** The index in the typed text right after the compound. */
  end: number;
  /**
   * The compound in the pair's own words at ten significant digits: "5 ft 11 in"; reads back as the
   * same value.
   */
  canonical: string;
}

/** The units a pair is written in, largest first; empty for a unit that is no pair. */
export function pairParts(unit: Unit): Unit[] {
  return (unit.pair ?? []).flatMap((id) => getUnit(id) ?? []);
}

/**
 * A pair's part symbol that is a mark (°, ′, ″) attaches to its number; every other takes a space.
 */
const ATTACHED_SYMBOL = /^[°′″]$/u;

/**
 * The feet mark and its look-alikes, and the inch mark and its own; after a degree, arcminutes and
 * arcseconds.
 */
const SINGLE_MARKS = new Set(["'", '′', RIGHT_QUOTE, String.fromCharCode(0x2018), '´']);
const DOUBLE_MARKS = new Set(['"', '″', String.fromCharCode(0x201d)]);
const DEGREE = '°';
const LETTERS = /\p{L}+\.?/uy;
const DIGIT = /[0-9]/;
const FRACTION = /([0-9]+)\/([0-9]+)/y;
/** "and a half" after a number; the halves and quarters people write out. */
const WORDED_FRACTION = /\s+and\s+(?:a\s+half|a\s+quarter|three\s+quarters)\b/iuy;
const WORDED_VALUE: Readonly<Record<string, number>> = { half: 0.5, quarter: 0.25, quarters: 0.75 };
/** A vulgar fraction typed as one character, after a number or alone ("5' 10½\""). */
const VULGAR: Readonly<Record<string, number>> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};
const JOINER = /\s*(?:,|\band\b)?\s*/iuy;

/** A unit as typed in a part: a word (or the degree sign), or a mark. */
type UnitToken = { kind: 'word'; text: string } | { kind: 'mark'; double: boolean };

interface RawPart {
  value: number;
  token: UnitToken | null;
  /** The readable index right after the part, its unit included. */
  end: number;
  /** The readable index right after the part's number, before its unit. */
  numberEnd: number;
}

/**
 * Spellings that name a part only once its pair is known (the compound worker's rules, 2026-10-19):
 * "m" and "s" are minutes and seconds after an hour, and in an angle "d", "m", and "s" are degrees,
 * minutes, and seconds, as are "min" and "sec", which name time's units on their own. Keyed by the
 * pair's id, then the spelling, to the part's index.
 */
const CONTEXT: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'hour-minute-second': { m: 1 },
  'degree-arcminute-arcsecond': {
    d: 0,
    m: 1,
    s: 2,
    min: 1,
    mins: 1,
    minute: 1,
    minutes: 1,
    sec: 2,
    secs: 2,
    second: 2,
    seconds: 2,
  },
};

/** Spellings that may start a compound on their own: "45d 30m 15s" is an angle. */
const FIRST_CONTEXT: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'degree-arcminute-arcsecond': { d: 0 },
};

/**
 * What a single and a double mark mean in a pair: feet and inches, or after a degree, minutes and
 * seconds.
 */
const MARKS: Readonly<Record<string, readonly [single: number, double: number]>> = {
  'foot-inch': [0, 1],
  'degree-arcminute-arcsecond': [1, 2],
};

interface PairInfo {
  unit: Unit;
  parts: Unit[];
  /** Each part's keys, compact (normalize.ts): its symbol, name, plural, and aliases. */
  keys: ReadonlyMap<string, number>;
  context: ReadonlyMap<string, number>;
  first: ReadonlyMap<string, number>;
  marks: readonly [number, number] | null;
}

let pairInfos: PairInfo[] | null = null;

/** Every pair the catalog has, with its parts' spellings, built once. */
function pairs(): PairInfo[] {
  if (pairInfos) return pairInfos;
  pairInfos = units
    .filter((unit) => unit.pair)
    .map((unit) => {
      const parts = pairParts(unit);
      const keys = new Map<string, number>();
      parts.forEach((part, index) => {
        for (const key of [part.symbol, part.name, part.plural, ...part.aliases]) {
          const compact = compactKey(key);
          if (compact && !keys.has(compact)) keys.set(compact, index);
        }
      });
      return {
        unit,
        parts,
        keys,
        context: new Map(Object.entries(CONTEXT[unit.id] ?? {})),
        first: new Map(Object.entries(FIRST_CONTEXT[unit.id] ?? {})),
        marks: MARKS[unit.id] ?? null,
      };
    });
  return pairInfos;
}

function factorOf(unit: Unit): number {
  return unit.kind === 'linear' ? unit.factor : Number.NaN;
}

/**
 * The number at `at`, with a fraction, a worded fraction, or a vulgar one joined to it; null where
 * none starts.
 */
function partNumber(
  text: string,
  at: number,
  separators: Separators,
): { value: number; end: number } | null {
  const vulgar = VULGAR[text[at] ?? ''];
  if (vulgar !== undefined) return { value: vulgar, end: at + 1 };
  const number = numberAt(text, at);
  // A clock ("1:30") and an exponent are numbers of their own, never a part.
  if (number === null || number.includes(':') || /[eE]/.test(number)) return null;
  let value = toNumber(number, separators);
  let end = at + number.length;
  const whole = /^[0-9]+$/.test(number);
  FRACTION.lastIndex = end;
  const direct = FRACTION.exec(text);
  if (direct && whole && text[end] === '/') {
    // "1/2" straight after its digits: the number is the fraction itself.
    return {
      value: Number(direct[1]) / Number(direct[2]),
      end: end + direct[0].length,
    };
  }
  const space = skipSpace(text, end);
  FRACTION.lastIndex = space;
  const mixed = space > end ? FRACTION.exec(text) : null;
  if (mixed && whole && Number(mixed[2]) > 0) {
    value += Number(mixed[1]) / Number(mixed[2]);
    end = space + mixed[0].length;
  } else if (whole && VULGAR[text[space] ?? ''] !== undefined) {
    value += VULGAR[text[space]!]!;
    end = space + 1;
  } else {
    WORDED_FRACTION.lastIndex = end;
    const worded = WORDED_FRACTION.exec(text);
    if (worded && whole) {
      const word = worded[0].trim().split(/\s+/).at(-1)!.toLowerCase();
      value += WORDED_VALUE[word] ?? 0;
      end += worded[0].length;
    }
  }
  return { value, end };
}

/**
 * The unit written at `at`: a mark, the degree sign alone, or a word; null where a number or
 * nothing follows.
 */
function unitToken(text: string, at: number): { token: UnitToken; end: number } | null {
  const char = text[at] ?? '';
  if (char === "'" && text[at + 1] === "'")
    return { token: { kind: 'mark', double: true }, end: at + 2 };
  if (SINGLE_MARKS.has(char)) return { token: { kind: 'mark', double: false }, end: at + 1 };
  if (DOUBLE_MARKS.has(char)) return { token: { kind: 'mark', double: true }, end: at + 1 };
  if (char === DEGREE) {
    // A degree sign before a letter is a temperature scale's, not an angle's.
    LETTERS.lastIndex = skipSpace(text, at + 1);
    return LETTERS.test(text) ? null : { token: { kind: 'word', text: DEGREE }, end: at + 1 };
  }
  LETTERS.lastIndex = at;
  const word = LETTERS.exec(text)?.[0];
  if (!word) return null;
  return { token: { kind: 'word', text: word }, end: at + word.length };
}

/** The parts as typed, in order, each a number with the unit written after it, if one was. */
function lexParts(text: string, separators: Separators): { negative: boolean; parts: RawPart[] } {
  let i = skipSpace(text, 0);
  let negative = false;
  if (SIGNS.has(text[i] ?? '')) {
    negative = text[i] !== '+';
    i = skipSpace(text, i + 1);
  }
  const parts: RawPart[] = [];
  for (;;) {
    const number = partNumber(text, i, separators);
    if (!number) break;
    i = skipSpace(text, number.end);
    const unit = unitToken(text, i);
    const part: RawPart = {
      value: number.value,
      token: unit?.token ?? null,
      end: number.end,
      numberEnd: number.end,
    };
    if (unit) {
      part.end = unit.end;
      i = unit.end;
      // A hyphen straight after a mark, before a digit, only separates ("5'-10 3/8\"").
      if (unit.token.kind === 'mark' && text[i] === '-' && DIGIT.test(text[i + 1] ?? '')) i += 1;
    }
    parts.push(part);
    // A comma or "and" may join the parts ("5 ft, 11 in"; "5 feet and 11 inches").
    JOINER.lastIndex = i;
    const joiner = JOINER.exec(text);
    const next = i + (joiner?.[0].length ?? 0);
    if (!DIGIT.test(text[next] ?? '') && VULGAR[text[next] ?? ''] === undefined) break;
    i = next;
  }
  return { negative, parts };
}

/**
 * A pair with its parts resolved from the raw parts, or null: each part's index in the pair, in
 * order, the last unit left off taking the next part's; `context` says a context-only spelling
 * named one; `end` is where the compound ends, before a last word it could not read, which stays
 * for the query ("5'11 cm" is 5 ft 11 in, then "cm").
 */
function resolveParts(
  raw: readonly RawPart[],
  info: PairInfo,
  firstIndex: number,
  viaContext: boolean,
): { parts: CompoundPart[]; context: boolean; end: number } | null {
  const parts: CompoundPart[] = [];
  let previous = firstIndex - 1;
  let context = viaContext;
  let end = 0;
  for (let at = 0; at < raw.length; at += 1) {
    const part = raw[at]!;
    let index: number | undefined;
    end = part.end;
    if (at === 0) index = firstIndex;
    else if (part.token === null) index = previous + 1;
    else if (part.token.kind === 'mark') {
      index = info.marks ? info.marks[part.token.double ? 1 : 0] : undefined;
    } else {
      const word = compactKey(part.token.text);
      index = info.keys.get(word);
      if (index === undefined && info.context.has(word)) {
        index = info.context.get(word);
        context = true;
      }
      // The last part's word still being typed: "5 ft 11 i" on the way to "5 ft 11 in".
      if (index === undefined && at === raw.length - 1 && word) {
        const started = [...info.keys].filter(([key, k]) => k > previous && key.startsWith(word));
        if (new Set(started.map(([, k]) => k)).size === 1) index = started[0]![1];
      }
      // A last word that names no part is the query's ("5'11 cm"): the number takes the next
      // part. Not where a context spelling started the reading: "2 d 3 h" is no angle.
      if (index === undefined && at === raw.length - 1 && !context) {
        index = previous + 1;
        end = part.numberEnd;
      }
    }
    if (index === undefined || index <= previous || index >= info.parts.length) return null;
    parts.push({ value: part.value, unit: info.parts[index]!.id });
    previous = index;
  }
  return parts.length >= 2 ? { parts, context, end } : null;
}

/**
 * The pairs a first part could start, each with the part's index in it, and whether a context
 * spelling named it.
 */
function candidates(first: RawPart, raw: readonly RawPart[]): Array<[PairInfo, number, boolean]> {
  const found: Array<[PairInfo, number, boolean]> = [];
  for (const info of pairs()) {
    const token = first.token;
    if (token === null) {
      // "5 11 in": the inch names the pair, when the second part's unit is a pair's second and
      // no third part follows.
      const second = raw[1]?.token;
      if (raw.length !== 2 || !second) continue;
      const index =
        second.kind === 'mark'
          ? info.marks?.[second.double ? 1 : 0]
          : (info.keys.get(compactKey(second.text)) ?? info.context.get(compactKey(second.text)));
      if (index === 1) found.push([info, 0, false]);
    } else if (token.kind === 'mark') {
      // A mark opens only the pair it starts: a lone prime is feet, never an arcminute.
      const index = info.marks?.[token.double ? 1 : 0];
      if (index === 0) found.push([info, index, false]);
    } else {
      const word = compactKey(token.text);
      const index = info.keys.get(word);
      if (index !== undefined) found.push([info, index, false]);
      else if (info.first.has(word)) found.push([info, info.first.get(word)!, true]);
    }
  }
  return found;
}

/**
 * The compound the text starts with, if it starts with one: two or three parts of one pair, in
 * the pair's order, each a number and its unit, the last unit left off where the part before it
 * has one partner ("5 ft 11", "11 st 4", "1h30"), a decimal, a fraction, a mixed number, or "and
 * a half" in any part, spacing never mattering, a leading sign over the whole, a comma or "and"
 * between the parts. Marks are feet and inches ("5'11\"", "5′ 11″"), and after a degree, minutes
 * and seconds of arc. "in" after a number is the inch; after a unit it is left for the query.
 * Null where the text is no compound: a decimal ("5.11 ft"), arithmetic ("5-11"), a bare "5 11",
 * parts out of order, or units of two pairs ("5 ft 11 cm"), each read as before.
 */
export function readCompound(text: string, separators: Separators): CompoundRead | null {
  const read = readable(text, separators.exponent);
  const marked = readableSeparators(separators);
  const { negative, parts: raw } = lexParts(read.text, marked);
  if (raw.length < 2 || !raw[0]) return null;
  const readings = candidates(raw[0], raw).flatMap(([info, index, viaContext]) => {
    const resolved = resolveParts(raw, info, index, viaContext);
    return resolved ? [{ info, ...resolved }] : [];
  });
  const plain = readings.filter((reading) => !reading.context);
  const chosen = plain.length > 0 ? plain : readings;
  if (chosen.length !== 1) return null;
  const { info, parts, end } = chosen[0]!;
  // Summed in the last part by the whole ratios (71 in), then in the pair's first (71/12 ft), so
  // whole parts stay exact.
  const sizes = inLast(info.parts);
  const total = parts.reduce(
    (sum, part) => sum + part.value * sizes[info.parts.findIndex((each) => each.id === part.unit)]!,
    0,
  );
  const value = (negative ? -total : total) / sizes[0]!;
  return {
    unit: info.unit.id,
    parts,
    value,
    end: read.at[end] ?? text.length,
    canonical: pairCanonical(value, info.unit),
  };
}

// ---------------------------------------------------------------------------
// Writing a pair: the total rounded, then split.

/**
 * How a pair is written: the last part to a number of places, as a fraction, or the whole to
 * significant digits.
 */
export interface PairFormat {
  locale?: string | undefined;
  rounding: Rounding;
  /** The last part to these decimal places. */
  places?: number | null | undefined;
  /** The last part as a fraction in these sizes, in place of decimals. */
  sizes?: ReadonlySet<FractionSize> | undefined;
  /** With neither, the whole quantity to these significant digits, trailing zeros trimmed. */
  significant?: number | undefined;
  /** The parts' symbols with spaces whatever the pair's notation ("5 ft 11 in"): for speech. */
  words?: boolean | undefined;
}

/** A pair split into its parts after rounding, for a writer to spell. */
interface Split {
  negative: boolean;
  /** Each part's count, the last part's whole number only. */
  counts: number[];
  /**
   * The last part's rest: decimal digits after its point ("87", or none), or a fraction in its own
   * size.
   */
  rest: { kind: 'decimals'; digits: string } | { kind: 'fraction'; n: number; d: number };
  approx: boolean;
  /**
   * The total is not zero but rounds to it: said as below the step, in the last part ("< 0.01").
   */
  below: string | null;
}

/** Each part's size in the last part: 12 and 1 for feet and inches, 3600, 60, and 1 for a time. */
function inLast(parts: readonly Unit[]): number[] {
  const last = factorOf(parts[parts.length - 1]!);
  return parts.map((part) => Math.round(factorOf(part) / last));
}

/** The whole count of the last part shared out over the parts: 71 inches into 5 feet and 11. */
function shareOut(whole: number, sizes: readonly number[]): number[] {
  let rest = whole;
  return sizes.map((size, at) => {
    if (at === sizes.length - 1) return rest;
    const count = Math.floor(rest / size);
    rest -= count * size;
    return count;
  });
}

/** The number of decimal places that writes `value` to `digits` significant digits. */
function placesFor(value: number, digits: number): number {
  if (value === 0) return 0;
  const exponent = Number(Math.abs(value).toExponential().split('e')[1]);
  return Math.max(0, digits - 1 - exponent);
}

function splitPair(value: number, parts: readonly Unit[], options: PairFormat): Split | null {
  const sizes = inLast(parts);
  const total = value * sizes[0]!;
  if (!Number.isFinite(total) || Math.abs(total) >= PLACES_LIMIT) return null;
  const { rounding } = options;
  if (options.sizes) {
    const step = roundToFraction(total, { sizes: options.sizes, rounding });
    if (!step) return null;
    const count = Math.abs(step.count);
    const whole = Math.floor(count / step.d);
    return {
      negative: step.count < 0,
      counts: shareOut(whole, sizes),
      rest: { kind: 'fraction', n: count % step.d, d: step.d },
      approx: Math.abs(total - step.count / step.d) > Math.max(1e-9, Math.abs(total) * 1e-15),
      below: step.count === 0 && total !== 0 ? `1/${Math.max(...options.sizes)}` : null,
    };
  }
  const places =
    options.places !== null && options.places !== undefined
      ? options.places
      : placesFor(total, options.significant ?? 10);
  const scale = 10 ** places;
  const scaled = roundedScaled(total, scale, rounding);
  if (!Number.isFinite(scaled)) return null;
  const size = Math.abs(scaled);
  const whole = Math.floor(size / scale);
  let digits = places > 0 ? String(size - whole * scale).padStart(places, '0') : '';
  // Significant digits, like the table's own text, show no trailing zeros.
  if (options.places === null || options.places === undefined) digits = digits.replace(/0+$/, '');
  return {
    negative: scaled < 0,
    counts: shareOut(whole, sizes),
    rest: { kind: 'decimals', digits },
    approx: false,
    below: scaled === 0 && total !== 0 ? (1 / scale).toFixed(places) : null,
  };
}

/** The locale's decimal mark, as Intl writes it. */
function decimalMark(locale: string | undefined): string {
  return (
    numberFormat(locale)
      .formatToParts(1.5)
      .find((part) => part.type === 'decimal')?.value ?? '.'
  );
}

/** A number of a part with its symbol: "5 ft", "45°". */
function withSymbol(number: string, unit: Unit): string {
  return ATTACHED_SYMBOL.test(unit.symbol) ? `${number}${unit.symbol}` : `${number} ${unit.symbol}`;
}

/**
 * A number of a part as the pair writes it: its mark attached where the pair has marks, else its
 * symbol.
 */
function withNotation(number: string, unit: Unit, mark: string | undefined): string {
  return mark === undefined ? withSymbol(number, unit) : `${number}${mark}`;
}

/**
 * A pair written as a clock: the first part, then two digits for each part after it, to the whole
 * last part (1:30:00), whatever places or sizes are chosen, as a pace is written to the second;
 * the sign before it, and a value under a second said as below it ("< 0:00:01").
 */
function clockText(
  value: number,
  parts: readonly Unit[],
  rounding: Rounding,
  locale: string | undefined,
): Rounded | null {
  const split = splitPair(value, parts, { rounding, places: 0 });
  if (!split) return null;
  const two = numberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
  const one = numberFormat(locale, { useGrouping: false });
  const written = (counts: readonly number[]) =>
    counts.map((count, at) => (at === 0 ? one.format(count) : two.format(count))).join(':');
  if (split.below !== null) {
    const step = written(parts.map((_, at) => (at === parts.length - 1 ? 1 : 0)));
    return { text: value > 0 ? `< ${step}` : `> ${minusSign(locale)}${step}`, approx: false };
  }
  return {
    text: `${split.negative ? minusSign(locale) : ''}${written(split.counts)}`,
    approx: false,
  };
}

/**
 * A pair's value written as its parts (docs/UX-SPEC.md §7): the total rounded to the display's
 * step in the last part, then split, so 71.996 in reads "6 ft 0 in", never 5 ft 12 in; every
 * part written, a zero remainder too ("6 ft 0 in"), so the row's shape never changes; the sign
 * before the whole ("−5 ft 11 in"); the last part to the places chosen, as a fraction in the
 * sizes chosen ("5 ft 10 7/8 in", "≈" where it rounds), or, with neither, to the significant
 * digits asked for (the table's six, the box's ten). A nonzero total that rounds to zero reads
 * below the step ("< 0.01 in"). Written in the pair's own notation where it has one (Sean,
 * 2026-10-19): the marks attached ("5′ 11″", "5′ 10 7/8″") or a clock ("1:30:00"), the symbols
 * with spaces otherwise ("11 st 4 lb") and with `words` (for speech). Null for a unit that is no
 * pair, a value too large for places to mean anything, or no fraction size chosen.
 */
export function formatPair(value: number, unit: Unit, options: PairFormat): Rounded | null {
  const parts = pairParts(unit);
  if (parts.length < 2 || !Number.isFinite(value)) return null;
  const { locale } = options;
  const notation = options.words ? undefined : unit.notation;
  if (notation === 'clock') return clockText(value, parts, options.rounding, locale);
  const mark = (at: number) =>
    notation === undefined ? undefined : (notation[at] ?? parts[at]!.symbol);
  const split = splitPair(value, parts, options);
  if (!split) return null;
  const last = parts[parts.length - 1]!;
  if (split.below !== null) {
    const step = withNotation(
      split.below.replace('.', decimalMark(locale)),
      last,
      mark(parts.length - 1),
    );
    return { text: value > 0 ? `< ${step}` : `> ${minusSign(locale)}${step}`, approx: false };
  }
  const whole = numberFormat(locale, { useGrouping: true });
  const words = parts.map((part, at) => {
    const count = whole.format(split.counts[at]!);
    if (at < parts.length - 1) return withNotation(count, part, mark(at));
    if (split.rest.kind === 'decimals') {
      const digits = split.rest.digits;
      return withNotation(
        digits ? `${count}${decimalMark(locale)}${digits}` : count,
        part,
        mark(at),
      );
    }
    const { n, d } = split.rest;
    const fraction = n ? `${n}/${d}` : '';
    const number = [split.counts[at] ? count : '', fraction].filter(Boolean).join(' ') || count;
    return withNotation(number, part, mark(at));
  });
  const sign = split.negative ? minusSign(locale) : '';
  return { text: `${sign}${words.join(' ')}`, approx: split.approx };
}

/**
 * A pair's formula as the About page writes it (docs/SEO.md §5), from its parts' factors, never
 * typed: "1 ft = 12 in"; "1 h = 60 min, 1 min = 60 s"; "1° = 60′, 1′ = 60″".
 */
export function pairFormula(unit: Unit): string {
  const parts = pairParts(unit);
  const sizes = inLast(parts);
  return parts
    .slice(1)
    .map((part, at) => {
      const larger = parts[at]!;
      const ratio = sizes[at]! / sizes[at + 1]!;
      return `${withSymbol('1', larger)} = ${withSymbol(String(ratio), part)}`;
    })
    .join(', ');
}

/**
 * A pair's value in canonical words, no locale: a period decimal, no grouping, a hyphen for the
 * sign, ten significant digits ("5 ft 11 in", "-5 ft 11.5 in", "45° 30′ 15″"), which readCompound
 * reads back as the same value: what a URL carries (docs/UX-SPEC.md §11).
 */
export function pairCanonical(value: number, unit: Unit): string {
  const parts = pairParts(unit);
  const split = splitPair(value, parts, { rounding: 'nearest', significant: 10 });
  if (parts.length < 2 || !split) return formatNumber(value, { locale: 'en-US' });
  const words = parts.map((part, at) => {
    const count = String(split.counts[at]);
    const digits = split.rest.kind === 'decimals' ? split.rest.digits : '';
    const number = at === parts.length - 1 && digits ? `${count}.${digits}` : count;
    return withSymbol(number, part);
  });
  return `${split.negative ? '-' : ''}${words.join(' ')}`;
}

/**
 * The pairs a lone mark after a number opens, by naming their first part: "5'" is five feet, and
 * feet and inches is offered after feet, in case the inches follow (Sean, 2026-10-20); "5\"" opens
 * none, the inch being no pair's first part, and so does a lone minute mark, the angle's second.
 */
export function pairsOpenedBy(mark: string): Unit[] {
  const at = SINGLE_MARKS.has(mark) ? 0 : DOUBLE_MARKS.has(mark) ? 1 : null;
  if (at === null) return [];
  return pairs()
    .filter((info) => info.marks?.[at] === 0)
    .map((info) => info.unit);
}
