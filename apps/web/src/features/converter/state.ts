import {
  BRAND_DEFAULT_SCALE,
  BRAND_SCALES,
  brandCell,
  brandChart,
  brandsAtFoot,
  brandSpan,
  clockUnits,
  convert,
  convertChange,
  convertWith,
  cookingUnits,
  countedUnit,
  crossesDensity,
  formatClock,
  formatNumber,
  formatPair,
  fromBase,
  getCategory,
  getIngredient,
  getShoeBrand,
  getUnit,
  hasBrandCharts,
  INGREDIENT_KINDS,
  ingredients,
  isBrandScale,
  leadingTarget,
  matchIngredients,
  matchShoeBrands,
  NBSP,
  pairParts,
  pairsOpenedBy,
  parse,
  readBrand,
  resolveExact,
  roundToStep,
  search,
  shoeBrands,
  splitIngredient,
  splitShoeBrand,
  toBase,
  unitListGroup,
  type BrandChart,
  type BrandReading,
  type BrandRowReading,
  type Category,
  type CategoryId,
  type Ingredient,
  type ListGroup,
  type ParsedInput,
  type Separators,
  type ShoeBrand,
  type Unit,
  type UnitPreference,
} from '@bigsmall/core';
import { TYPING_CHUNK_MS } from '../../lib/timing';
import {
  SECTION_LABEL,
  sectionOf,
  sectionsOf,
  shows,
  SYSTEM_KEYS,
  type Section,
  type SectionKey,
  type ViewRule,
} from './settings';

/**
 * The converter's state and the pure reducer over it (docs/UX-SPEC.md §1, §7, §9): one box, the
 * category its table lists, and the calculator's entry, with one undo history for all of it. No
 * React, no DOM: everything here is unit-tested in node.
 */

/** The calculator's own entry (docs/UX-SPEC.md §8). `fresh` is true right after =, when a digit starts over. */
export interface CalculatorState {
  text: string;
  fresh: boolean;
}

/**
 * The chart line a brand is read on where the scale does not say it (ADR 0028, 2026-10-20): the
 * women's charts, from a US women's size, kept as the box moves across the genderless scales.
 */
export type ShoeLine = 'women';

export interface ConverterState {
  /** What the user typed into the box: a number, a unit's name, or both. */
  text: string;
  /** The unit in the box, by id. */
  unit: string | null;
  /**
   * The category the table lists: the unit's, or one chosen before any unit (docs/UX-SPEC.md §1).
   * Using a unit and choosing a category set it; removing the unit keeps it, so its table stays
   * in place; clear empties it.
   */
  category: CategoryId | null;
  /**
   * The ingredient in the box, by id, beside its unit (ADR 0021): with one, the table is Cooking's,
   * a weight and a volume converting through its density. Null outside Cooking.
   */
  ingredient: string | null;
  /**
   * The brand in the box, by id, beside its shoe scale (ADR 0028): with one, the scale rows are
   * its own chart's and every brand's row reads its chart at the same foot. Null outside Shoe
   * size.
   */
  brand: string | null;
  /**
   * The chart line a brand is read on where the scale does not say it (ADR 0028, 2026-10-20):
   * women's, from a US women's size, kept while the box moves across the genderless scales (EU,
   * UK, JP, mm, cm), so a women's reading stays women's; null is men's, or the brand's one chart.
   * A US men's size clears it, as does any other category. Null outside Shoe size.
   */
  line: ShoeLine | null;
  /**
   * The calculator's scratch entry. It lives here, outside the conversion, so one history holds
   * everything: undo goes from a send back into the arithmetic that produced it.
   */
  calc: CalculatorState;
}

/** Where typing lands: the box, or the calculator's entry. */
type TextTarget = 'box' | 'calc';

/** The part of the state a URL or a later persistence layer restores, through the `hydrate` action. */
export type Restorable = Partial<
  Pick<ConverterState, 'text' | 'unit' | 'ingredient' | 'brand' | 'line'>
>;

export const EMPTY_CALC: CalculatorState = { text: '', fresh: false };

export const initialState: ConverterState = {
  text: '',
  unit: null,
  category: null,
  ingredient: null,
  brand: null,
  line: null,
  calc: EMPTY_CALC,
};

/** The categories Cooking looks over (ADR 0021): a unit of these keeps the box's ingredient. */
const COOKING_OVER: ReadonlySet<CategoryId> = new Set(getCategory('cooking')?.over ?? []);

/** A brand stays in the box beside a shoe scale alone (ADR 0028). */
const SHOE: CategoryId = 'shoe-size';

/**
 * The chart line after a unit comes into the box (ADR 0028): a US women's size says women's, a
 * US men's size men's, the other shoe scales keep the line, any other unit leaves it; no unit
 * keeps it.
 */
function lineAfter(unit: Unit | undefined, line: ShoeLine | null): ShoeLine | null {
  if (!unit) return line;
  if (unit.category !== SHOE) return null;
  if (unit.id === 'us-women') return 'women';
  if (unit.id === 'us-men') return null;
  return line;
}

/** Whether the women's charts answer: a US women's size, or the women's line kept on a scale that does not say it. */
function readsWomen(unit: Unit | null, line: ShoeLine | null): boolean {
  return unit?.id === 'us-women' || (line === 'women' && unit?.id !== 'us-men');
}

export type Action =
  /** A keystroke or paste in the box. `at` is a monotonic time in ms; only gaps between inputs matter. */
  | { type: 'input'; text: string; at: number }
  /** A whole new text as one undoable step: arithmetic turned into its value, a number sent from the calculator, a step of Escape. */
  | { type: 'replace'; text: string }
  /** A calculator key that edits its entry the way typing does: chunked for undo and Escape. */
  | { type: 'calcType'; text: string; fresh: boolean; at: number }
  /** = or C in the calculator: a whole new entry as one undoable step. */
  | { type: 'calcSet'; text: string; fresh: boolean }
  /**
   * A unit taken into the box, from a row or a match: the unit, and the box's new text (the row's
   * value, or the number as typed); with the ingredient a match brought ("2 cups flour"), by id;
   * the brand a match or a row brought (ADR 0028), and the chart line the chip's list read it on.
   */
  | {
      type: 'use';
      unit: string;
      text: string;
      ingredient?: string | null;
      brand?: string | null;
      line?: ShoeLine | null;
    }
  /**
   * An ingredient taken into the box (a match, or a choice in Cooking's list): Cooking, the box
   * keeping a weight or a volume, and its new text, the number as typed.
   */
  | { type: 'useIngredient'; ingredient: string; text: string }
  /** The ingredient taken out (its pill's ×, Backspace): a weight or a volume stays, in its own category. */
  | { type: 'removeIngredient' }
  /**
   * A brand taken into the box (a match, a brand's row, or a choice in the brands' list; ADR
   * 0028): Shoe size, the box keeping a shoe scale, and its new text, the number as typed.
   */
  | { type: 'useBrand'; brand: string; text: string }
  /** The brand taken out (its pill's ×, Backspace, ISO's row): the scale stays, ISO's chart answering. */
  | { type: 'removeBrand' }
  /**
   * A category chosen (its menu, a start tile, or a category match): the box keeps its number and
   * drops any query, and keeps its unit only if it is of that category, so a typed number is never
   * converted from a unit nobody chose (docs/UX-SPEC.md §1).
   */
  | { type: 'chooseCategory'; category: CategoryId }
  /** The unit taken out of the box (the chip's ×, Backspace on an empty box): its category stays. */
  | { type: 'unlock' }
  | { type: 'clear' }
  | { type: 'hydrate'; state: Restorable };

export function reduce(state: ConverterState, action: Action): ConverterState {
  switch (action.type) {
    case 'input':
    case 'replace':
      return { ...state, text: action.text };

    case 'use': {
      const unit = getUnit(action.unit);
      if (!unit) return state;
      // A unit of one ingredient alone brings it; a weight or a volume keeps the box's ingredient,
      // or takes the one its match came with; any other unit leaves Cooking.
      const ingredient =
        unit.ingredient ?? (action.ingredient === undefined ? state.ingredient : action.ingredient);
      const cooks = ingredient !== null && COOKING_OVER.has(unit.category);
      // A shoe scale keeps the box's brand, or takes the one its match or row came with (null
      // from ISO's row); any other unit leaves the brand behind (ADR 0028).
      const brand = action.brand === undefined ? state.brand : action.brand;
      return {
        ...state,
        text: action.text,
        unit: unit.id,
        ingredient: cooks ? ingredient : null,
        brand: unit.category === SHOE && brand && getShoeBrand(brand) ? brand : null,
        line: lineAfter(unit, action.line === undefined ? state.line : action.line),
        category: cooks ? 'cooking' : unit.category,
      };
    }

    case 'useBrand': {
      if (!getShoeBrand(action.brand)) return state;
      const unit = state.unit ? getUnit(state.unit) : undefined;
      // The box keeps a shoe scale; a unit of another category goes.
      const keeps = unit !== undefined && unit.category === SHOE;
      return {
        ...state,
        text: action.text,
        brand: action.brand,
        unit: keeps ? state.unit : null,
        ingredient: null,
        category: SHOE,
      };
    }

    case 'removeBrand':
      return { ...state, brand: null };

    case 'useIngredient': {
      if (!getIngredient(action.ingredient)) return state;
      const unit = state.unit ? getUnit(state.unit) : undefined;
      // The box keeps a weight or a volume; a unit of another ingredient alone, or of another
      // category, goes.
      const keeps =
        unit !== undefined &&
        COOKING_OVER.has(unit.category) &&
        (!unit.ingredient || unit.ingredient === action.ingredient);
      return {
        ...state,
        text: action.text,
        ingredient: action.ingredient,
        unit: keeps ? state.unit : null,
        category: 'cooking',
      };
    }

    case 'removeIngredient': {
      const unit = state.unit ? getUnit(state.unit) : undefined;
      // A unit of that ingredient alone (a stick of butter) goes with it. Cooking stays, its
      // ingredients to choose from again, a weight or a volume waiting in the box: one pill's ×
      // dropping the box into Volume was jarring (Sean, 2026-10-16). Only a unit of another
      // category, or another category chosen, leaves Cooking.
      const keeps = unit !== undefined && !unit.ingredient;
      return { ...state, ingredient: null, unit: keeps ? state.unit : null, category: 'cooking' };
    }

    case 'chooseCategory': {
      const unit = state.unit ? getUnit(state.unit) : undefined;
      // Choosing the category the box is already in, or Cooking over it, keeps its unit.
      const over = getCategory(action.category)?.over ?? [];
      const fits =
        unit !== undefined && (unit.category === action.category || over.includes(unit.category));
      return {
        ...state,
        text: parse(state.text).valueText ?? '',
        unit: fits ? state.unit : null,
        category: action.category,
        // Cooking keeps its ingredient, Shoe size its brand; any other category leaves them.
        ingredient: action.category === 'cooking' ? state.ingredient : null,
        brand: action.category === SHOE ? state.brand : null,
        line: action.category === SHOE ? state.line : null,
      };
    }

    case 'unlock':
      return { ...state, unit: null };

    case 'calcType':
    case 'calcSet':
      return { ...state, calc: { text: action.text, fresh: action.fresh } };

    case 'clear':
      // Clear all empties the conversion; the calculator's scratch entry is not part of it.
      return { ...initialState, calc: state.calc };

    case 'hydrate': {
      // A URL holds a unit, an ingredient, or a brand, not a category: they name it.
      const next = { ...state, ...action.state };
      const unit = next.unit ? getUnit(next.unit) : undefined;
      const named = next.ingredient && getIngredient(next.ingredient) ? next.ingredient : null;
      const ingredient = unit?.ingredient ?? named;
      const cooks = ingredient !== null && (!unit || COOKING_OVER.has(unit.category));
      // A brand needs a shoe scale, or no unit yet (ADR 0028).
      const brand =
        next.brand && getShoeBrand(next.brand) && (!unit || unit.category === SHOE)
          ? next.brand
          : null;
      return {
        ...next,
        ingredient: cooks ? ingredient : null,
        brand,
        line: lineAfter(unit, next.line === 'women' ? 'women' : null),
        category: cooks ? 'cooking' : (unit?.category ?? (brand ? SHOE : null)),
      };
    }
  }
}

/**
 * How this visitor writes numbers: the separators typed text is read with, and the locale results
 * are formatted in (the runtime's own when undefined). The views, the calculator, and the island
 * share it.
 */
export interface NumberEnv {
  separators: Separators;
  locale?: string | undefined;
}

/** The box as the field shows it: its text, its unit, and the text as parsed. */
export interface BoxView {
  text: string;
  unit: Unit | null;
  /** The ingredient beside the unit, Cooking's second pill (ADR 0021). */
  ingredient: Ingredient | null;
  /** The brand beside the unit, Shoe size's second pill (ADR 0028). */
  brand: ShoeBrand | null;
  /** The chart line a brand is read on where the scale does not say it (ADR 0028). */
  line: ShoeLine | null;
  parsed: ParsedInput;
}

export function selectBox(state: ConverterState, options: NumberEnv): BoxView {
  return {
    text: state.text,
    unit: state.unit ? (getUnit(state.unit) ?? null) : null,
    ingredient: state.ingredient ? (getIngredient(state.ingredient) ?? null) : null,
    brand: state.brand ? (getShoeBrand(state.brand) ?? null) : null,
    line: state.line,
    parsed: parse(state.text, options.separators),
  };
}

/** The digits a box shows a value moved into it to (docs/UX-SPEC.md §7). */
export const BOX_PRECISION = 10;

/**
 * A pair's value as its parts, to significant digits of the whole (formatPair), in the pair's own
 * notation (5′ 11″), or in its parts' words for speech (`words`): the table's six, or the box's
 * ten for a pair row moved into the box. Where the total is past what places mean, the value in
 * the pair's first part alone.
 */
export function pairText(
  value: number,
  unit: Unit,
  locale: string | undefined,
  digits: number = TABLE_PRECISION,
  words = false,
): string {
  const written = formatPair(value, unit, {
    rounding: 'nearest',
    significant: digits,
    locale,
    words,
  });
  if (written) return written.text;
  const first = pairParts(unit)[0];
  return `${formatNumber(value, { precision: digits, locale })}${first ? ` ${first.symbol}` : ''}`;
}

/**
 * Why a conversion has no answer to show: beyond what a double holds, rounded to zero, arithmetic
 * with no answer (a division by zero, a power with no real value), or 0 in a reciprocal unit.
 */
type NoAnswer = 'large' | 'small' | 'divide-by-zero' | 'not-real' | 'zero';

/**
 * What the converter says when there is no answer to show (docs/UX-SPEC.md §1, §8): in full in
 * place of the table's rows, and in short in a row or in the calculator's display.
 */
export const NO_ANSWER_MESSAGES: Record<NoAnswer, { long: string; short: string }> = {
  large: { long: 'Too large to convert', short: 'Too large' },
  small: { long: 'Too small to convert', short: 'Too small' },
  'divide-by-zero': { long: 'Can’t divide by zero', short: 'Can’t divide by zero' },
  'not-real': { long: 'No real answer', short: 'No real answer' },
  zero: { long: 'Undefined for 0', short: 'Undefined for 0' },
};

/** What the matches say when a typed unit matches nothing (docs/UX-SPEC.md §1). */
export function noMatchMessage(query: string): string {
  return `No unit matches “${query}”. Try ml, feet, or °F.`;
}

// ---------------------------------------------------------------------------
// The table (ADR 0012, docs/UX-SPEC.md §1): under the box, what it needs next: the categories to
// start from, its category's units with their values, or the units a typed query matches.

/**
 * Significant digits a row shows with No limit: few enough to compare rows at a glance. The row's
 * own text is these to the nearest; Up and Down take the same cut (ConversionTable, Sean, 2026-10-18).
 */
export const TABLE_PRECISION = 6;

/** In place of a value the table cannot show yet: no number, or no unit to convert from. */
export const NO_VALUE = '—';

/** At most this many matches while a unit is typed. */
const MATCH_LIMIT = 20;

/** A row, with what the table component shows (components/ConversionTable.tsx) and what lies behind it. */
export interface TableRow {
  unit: Unit;
  /** The unit's id. */
  id: string;
  /** Singular or plural to agree with the value ("1 cup", "2.5 cups"). */
  name: string;
  symbol: string;
  /**
   * The value in this unit at full precision, for copying and for moving into the box; null
   * without one. A row beyond its scale holds the scale's end (13.5), for the table to write as
   * a size under the display.
   */
  value: number | null;
  /** As the row shows it: TABLE_PRECISION significant digits, "Too large" or "Too small", or NO_VALUE. */
  text: string;
  /**
   * What the text is: a value; a dash, while there is no number or no unit to convert from; a
   * message, when a double cannot hold the value and there is nothing to copy or move; or
   * beyond, where the value lies past the row's scale (a children's table, ADR 0027): the text
   * is the sign and where the scale ends ("> 13.5", "< 4"), and taking the row brings its unit
   * with the number cleared, for a size of its own.
   */
  tone: 'value' | 'empty' | 'message' | 'beyond';
  /** The unit in the box. */
  inBox: boolean;
  /** A pace's value, in minutes and seconds (5:30), whatever the display's places or fractions. */
  clock: boolean;
  /**
   * Not exact: converted through an ingredient's density (Cooking's ≈, ADR 0021), or rounded to
   * a scale's step (a shoe size's, ADR 0027).
   */
  approx: boolean;
  /**
   * A size on a scale marked in steps (ADR 0027): its value and text are the step the conversion
   * rounds to, ≈ where that moved it, whatever Display's places or fractions, and it copies and
   * moves into the box as it shows.
   */
  stepped: boolean;
  /**
   * A pair (ADR 0026), the unit itself: its value is written as its parts, the total rounded and
   * then split (core's formatPair), whatever Display's places or fractions, and copies as it shows.
   */
  pair?: Unit | undefined;
  /**
   * A brand's row under the table (ADR 0028): the brand, by id, with the line of the chart read,
   * taking the row bringing the brand with its size. The row's unit is the scale the size is
   * written on.
   */
  brand?: { id: string; line: BrandChart['line'] } | undefined;
  /** Words after the name, in the muted ink: a brand row's chart line where the scale does not say it, why it has no size, or where a row beyond its scale stands (above its range). */
  detail?: string | undefined;
  /**
   * The brand's cell as printed (ADR 0028), a range ("9–9.5") or a third ("44 2/3"): its text
   * stands whatever Display's places or fractions, split at its first number's end as every value
   * is at its mark, so the first number lines up with the whole numbers (Sean, 2026-10-20).
   */
  printed?: true | undefined;
}

/** A match while a unit is typed: a unit, or a category whose name matched, to open. */
type MatchRow =
  /** A unit, with the target the query names after it where a split read it ("11 w e": "e"). */
  | { kind: 'unit'; unit: Unit; category: Category; inBox: boolean; target?: string | undefined }
  | { kind: 'category'; category: Category }
  /**
   * An ingredient, under Cooking (ADR 0021), with the unit typed before it when there was one
   * ("2 cups flour": the cup), which taking it brings too; in Cooking's list with no ingredient,
   * the heading of its kind it is listed under (`group`), in place of the category's.
   */
  | {
      kind: 'ingredient';
      ingredient: Ingredient;
      unit: Unit | null;
      category: Category;
      inBox: boolean;
      group?: string;
    }
  /**
   * A brand, under Shoe size (ADR 0028), with the scale typed beside it when there was one ("nike
   * women 8": US women; a bare size, US men's), which taking it brings too, and the number the
   * query carried after the brand ("nike 10": "10"), or none, the box's own; the target a split
   * read after it ("nike 10 to eu"); in the brands' list, under their one heading (`group`).
   */
  | {
      kind: 'brand';
      brand: ShoeBrand;
      unit: Unit | null;
      category: Category;
      inBox: boolean;
      text?: string | undefined;
      target?: string | undefined;
      /** The chart line to read the brand on, from the chip's list (ADR 0028, 2026-10-20); null the scale's own. */
      line?: ShoeLine | null | undefined;
      group?: string;
    };

interface TableViewBase {
  /** The categories the converter offers, in the start's tiles and in the category menu. */
  categories: Category[];
  /** What the live region says once the view settles, if anything. */
  announcement: string | null;
}

/** Before any category: the categories to start from. */
interface StartView extends TableViewBase {
  kind: 'start';
}

/**
 * A category's units: with values once the box has a number and a unit, a dash for each until
 * then. Those the settings show are in their sections (docs/UX-SPEC.md §3), and `rows` is them in
 * that order, the order the cursor moves in; those they hide wait in `hidden`, in theirs.
 */
export interface UnitsView extends TableViewBase {
  kind: 'units';
  category: CategoryId;
  rows: TableRow[];
  sections: Section<TableRow>[];
  hidden: Section<TableRow>[];
  /** Every row, shown or hidden: what the table's columns are sized to, so nothing moves. */
  all: TableRow[];
  /** In place of the rows when the box's value has no answer: "Too large to convert". */
  message: string | null;
  /**
   * A line under the table: Cooking's, how its ingredient's cup is filled, or a category's own,
   * what its figures rest on (the shoe sizes'; ADR 0027).
   */
  note: string | null;
  /**
   * A line above the rows, for what the whole table waits on: the brands' charts loading, or
   * failed to load, with a brand in the box (ADR 0029; Sean, 2026-10-21: under the table it was
   * too far down to see).
   */
  notice?: string | undefined;
  /**
   * A target typed after the number with the unit in the box ("11 to eu"; ADR 0027;
   * docs/UX-SPEC.md §5), as typed: the row the cursor rests on (`targetRow`), empty while it is
   * still to come ("11 to").
   */
  target?: string | undefined;
}

/** While a unit is typed: matches from every category, under their category, without values. */
interface MatchesView extends TableViewBase {
  kind: 'matches';
  /**
   * The category the converter is in, the box's unit's or the one chosen, or null: its matches
   * come first, and the category menu keeps naming it while the unit is typed.
   */
  category: CategoryId | null;
  /** The typed unit, whose matched letters the rows set heavier. */
  query: string;
  /** Each category's matches together, its own row first, the groups in the order of their best match. */
  rows: MatchRow[];
  /** How many units match, per category with any match; one that matched by name alone counts 0. */
  counts: Partial<Record<CategoryId, number>>;
  /** The units that match but the settings hide, with their section's name, offered apart. */
  hidden: HiddenMatch[];
  /**
   * The unit the query names after its head ("us 11 to eu": "eu"; ADR 0027; docs/UX-SPEC.md §4),
   * as typed, for the cursor to rest on its row once a match is taken; none without one.
   */
  target?: string | undefined;
}

/** A hidden unit that matches, with the name of the section it would show in. */
interface HiddenMatch {
  unit: Unit;
  category: Category;
  section: string;
  /** The target the query names after it, as a unit row's. */
  target?: string | undefined;
}

export type TableView = StartView | UnitsView | MatchesView;

/**
 * The brands' charts' state (ADR 0029): idle until wanted, loading while the web app fetches the
 * file, ready once core has it, failed when the fetch did.
 */
export type ChartsStatus = 'idle' | 'loading' | 'ready' | 'failed';

interface TableOptions extends NumberEnv {
  /** The visitor's unit family, listed first. */
  system: UnitPreference;
  /**
   * The brands' charts' state, from the island's hook (ADR 0029); without it, ready once core
   * holds them (the tests and the build hand the file over first), else loading.
   */
  charts?: ChartsStatus;
  /** Which units show (settings.ts); without one, every unit does. */
  rule?: ViewRule;
  /** The sections' order (settings.ts); without one, a fresh visit's. */
  order?: readonly SectionKey[];
}

/** Every system switched on and no unit chosen on its own: every unit shows. */
const SHOW_ALL: ViewRule = { shown: new Set(SYSTEM_KEYS), overrides: new Map() };

/** Every unit and category, specialty ones too: the table has no standard and specialty modes (docs/UX-SPEC.md §3). */
const EVERY_TIER = 'all';

/** What the table shows under the box: the matches while a unit is typed, else the category's units, else the start. */
export function selectTable(state: ConverterState, options: TableOptions): TableView {
  const parsed = parse(state.text, options.separators);
  const unit = state.unit ? (getUnit(state.unit) ?? null) : null;
  const ingredient = state.ingredient ? (getIngredient(state.ingredient) ?? null) : null;
  const brand = state.brand ? (getShoeBrand(state.brand) ?? null) : null;
  // Cooking looks over the unit's own category.
  const category = state.category === 'cooking' ? 'cooking' : (unit?.category ?? state.category);
  const base = {
    categories: search('', { tier: EVERY_TIER }).results.flatMap((result) =>
      result.kind === 'category' ? [result.category] : [],
    ),
  };
  // A compound names its pair (ADR 0026): offered as the match to take, first, with whatever a
  // trailing query matches ("5'11 cm"), until it is the unit in the box.
  const pair = parsed.compound ? getUnit(parsed.compound.unit) : undefined;
  if (pair && pair.id !== unit?.id) {
    const typed = parsed.query ?? '';
    const rest: MatchesView = typed
      ? selectMatches(base, typed, unit, category, options, parsed.valueText)
      : {
          ...base,
          kind: 'matches',
          category,
          query: '',
          rows: [],
          counts: {},
          hidden: [],
          announcement: null,
        };
    return withPairFirst(rest, pair, options);
  }
  // A clock names its units (ADR 0026; Sean, 2026-10-20): typed alone, "5:55" offers the units
  // written as a clock, the time pair first, then the paces, until one is in the box; a unit
  // typed after it, or in the box, takes the clock as a number.
  if (parsed.clock && !unit && !typingUnit(parsed)) {
    return withClockUnits(base, category, parsed, options);
  }
  // A number and a lone foot mark are feet (ADR 0026: "6'" is six feet), and the pair the mark
  // opens is offered after them, in case the inches follow (Sean, 2026-10-20).
  const opened =
    parsed.value !== undefined && parsed.query
      ? pairsOpenedBy(parsed.query).filter((pair) => pair.id !== unit?.id)
      : [];
  if (opened.length > 0) {
    return withPairsAfter(
      selectMatches(base, parsed.query ?? '', unit, category, options, parsed.valueText),
      opened,
      options,
    );
  }
  // A target typed after the number with a unit in the box ("11 to eu", "11 in"; ADR 0027): the
  // table stays, converting, and the target names the row the cursor rests on (TableLayout).
  const typed =
    unit !== null && parsed.value !== undefined && parsed.query !== undefined
      ? leadingTarget(parsed.query)
      : null;
  if (typed !== null && category && category !== 'cooking') {
    return category === SHOE
      ? selectShoe(base, unit, parsed, options, brand, state.line, typed)
      : selectUnits(base, category, unit, parsed, options, typed);
  }
  if (typingUnit(parsed)) {
    return selectMatches(base, parsed.query ?? '', unit, category, options, parsed.valueText);
  }
  if (!category) return { ...base, kind: 'start', announcement: null };
  if (category === 'cooking') {
    return ingredient
      ? selectCooking(base, ingredient, unit, parsed, options)
      : ingredientList(base);
  }
  // Shoe size with or without a brand (ADR 0028): the brands' rows under the scales either way.
  if (category === SHOE) return selectShoe(base, unit, parsed, options, brand, state.line);
  return selectUnits(base, category, unit, parsed, options);
}

/**
 * The units written as a clock, offered for a clock typed alone (Sean, 2026-10-20): the category
 * the converter is in first, as matches always come; else by the clock's shape, two parts being
 * minutes and seconds, a pace, and three hours, minutes, seconds; the paces with the visitor's own
 * first, the mile's where the region is not metric.
 */
function withClockUnits(
  base: ViewBase,
  current: CategoryId | null,
  parsed: ParsedInput,
  options: TableOptions,
): MatchesView {
  const parts = (parsed.valueText ?? '').split(':').length;
  const timeFirst = current === 'time' || (current !== 'speed' && parts >= 3);
  const metric = options.system === 'metric';
  const rank = (clock: Unit): number => {
    const group = (clock.pace ? !timeFirst : timeFirst) ? 0 : 10;
    const own = clock.pace && (clock.system === 'metric') !== metric ? 1 : 0;
    return group + own;
  };
  const listed: MatchRow[] = [...clockUnits()]
    .sort((a, b) => rank(a) - rank(b))
    .flatMap((clock) => {
      const category = getCategory(clock.category);
      return category ? [{ kind: 'unit', unit: clock, category, inBox: false }] : [];
    });
  const { rows, hidden } = apart(listed, [], options);
  return {
    ...base,
    kind: 'matches',
    category: current,
    query: '',
    rows,
    counts: countsOf(rows),
    hidden,
    announcement:
      rows.length > 0
        ? `${rows.length} ${rows.length === 1 ? 'unit' : 'units'} written as a clock`
        : matchesAnnouncement(rows, hidden),
  };
}

/** The matches with the pairs a lone mark opens after them, each at its category's group's end. */
function withPairsAfter(
  view: MatchesView,
  opened: readonly Unit[],
  options: TableOptions,
): MatchesView {
  const listed = [...view.rows];
  for (const pair of opened) {
    const category = getCategory(pair.category);
    if (!category || listed.some((row) => row.kind === 'unit' && row.unit.id === pair.id)) continue;
    const last = listed.map((row) => row.category.id).lastIndexOf(pair.category);
    listed.splice(last < 0 ? listed.length : last + 1, 0, {
      kind: 'unit',
      unit: pair,
      category,
      inBox: false,
    });
  }
  const { rows, hidden } = apart(listed, view.hidden, options);
  return {
    ...view,
    rows,
    counts: countsOf(rows),
    hidden,
    announcement: matchesAnnouncement(rows, hidden),
  };
}

/** The matches with a compound's pair leading them, its category's group first, counted once. */
function withPairFirst(view: MatchesView, pair: Unit, options: TableOptions): MatchesView {
  const category = getCategory(pair.category);
  if (!category) return view;
  const rest = view.rows.filter((row) => !(row.kind === 'unit' && row.unit.id === pair.id));
  const own = rest.filter((row) => row.category.id === pair.category);
  const others = rest.filter((row) => row.category.id !== pair.category);
  const listed: MatchRow[] = [
    { kind: 'unit', unit: pair, category, inBox: false },
    ...own,
    ...others,
  ];
  const { rows, hidden } = apart(listed, view.hidden, options);
  return {
    ...view,
    rows,
    counts: countsOf(rows),
    hidden,
    announcement: matchesAnnouncement(rows, hidden),
  };
}

/**
 * The units the settings hide set apart from the matches, under their sections' names
 * (docs/UX-SPEC.md §3; ADR 0018), whatever matched them: a typed name, a compound's or a clock's
 * shape, or the mark that opens a pair; one rule for every list of matches (Sean, 2026-10-20: a
 * compound's pair and a clock's units had been offered hidden or not). The box's unit always
 * shows. Those set apart here follow any already apart, each unit once.
 */
function apart(
  listed: readonly MatchRow[],
  hidden: readonly HiddenMatch[],
  options: TableOptions,
): { rows: MatchRow[]; hidden: HiddenMatch[] } {
  const rule = options.rule ?? SHOW_ALL;
  const rows: MatchRow[] = [];
  const more: HiddenMatch[] = [];
  for (const row of listed) {
    if (row.kind !== 'unit' || row.inBox || shows(row.unit, rule, options.system)) rows.push(row);
    else if (!hidden.some((each) => each.unit.id === row.unit.id)) {
      const section = SECTION_LABEL[sectionOf(row.unit, options.system)];
      more.push({ unit: row.unit, category: row.category, section, target: row.target });
    }
  }
  return { rows, hidden: [...hidden, ...more] };
}

/** How many units match, per category with any match; one that matched by name alone counts 0. */
function countsOf(rows: readonly MatchRow[]): Partial<Record<CategoryId, number>> {
  const counts: Partial<Record<CategoryId, number>> = {};
  for (const row of rows) {
    counts[row.category.id] = (counts[row.category.id] ?? 0) + (row.kind === 'category' ? 0 : 1);
  }
  return counts;
}

/** What the live region says of the matches: how many, or that only hidden units, or none, match. */
function matchesAnnouncement(rows: readonly MatchRow[], hidden: readonly HiddenMatch[]): string {
  if (rows.length > 0) return `${rows.length} ${rows.length === 1 ? 'match' : 'matches'}`;
  return hidden.length > 0 ? 'Only hidden units match' : 'No unit matches';
}

/** Each kind's heading, by its id. */
const KIND_NAME = new Map(INGREDIENT_KINDS.map((kind) => [kind.id, kind.name]));

/**
 * Every ingredient, to choose from, under its kind's heading, in the data's order, the kinds'
 * (ADR 0021): Cooking's list with no ingredient yet, and, with one, the list its pill opens (a
 * trial, Sean, 2026-10-16), the one in the box marked as a unit in the box is.
 */
export function ingredientList(base: ViewBase, current: Ingredient | null = null): MatchesView {
  const cooking = getCategory('cooking');
  const rows: MatchRow[] = cooking
    ? ingredients.map((ingredient) => ({
        kind: 'ingredient',
        ingredient,
        unit: null,
        category: cooking,
        inBox: ingredient.id === current?.id,
        group: KIND_NAME.get(ingredient.kind) ?? cooking.name,
      }))
    : [];
  return {
    ...base,
    kind: 'matches',
    category: 'cooking',
    query: '',
    rows,
    counts: { cooking: rows.length },
    hidden: [],
    announcement: `${rows.length} ingredients to choose from`,
  };
}

/** Rank of a unit's group for a visitor: their own system first (order.ts). */
const GROUP_RANK: Record<ListGroup, number> = { own: 0, other: 1, neither: 2, specialty: 3 };

/** Cooking's units for an ingredient, Weight's then Volume's, each the visitor's own system first. */
function cookingListed(ingredient: Ingredient, inBox: Unit | null, system: UnitPreference): Unit[] {
  const listed = cookingUnits(ingredient);
  // A weight or a volume Cooking does not list (a pint) stays listed while it is in the box.
  if (inBox && !listed.some((each) => each.id === inBox.id)) listed.push(inBox);
  return (['mass', 'volume'] as const).flatMap((quantity) =>
    listed
      .filter((each) => each.category === quantity)
      .map((each, index) => ({ each, index, rank: GROUP_RANK[unitListGroup(each, system)] }))
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map(({ each }) => each),
  );
}

/**
 * The line under Cooking's table (ADR 0021; docs/research/cooking-2.md): how the cup is filled,
 * and nothing more (Sean, 2026-10-17): the convention is what a visitor acts on, the cup's weight
 * shows in the table itself once a cup is typed, and the About page keeps every figure with its
 * weighings. "All-purpose flour: spooned and leveled"; "Eggs: beaten, poured to the line".
 */
function cookingNote(ingredient: Ingredient): string {
  const name = ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1);
  return `${name}: ${ingredient.method}`;
}

/**
 * Cooking with an ingredient (ADR 0021): Weight's units, then Volume's, each the visitor's own
 * system first, as the settings show them; across the two, values go through the ingredient's
 * density, marked ≈; under them, the line saying what was weighed.
 */
function selectCooking(
  shared: ViewBase,
  ingredient: Ingredient,
  unit: Unit | null,
  parsed: ParsedInput,
  options: TableOptions,
): UnitsView {
  const base = { ...shared, kind: 'units', category: 'cooking' } as const;
  const rule = options.rule ?? SHOW_ALL;
  const note = cookingNote(ingredient);
  const listed = cookingListed(ingredient, unit, options.system);
  const isShown = (row: TableRow) => row.inBox || shows(row.unit, rule, options.system);
  const sectioned = (rows: TableRow[]): Section<TableRow>[] =>
    (['mass', 'volume'] as const).flatMap((quantity) => {
      const inIt = rows.filter((row) => row.unit.category === quantity);
      if (inIt.length === 0) return [];
      const key = quantity === 'mass' ? ('weight' as const) : ('volume' as const);
      return [{ key, label: SECTION_LABEL[key], rows: inIt }];
    });

  const problem = parsed.outOfRange ?? parsed.invalid;
  if (unit && problem) {
    return {
      ...base,
      rows: [],
      sections: [],
      hidden: [],
      all: [],
      message: NO_ANSWER_MESSAGES[problem].long,
      note,
      announcement: NO_ANSWER_MESSAGES[problem].long,
    };
  }

  const value = unit ? parsed.value : undefined;
  const all = listed.map((target) =>
    unit && value !== undefined
      ? valueRow(target, unit, value, options.locale, (amount, from, to) =>
          safeWith(amount, from, to, ingredient),
        )
      : emptyRow(target, unit),
  );
  const sections = sectioned(all.filter(isShown));
  const rows = sections.flatMap((section) => section.rows);
  const of = `of ${ingredient.name}`;
  return {
    ...base,
    rows,
    sections,
    hidden: sectioned(all.filter((row) => !isShown(row))),
    all,
    message: null,
    note,
    announcement:
      unit && value !== undefined
        ? `${spokenAmount(parsed, unit, options.locale)} ${of} in ${rows.length} units`
        : `${rows.length} units ${of}`,
  };
}

/** What every view of the table carries. */
type ViewBase = Pick<TableViewBase, 'categories'>;

function selectUnits(
  shared: ViewBase,
  category: CategoryId,
  unit: Unit | null,
  parsed: ParsedInput,
  options: TableOptions,
  target?: string,
): UnitsView {
  const listed = search('', {
    category,
    system: options.system,
    tier: EVERY_TIER,
  }).results.flatMap((result) => (result.kind === 'unit' ? [result.unit] : []));
  const kind = getCategory(category)?.name.toLowerCase() ?? '';
  // A category's line under its table, what its figures rest on (the shoe sizes'; ADR 0027).
  const note = getCategory(category)?.note ?? null;
  const base = { ...shared, kind: 'units', category } as const;
  const rule = options.rule ?? SHOW_ALL;
  /** The rows as the settings arrange them: the shown ones in their sections, the hidden apart. */
  const arranged = (all: TableRow[]) => {
    const isShown = (row: TableRow) => row.inBox || shows(row.unit, rule, options.system);
    const sections = sectionsOf(all.filter(isShown), options.system, options.order);
    return {
      rows: sections.flatMap((section) => section.rows),
      sections,
      hidden: sectionsOf(
        all.filter((row) => !isShown(row)),
        options.system,
        options.order,
      ),
      all,
    };
  };

  const problem = parsed.outOfRange ?? parsed.invalid;
  if (unit && problem) {
    const from = spokenAmount(parsed, unit, options.locale);
    return {
      ...base,
      rows: [],
      sections: [],
      hidden: [],
      all: [],
      message: NO_ANSWER_MESSAGES[problem].long,
      note: null,
      announcement:
        problem === 'large' || problem === 'small'
          ? `${from} is too ${problem} to convert`
          : NO_ANSWER_MESSAGES[problem].long,
    };
  }

  /**
   * Temperature, readings on scales with zero points, says the box's number as a change too, in
   * a section after the readings (Sean, 2026-10-16): every shown scale but the box's own, by their
   * degree sizes alone, so 5 °C warmer is 9 °F warmer. A shoe scale is affine too, but a size is
   * no reading to take a difference of (ADR 0027).
   */
  const withChange = (view: ReturnType<typeof arranged>) => {
    if (category !== 'temperature') return view;
    const value = unit ? parsed.value : undefined;
    const rows = view.rows
      .filter((row) => row.unit.id !== unit?.id)
      .map((row) => changeRow(row.unit, unit, value, options.locale));
    if (rows.length === 0) return view;
    const section = {
      key: 'change' as const,
      label: changeLabel(parsed, unit, options.locale),
      rows,
      repeats: true as const,
    };
    return {
      ...view,
      rows: [...view.rows, ...rows],
      sections: [...view.sections, section],
      all: [...view.all, ...rows],
    };
  };

  if (!unit || parsed.value === undefined) {
    // Nothing to convert yet: every unit, a dash for its value, so the table stays in place.
    const view = arranged(listed.map((target) => emptyRow(target, unit)));
    return {
      ...base,
      ...withChange(view),
      message: null,
      note,
      target,
      announcement: `${view.rows.length} units of ${kind}`,
    };
  }

  const value = parsed.value;
  // A size outside its own scale (US C 20; ADR 0027): the other rows wait with dashes, a click on
  // one taking its unit with the number as typed, and the live region says the scale's span.
  const span = beyondOwnScale(unit, value) ? scaleSpan(unit, options.locale) : null;
  const view = arranged(
    listed.map((target) =>
      span !== null && target.id !== unit.id
        ? emptyRow(target, unit)
        : valueRow(target, unit, value, options.locale),
    ),
  );
  const from = spokenAmount(parsed, unit, options.locale);
  return {
    ...base,
    ...withChange(view),
    message: null,
    note,
    target,
    announcement:
      span !== null
        ? `${unit.name} runs ${span}`
        : `${from} in ${view.rows.length} units of ${kind}`,
  };
}

// ---------------------------------------------------------------------------
// Shoe size with a brand (ADR 0028; docs/research/shoe-sizes-2.md): the brand's own chart answers
// the scale rows, and every brand's row reads its chart at the same foot.

/** The brands' one heading, in the list their pill opens. */
const BRANDS_HEADING = 'Brands';

/** Why a brand's row has no size, after its name. */
/** Why a brand has no size on the scale, after its name: the dash's reason (ADR 0028). */
function whyWords(why: NonNullable<BrandRowReading['why']>, scaleUnit: Unit): string {
  if (why === 'no-length') return 'no foot length';
  if (why === 'no-scale') return `prints no ${scaleUnit.symbol}`;
  return 'off its chart';
}

/**
 * Every brand, to choose from, under one heading: the list the brand's pill opens (ADR 0028), the
 * one in the box marked as a unit in the box is, as Cooking's ingredients are listed.
 */
export function brandList(base: ViewBase, current: ShoeBrand | null = null): MatchesView {
  const shoe = getCategory(SHOE);
  const rows: MatchRow[] = shoe
    ? shoeBrands.map((brand) => ({
        kind: 'brand',
        brand,
        unit: null,
        category: shoe,
        inBox: brand.id === current?.id,
        group: BRANDS_HEADING,
      }))
    : [];
  return {
    ...base,
    kind: 'matches',
    category: SHOE,
    query: '',
    rows,
    counts: { [SHOE]: rows.length },
    hidden: [],
    announcement: `${rows.length} brands to choose from`,
  };
}

/**
 * The shoe scale some words name ("women", "eu", "cm", "m"): exactly, else the best match from
 * the start of a key; null where they name none.
 */
function shoeUnit(text: string, options: TableOptions): Unit | null {
  const exact = resolveExact(text, { system: options.system, category: SHOE });
  if (exact) return exact;
  const best = search(text, { system: options.system, category: SHOE, limit: 1 }).results[0];
  return best?.kind === 'unit' && best.matchClass <= 3 ? best.unit : null;
}

/**
 * The brands a typed query offers, under Shoe size (ADR 0028): first the one it names at either
 * end, with the scale typed beside it ("nike women 8": US women; "eu 43 new balance": European;
 * "nike 10", a bare size, US men's, as a bare "us" is men's, unless the box already holds a shoe
 * scale, which stays) and the number the rest carried, then those whose names match. `first` when
 * the group leads: the query names a brand, the converter is in Shoe size, or a brand matches
 * better than any unit. A shorthand key ("on", "nb") counts only where the category is named: in
 * Shoe size, or beside a scale ("nb eu 43").
 */
function brandMatches(
  query: string,
  typed: string | undefined,
  inBox: Unit | null,
  current: CategoryId | null,
  bestUnit: number | undefined,
  options: TableOptions,
): { rows: MatchRow[]; first: boolean } {
  const shoe = getCategory(SHOE);
  if (!shoe) return { rows: [], first: false };
  const named = current === SHOE;
  const rows: MatchRow[] = [];
  /** The split, and what its rest says: the number it carried, the scale, a target. */
  const read = (split: ReturnType<typeof splitShoeBrand>) => {
    if (!split) return null;
    let text = typed;
    let rest = split.rest;
    let target: string | undefined;
    if (rest) {
      const parsed = parse(rest, options.separators);
      if (parsed.value !== undefined) {
        text = parsed.valueText ?? text;
        rest = parsed.query ?? '';
      }
    }
    const lead = rest ? leadingTarget(rest) : null;
    if (lead !== null) {
      target = lead;
      rest = '';
    }
    const kept = inBox !== null && inBox.category === SHOE;
    const unit =
      rest === ''
        ? kept || text === undefined
          ? null
          : (getUnit(BRAND_DEFAULT_SCALE) ?? null)
        : shoeUnit(rest, options);
    if (rest !== '' && !unit) return null;
    // Whether the words named a scale themselves, rather than the bare size's default.
    return { brand: split.brand, unit, text, target, scaled: rest !== '' };
  };
  let split = read(splitShoeBrand(query, named));
  // A shorthand key beside a scale names the category ("nb eu 43"), as a query's target does.
  if (!split && !named) {
    const byScale = read(splitShoeBrand(query, true));
    if (byScale?.scaled && byScale.brand.shorthand?.length) split = byScale;
  }
  /** A brand's row from a reading of the query, with the scale and the number it carried. */
  const rowOf = (found: NonNullable<ReturnType<typeof read>>): MatchRow => ({
    kind: 'brand',
    brand: found.brand,
    unit: found.unit,
    category: shoe,
    inBox: false,
    text: found.text,
    target: found.target,
  });
  if (split) rows.push(rowOf(split));
  // A brand's name begun at either end, the other words naming the scale and carrying the number
  // ("11 us n": Nike and New Balance on US men's; "11 m us ni"; "nik us 11"; "eu 43 new"; "11
  // nik"): every brand the letters begin, each with that scale, from one letter, since the scale
  // words say the category (Sean, 2026-10-20: "11 m us ni" showed nothing until the name was
  // whole). The shortest beginning that reads wins, the tail tried first.
  const begun: NonNullable<ReturnType<typeof read>>[] = [];
  if (!split) {
    const words = query.trim().split(/\s+/).filter(Boolean);
    const tryBegun = (part: string[], other: string[]) => {
      for (const match of matchShoeBrands(part.join(' '), named)) {
        if (match.matchClass > 3) continue;
        const found = read({ rest: other.join(' '), brand: match.brand });
        if (found) begun.push(found);
      }
    };
    for (let k = 1; k <= words.length && begun.length === 0; k += 1) {
      tryBegun(words.slice(-k), words.slice(0, words.length - k));
    }
    for (let k = 1; k < words.length && begun.length === 0; k += 1) {
      tryBegun(words.slice(0, k), words.slice(k));
    }
  }
  for (const found of begun) {
    if (rows.some((row) => row.kind === 'brand' && row.brand.id === found.brand.id)) continue;
    rows.push(rowOf(found));
  }
  const matched = matchShoeBrands(query, named);
  for (const match of matched) {
    if (rows.some((row) => row.kind === 'brand' && row.brand.id === match.brand.id)) continue;
    rows.push({ kind: 'brand', brand: match.brand, unit: null, category: shoe, inBox: false });
  }
  const best = split ? 0 : begun.length > 0 ? 3 : (matched[0]?.matchClass ?? Infinity);
  return { rows, first: named || best < (bestUnit ?? Infinity) };
}

/** A size written as the table writes one, for the locale. */
function sizeOf(size: number, locale: string | undefined): string {
  return formatNumber(size, { precision: TABLE_PRECISION, locale });
}

/**
 * A size as a brand prints it (ADR 0028, as printed): a range's two ends ("9–9.5"), a third
 * ("44 2/3"), each standing whatever the display, else the size, which the display writes.
 */
function asPrinted(
  value: number,
  range: readonly [number, number] | undefined,
  locale: string | undefined,
): { text: string; printed: boolean } {
  if (range) {
    return { text: `${sizeOf(range[0], locale)}–${sizeOf(range[1], locale)}`, printed: true };
  }
  const halves = value * 2;
  if (Math.abs(halves - Math.round(halves)) < 1e-9)
    return { text: sizeOf(value, locale), printed: false };
  const whole = Math.floor(value);
  const part = value - whole;
  const third =
    Math.abs(part - 1 / 3) < 0.02 ? '1/3' : Math.abs(part - 2 / 3) < 0.02 ? '2/3' : null;
  return {
    text: third ? `${sizeOf(whole, locale)}${NBSP}${third}` : sizeOf(value, locale),
    printed: true,
  };
}

/** A row holding a brand's cell as printed: a size on a scale, as the brand prints it. */
function brandCellRow(
  target: Unit,
  from: Unit | null,
  value: number,
  range: readonly [number, number] | undefined,
  approx: boolean,
  locale: string | undefined,
): TableRow {
  const { text, printed } = asPrinted(value, range, locale);
  return {
    ...emptyRow(target, from),
    name: unitName(target, value),
    value,
    text,
    tone: 'value',
    approx,
    stepped: !printed,
    inBox: false,
    ...(printed ? { printed: true as const } : {}),
  };
}

/**
 * A scale row with a brand's size in the box (ADR 0028): ISO's rule from the foot the brand's
 * chart gives for that size, none the box's own, since the brand's row is the one value in focus
 * (Sean, 2026-10-20); a dash where there is no foot to read from.
 */
function fromFoot(row: TableRow, foot: number | null, locale: string | undefined): TableRow {
  const mondopoint = getUnit('mondopoint');
  if (foot === null || !mondopoint) return emptyRow(row.unit, null);
  return { ...valueRow(row.unit, mondopoint, foot, locale), inBox: false };
}

/** Every row of a view through one function, its sections and hidden rows too. */
function remapRows(view: UnitsView, map: (row: TableRow) => TableRow): UnitsView {
  const sections = view.sections.map((section) => ({
    ...section,
    rows: section.rows.map(map),
  }));
  return {
    ...view,
    all: view.all.map(map),
    rows: sections.flatMap((section) => section.rows),
    sections,
    hidden: view.hidden.map((section) => ({ ...section, rows: section.rows.map(map) })),
  };
}

/** The chart's line in the note's prose: "the men’s", "Nike’s women’s chart". */
const LINE_POSS: Record<BrandChart['line'], string> = {
  men: 'men’s',
  women: 'women’s',
  unisex: '',
};

/** The chart's line as a row's word, no possessive and no plural, as the units' names are (Sean, 2026-10-20). */
const LINE_WORD: Record<BrandChart['line'], string> = {
  men: 'men',
  women: 'women',
  unisex: '',
};

/**
 * The chart's line after a brand's name, where the scale does not say it: "men" or "women" on
 * EU, UK, JP, and the foot's units, nothing on US men's or US women's (Sean, 2026-10-20, the
 * hundred-and-nineteenth pass; the foot each chart gives stood there too, cut short on every
 * screen and saying what ≈ and the foot's rows already say).
 */
function lineWord(line: BrandChart['line'], scaleUnit: Unit): string {
  return scaleUnit.id === 'us-men' || scaleUnit.id === 'us-women' ? '' : LINE_WORD[line];
}

/** A brand row's words after its name, or none: the line where the scale does not say it, and why it has no size. */
function detailOf(
  line: BrandChart['line'],
  scaleUnit: Unit,
  why: string | null = null,
): string | undefined {
  return [lineWord(line, scaleUnit), why].filter(Boolean).join(' · ') || undefined;
}

/**
 * The brands' section (ADR 0028): one row per brand, its size on the scale for the foot in the
 * box, read from its own chart at the nearest row, ≈ where that row's foot is not the foot, as
 * printed; the brand in the box, with a size typed, as the box's own row, the one row filled, its
 * size as the chart prints it; a dash with why where a brand has no size. Repeats the scales in
 * another form, so Edit leaves it.
 */
function brandsSection(
  foot: number | null,
  scaleUnit: Unit,
  women: boolean,
  from: Unit | null,
  value: number | undefined,
  baseline: BrandReading | null,
  locale: string | undefined,
  charts: ChartsStatus,
): Section<TableRow> {
  const ready = charts === 'ready';
  const rows: TableRow[] = [];
  const readings =
    ready && foot !== null && isBrandScale(scaleUnit.id)
      ? brandsAtFoot(foot, scaleUnit.id, women)
      : null;
  shoeBrands.forEach((brand, index) => {
    const read = readings?.[index] ?? null;
    const own =
      baseline?.brand.id === brand.id && !baseline.length && value !== undefined ? baseline : null;
    // While the charts load, or failed to load, the rows wait as dashes with no line to say
    // (ADR 0029).
    const chart = own?.chart ?? read?.chart ?? (ready ? brandChart(brand, women) : null);
    const tag = {
      id: `brand:${brand.id}`,
      name: brand.name,
      brand: { id: brand.id, line: chart?.line ?? (women ? 'women' : 'men') },
    };
    if (own && value !== undefined) {
      const cell =
        own.row && isBrandScale(scaleUnit.id) ? brandCell(own.row, scaleUnit.id, own.women) : null;
      rows.push({
        ...brandCellRow(scaleUnit, from, value, cell?.range, false, locale),
        ...tag,
        detail: detailOf(own.chart.line, scaleUnit),
        inBox: true,
      });
      return;
    }
    if (!read || read.value === null) {
      rows.push({
        ...emptyRow(scaleUnit, from),
        ...tag,
        inBox: false,
        detail: chart
          ? detailOf(chart.line, scaleUnit, read?.why ? whyWords(read.why, scaleUnit) : null)
          : undefined,
      });
      return;
    }
    rows.push({
      ...brandCellRow(scaleUnit, from, read.value, read.range, read.approx, locale),
      ...tag,
      detail: detailOf(read.chart.line, scaleUnit),
    });
  });
  return {
    key: 'brands',
    // With no brand in the box only this section waits for the charts: its heading says so
    // (ADR 0029; Sean, 2026-10-21).
    // No commas in a status line: a pause the reader does not need (Sean, 2026-10-21).
    label:
      charts === 'failed'
        ? 'Brand charts not loaded'
        : ready
          ? `${SECTION_LABEL.brands}, the same foot in ${scaleUnit.symbol}`
          : 'Brand charts loading…',
    rows,
    repeats: true,
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Oct 2026" from an ISO date. */
function monthYear(iso: string): string {
  const [year, month] = iso.split('-');
  return `${MONTHS[Number(month) - 1] ?? month} ${year}`;
}

/** A name's possessive: "Nike’s", "Crocs’". */
function poss(name: string): string {
  return name + (/s$/.test(name) ? '’' : '’s');
}

/**
 * The line under the table with a brand in the box (ADR 0028): whose chart, where, and when; the
 * fact its numbers cannot show; where the size is off its chart, its span; where the brand gives
 * no foot length, how its size is read and what it prints for it. Never fit advice, which the
 * brands' rows show (Sean, 2026-10-20).
 */
function brandNote(
  brand: ShoeBrand,
  reading: BrandReading | null,
  unit: Unit | null,
  value: number | undefined,
  labelled: boolean,
  locale: string | undefined,
): string {
  const chart = reading?.chart ?? brandChart(brand, false);
  const line = chart.line === 'unisex' ? '' : `, the ${LINE_POSS[chart.line]}`;
  const lines = [
    `${poss(brand.name)} size chart${line}, ${brand.site}, read ${monthYear(chart.read)}.`,
  ];
  if (brand.fact) lines.push(brand.fact);
  const { name } = brand;
  if (reading && unit && value !== undefined) {
    const size = sizeOf(value, locale);
    if (reading.beyond) {
      const [low, high] = reading.beyond;
      const adj = LINE_POSS[chart.line] ? `${LINE_POSS[chart.line]} ` : '';
      lines.push(
        `${poss(name)} ${adj}chart runs ${unit.symbol} ${sizeOf(low, locale)} to ${sizeOf(high, locale)}.`,
      );
    } else if (!reading.length && !reading.row) {
      lines.push(`${poss(name)} chart prints no ${unit.plural}.`);
    } else if (labelled && reading.row) {
      const row = reading.row;
      const cells = BRAND_SCALES.filter((scale) => scale !== unit.id).flatMap((scale) => {
        const cell = brandCell(row, scale, reading.women);
        const scaleUnit = getUnit(scale);
        return cell && scaleUnit
          ? [`${scaleUnit.symbol} ${asPrinted(cell.value, cell.range, locale).text}`]
          : [];
      });
      lines.push(
        `${name} gives no foot length, so its ${size} is read as ISO’s ${unit.name} ${size}${cells.length ? `; it prints ${cells.join(', ')} for it` : ''}.`,
      );
    } else if (reading.length && chart.basis !== 'foot') {
      lines.push(`${name} gives no foot length, so it has no size for a measured foot.`);
    }
  }
  return lines.join(' ');
}

/**
 * The brand's scales, to choose from, under one heading: the list the unit's chip opens with a
 * brand in the box (ADR 0028, 2026-10-20; Sean: "a more immediate way to flip the reading").
 * Every scale its chart prints, in the table's order, and the foot's units where the chart gives
 * the foot, the one in the box marked, each carrying the same row's size on that scale (a range's
 * lower end; none where the brand has no row for the box, so the number as typed goes with the
 * scale) with the line the row was read on; so a size is read on another scale without leaving
 * the brand, which the scale rows, ISO's, cannot do, since taking one takes the brand out. With
 * `choose`, the table's place while a brand has no scale (its chip emptied, or a brand alone),
 * the heading asking for one, as Cooking lists its ingredients until one is chosen (Sean,
 * 2026-10-21).
 */
export function scaleList(
  view: UnitsView,
  brand: ShoeBrand,
  unit: Unit | null,
  value: number | undefined,
  line: ShoeLine | null,
  locale: string | undefined,
  choose = false,
): MatchesView {
  const shoe = getCategory(SHOE);
  // Nothing to list until core has the charts (ADR 0029); the chip opens the list only then.
  if (!hasBrandCharts()) {
    return {
      categories: view.categories,
      kind: 'matches',
      category: SHOE,
      query: '',
      rows: [],
      counts: {},
      hidden: [],
      announcement: null,
    };
  }
  const women = readsWomen(unit, line);
  const reading = unit && value !== undefined ? readBrand(brand, unit, value, women) : null;
  const chart = reading?.chart ?? brandChart(brand, women);
  const row = reading?.row ?? null;
  const mondopoint = getUnit('mondopoint');
  const group = `${poss(brand.name)} chart${chart.line === 'unisex' ? '' : `, the ${LINE_POSS[chart.line]}`}${choose ? ': choose the scale to read it on' : ''}`;
  const rows: MatchRow[] = [];
  for (const each of view.rows) {
    if (!shoe || each.brand !== undefined || each.tone === 'message') continue;
    const scale = each.unit;
    let text: string | undefined;
    if (isBrandScale(scale.id)) {
      if (brandSpan(chart, scale.id, women) === null) continue;
      const cell = row ? brandCell(row, scale.id, women) : null;
      text = cell ? sizeOf(cell.value, locale) : undefined;
    } else if (scale.id === 'mondopoint' || scale.id === 'foot-cm') {
      if (chart.basis !== 'foot' || !mondopoint) continue;
      text =
        row?.foot === undefined
          ? undefined
          : formatNumber(convert(row.foot, mondopoint, scale), { locale });
    } else continue;
    rows.push({
      kind: 'brand',
      brand,
      unit: scale,
      category: shoe,
      inBox: scale.id === unit?.id,
      text,
      line: women ? 'women' : null,
      group,
    });
  }
  return {
    categories: view.categories,
    kind: 'matches',
    category: SHOE,
    query: '',
    rows,
    counts: { [SHOE]: rows.length },
    hidden: [],
    announcement: `${rows.length} scales of ${poss(brand.name)} chart to choose from`,
  };
}

/** The line under the table when the brands' charts could not be fetched (ADR 0029). */
const CHARTS_FAILED = 'Brand charts not loaded. Reload to try again.';

/**
 * Shoe size (ADR 0027, ADR 0028): ISO's scales as every category's rows, and under them one row
 * per brand at the same foot. One value is in focus (Sean, 2026-10-20): a size on ISO's scales,
 * or a brand's size, whose row is then the box's own and whose chart gives the foot the scale rows
 * and the other brands convert from; a brand with no foot length has its size read as ISO's label,
 * said in the line under the table.
 */
function selectShoe(
  shared: ViewBase,
  unit: Unit | null,
  parsed: ParsedInput,
  options: TableOptions,
  brand: ShoeBrand | null,
  line: ShoeLine | null,
  target?: string,
): UnitsView {
  const view = selectUnits(shared, SHOE, unit, parsed, options, target);
  if (view.message !== null) return view;
  const value = unit ? parsed.value : undefined;
  // The women's charts: a US women's size, or the line kept on a scale that does not say it.
  const women = readsWomen(unit, line);
  // The scale the brands' rows are written on: the box's, or US men's for a length (women's with
  // a women's size).
  const scaleUnit = getUnit(
    unit && isBrandScale(unit.id) ? unit.id : women ? 'us-women' : BRAND_DEFAULT_SCALE,
  );
  if (!scaleUnit) return view;
  // The charts' state (ADR 0029): the island's hook says; the tests and the build hand the
  // file over first, so ready without a word.
  const charts: ChartsStatus = options.charts ?? (hasBrandCharts() ? 'ready' : 'loading');
  const ready = charts === 'ready';
  const reading =
    ready && brand && unit && value !== undefined ? readBrand(brand, unit, value, women) : null;
  // A brand with no foot length: its size read as ISO's label on the same scale.
  const labelled =
    reading !== null && !reading.length && reading.row !== null && reading.foot === null;
  // The foot everything converts from: the brand's chart's for the size in the box, ISO's rule's
  // for a size on its scales or a labelled brand's, the length typed; none while the rows wait or
  // a size is off its chart.
  // A brand in the box while its chart is not here (loading, or the fetch failed): no foot to
  // read from, every row a dash, the line under the table saying so (ADR 0029).
  const waiting = brand !== null && !ready;
  let foot: number | null = null;
  if (reading) {
    foot = reading.foot ?? (labelled && unit && value !== undefined ? baseOf(unit, value) : null);
  } else if (!waiting && unit && value !== undefined && !beyondOwnScale(unit, value)) {
    foot = baseOf(unit, value);
  }
  // With a brand's size in the box, the scale rows are ISO's from its foot and none the box's own.
  const read =
    (reading && !reading.length) || waiting
      ? remapRows(view, (row) => fromFoot(row, foot, options.locale))
      : view;
  const section = brandsSection(
    foot,
    scaleUnit,
    women,
    unit,
    value,
    reading,
    options.locale,
    charts,
  );
  // What the whole table waits on, above the rows (Sean, 2026-10-21: under the table it was too
  // far down to see); with no brand only the brands' section waits, and its heading says so.
  const notice = waiting
    ? charts === 'failed'
      ? CHARTS_FAILED
      : `${poss(brand.name)} chart loading…`
    : undefined;
  const note = waiting
    ? null
    : brand
      ? brandNote(brand, reading, unit, value, labelled, options.locale)
      : view.note;
  const announcement =
    brand && unit && value !== undefined && ready
      ? `${spokenAmount(parsed, unit, options.locale)} at ${brand.name} in ${read.rows.length} units of shoe size`
      : view.announcement;
  // With a brand in the box its row is the one in focus: the brands' section comes first, right
  // under the box with the other brands beside it, the scales after (Sean, 2026-10-21: the row
  // chosen sat below ten scale rows).
  const first = brand !== null;
  return {
    ...read,
    rows: first ? [...section.rows, ...read.rows] : [...read.rows, ...section.rows],
    sections: first ? [section, ...read.sections] : [...read.sections, section],
    all: first ? [...section.rows, ...read.all] : [...read.all, ...section.rows],
    note,
    notice,
    announcement,
  };
}

/**
 * A scale's row in the change section: the box's number as a change in it, its id the scale's
 * with "-change", so it is a row of its own (copied, pointed at) while taking it brings the scale.
 */
function changeRow(
  target: Unit,
  from: Unit | null,
  value: number | undefined,
  locale: string | undefined,
): TableRow {
  const id = `${target.id}-change`;
  if (!from || value === undefined) return { ...emptyRow(target, null), id };
  const converted = safeChange(value, from, target);
  const text =
    converted === undefined ? '' : formatNumber(converted, { precision: TABLE_PRECISION, locale });
  const tooSmall = converted === 0 && value !== 0;
  const shown = text && !tooSmall ? (converted ?? null) : null;
  const problem: NoAnswer | null = shown !== null ? null : tooSmall ? 'small' : 'large';
  return {
    unit: target,
    id,
    name: unitName(target, shown ?? Number.NaN),
    symbol: target.symbol,
    value: shown,
    text: problem ? NO_ANSWER_MESSAGES[problem].short : text,
    tone: problem ? 'message' : 'value',
    inBox: false,
    clock: false,
    approx: false,
    stepped: false,
  };
}

/**
 * The change section's heading, the box's amount said as a change: "As a change: 5 °C warmer or
 * cooler"; a negative amount says its direction itself, "As a change: −25 °F".
 */
function changeLabel(parsed: ParsedInput, unit: Unit | null, locale: string | undefined): string {
  const heading = SECTION_LABEL.change;
  if (!unit || parsed.value === undefined) return heading;
  const typed = parsed.expression
    ? formatNumber(parsed.value, { locale })
    : (parsed.valueText ?? '');
  // A no-break space keeps the amount and its symbol on one line.
  const amount = `${typed}${NBSP}${unit.symbol}`;
  return parsed.value < 0 ? `${heading}: ${amount}` : `${heading}: ${amount} warmer or cooler`;
}

/** How a row converts the box's value into its unit: convert, or Cooking's through a density. */
type Converter = (value: number, from: Unit, to: Unit) => number | undefined;

function valueRow(
  target: Unit,
  from: Unit,
  value: number,
  locale: string | undefined,
  converter: Converter = safeConvert,
): TableRow {
  // A foot beyond the row's scale (a children's table, ADR 0027): the row says where the scale
  // ends, "> 13.5" or "< 4", in place of a size no shoe is marked in, the sign first in the form
  // a value under a step takes ("< 0.01"), the end its value, which the table writes as a size
  // under the display ("> 13 1/2" with Fraction), and after the name a word saying where the
  // foot stands, above or below its range (Sean, 2026-10-20: the muted ink alone was not clear).
  const beyond = target.id === from.id ? null : beyondScale(from, target, value);
  if (beyond) {
    return {
      ...emptyRow(target, from),
      value: beyond.end,
      text: `${beyond.past ? '>' : '<'} ${sizeText(beyond.end, locale)}`,
      tone: 'beyond',
      stepped: target.step !== undefined,
      detail: beyond.past ? 'above its range' : 'below its range',
    };
  }
  const exact = target.id === from.id ? value : converter(value, from, target);
  // A size is written to its scale's step, ≈ where that moved it (ADR 0027): the row's value is
  // the size itself, so it copies and moves into the box as it shows; the box's own row echoes
  // what was typed.
  const stepped =
    target.step !== undefined && target.id !== from.id && exact !== undefined
      ? roundToStep(exact, target.step)
      : null;
  const converted = stepped ? stepped.value : exact;
  const text =
    converted === undefined
      ? ''
      : target.pace
        ? formatClock(converted, { locale })
        : target.pair
          ? pairText(converted, target, locale)
          : formatNumber(converted, { precision: TABLE_PRECISION, locale });
  const tooSmall = converted === 0 && value !== 0;
  const shown = text && !tooSmall ? (converted ?? null) : null;
  // 0 in a reciprocal unit has no value in the others: 0 mpg is no distance at all, so no L/100 km.
  const problem: NoAnswer | null =
    shown !== null ? null : tooSmall ? 'small' : value === 0 ? 'zero' : 'large';
  return {
    unit: target,
    id: target.id,
    name: unitName(target, problem ? Number.NaN : (shown ?? Number.NaN)),
    symbol: target.symbol,
    value: problem ? null : shown,
    text: problem ? NO_ANSWER_MESSAGES[problem].short : text,
    tone: problem ? 'message' : 'value',
    inBox: target.id === from.id,
    clock: target.pace === true,
    // Converted through an ingredient's density (Cooking's ≈), or rounded to a scale's step.
    approx:
      stepped?.approx === true ||
      (converter !== safeConvert && target.id !== from.id && crossesDensity(from, target)),
    stepped: stepped !== null,
    pair: target.pair ? target : undefined,
  };
}

/**
 * Where a scale ends (ADR 0027): the size at its range's low or high end, read through the unit
 * and rounded inward to its step, since the range lies half a row past the table (US children's
 * 4 and 13.5).
 */
function scaleEnd(unit: Unit, end: 'low' | 'high'): number {
  const at = unit.range
    ? fromBase(unit, end === 'low' ? unit.range[0] : unit.range[1])
    : Number.NaN;
  return unit.step === undefined
    ? at
    : (roundToStep(at, unit.step, end === 'low' ? 'up' : 'down')?.value ?? at);
}

/** A size written as the table writes one (13.5), for the locale. */
function sizeText(size: number, locale: string | undefined): string {
  return formatNumber(size, { precision: TABLE_PRECISION, locale });
}

/** A scale's span, "4 to 13.5", for the live region. */
function scaleSpan(unit: Unit, locale: string | undefined): string {
  return `${sizeText(scaleEnd(unit, 'low'), locale)} to ${sizeText(scaleEnd(unit, 'high'), locale)}`;
}

/** The value in the base unit, or null where the unit cannot read it. */
function baseOf(unit: Unit, value: number): number | null {
  try {
    return toBase(unit, value);
  } catch {
    return null;
  }
}

/** Whether a size lies outside its own unit's scale (US C 20). */
function beyondOwnScale(unit: Unit, value: number): boolean {
  if (!unit.range) return false;
  const base = baseOf(unit, value);
  return base !== null && (base < unit.range[0] || base > unit.range[1]);
}

/**
 * Where the row's scale ends, for a value beyond it (ADR 0027): past its largest size or below its
 * smallest, and that end; null for a value within it, or a unit with no range.
 */
function beyondScale(
  from: Unit,
  target: Unit,
  value: number,
): { past: boolean; end: number } | null {
  if (!target.range) return null;
  const base = baseOf(from, value);
  if (base === null || (base >= target.range[0] && base <= target.range[1])) return null;
  const past = base > target.range[1];
  return { past, end: scaleEnd(target, past ? 'high' : 'low') };
}

function emptyRow(target: Unit, inBox: Unit | null): TableRow {
  return {
    unit: target,
    id: target.id,
    name: target.plural,
    symbol: target.symbol,
    value: null,
    text: NO_VALUE,
    tone: 'empty',
    inBox: target.id === inBox?.id,
    clock: target.pace === true,
    approx: false,
    stepped: false,
    pair: target.pair ? target : undefined,
  };
}

/**
 * Matches for a typed unit from every category, by core's ranker, the current category first
 * among equal matches without hiding the others; grouped under their category, a category whose
 * name matched leading its group ("len" offers all of Length).
 */
function selectMatches(
  base: ViewBase,
  query: string,
  unit: Unit | null,
  current: CategoryId | null,
  options: TableOptions,
  typed?: string,
): MatchesView {
  // Every result, not the shown list's limit, so a hidden unit ranked past it is still offered
  // apart: the shown and the hidden each keep to the limit.
  const { results, target } = search(query, {
    system: options.system,
    tier: EVERY_TIER,
    prefer: current,
    limit: Number.POSITIVE_INFINITY,
  });
  const listed = results.flatMap((result): MatchRow[] => {
    if (result.kind === 'category') return [{ kind: 'category', category: result.category }];
    const category = getCategory(result.unit.category);
    if (!category) return [];
    const inBox = result.unit.id === unit?.id;
    return [{ kind: 'unit', unit: result.unit, category, inBox, target: result.target }];
  });
  const set = apart(listed, [], options);
  const ranked = set.rows.slice(0, MATCH_LIMIT);
  const hidden = set.hidden.slice(0, MATCH_LIMIT);
  // Ingredients under Cooking (ADR 0021): one the query ends with first, with the unit typed
  // before it ("2 cups flour"), then those whose names match, the group placed by its best match.
  const cooked = ingredientMatches(query, current, results[0]?.matchClass, options);
  if (cooked.first) ranked.unshift(...cooked.rows);
  else ranked.push(...cooked.rows);
  // Brands under Shoe size (ADR 0028): one the query names at either end first, with the scale
  // typed beside it ("nike women 8", "eu 43 new balance"), then those whose names match.
  const branded = brandMatches(query, typed, unit, current, results[0]?.matchClass, options);
  if (branded.first) ranked.unshift(...branded.rows);
  else ranked.push(...branded.rows);
  const order: CategoryId[] = [];
  for (const row of ranked) if (!order.includes(row.category.id)) order.push(row.category.id);
  const rows = order.flatMap((id) => [
    ...ranked.filter((row) => row.category.id === id && row.kind === 'category'),
    ...ranked.filter((row) => row.category.id === id && row.kind !== 'category'),
  ]);
  return {
    ...base,
    kind: 'matches',
    category: current,
    query,
    rows,
    counts: countsOf(rows),
    hidden,
    target,
    announcement: matchesAnnouncement(rows, hidden),
  };
}

/**
 * The row a target names (ADR 0027; docs/UX-SPEC.md §5): the unit of the view's category the
 * target matches best, by index into the rows the cursor moves through, or -1 where it names
 * none, or one the settings hide; "" names none.
 */
export function targetRow(view: UnitsView, target: string): number {
  if (!target.trim()) return -1;
  const [found] = search(target, { category: view.category, tier: EVERY_TIER, limit: 1 }).results;
  if (!found || found.kind !== 'unit') return -1;
  return view.rows.findIndex((row) => row.id === found.unit.id);
}

/**
 * The ingredients a typed query offers, under Cooking (ADR 0021): first the one it ends with, named
 * exactly, with the unit typed before it ("2 cups flour": cups of all-purpose flour) or the unit a
 * bare count of it means ("2 eggs"), then those whose names match. `first` when the group leads:
 * the query ends with an ingredient, the converter is in Cooking, or an ingredient matches better
 * than any unit ("oil" before the oil barrel; "o" leaves the units first).
 */
function ingredientMatches(
  query: string,
  current: CategoryId | null,
  bestUnit: number | undefined,
  options: TableOptions,
): { rows: MatchRow[]; first: boolean } {
  const cooking = getCategory('cooking');
  if (!cooking) return { rows: [], first: false };
  const rows: MatchRow[] = [];
  const split = splitIngredient(query);
  if (split) {
    const unit = cookedUnit(split.unit, split.ingredient, options);
    if (split.unit === '' || unit) {
      rows.push({
        kind: 'ingredient',
        ingredient: split.ingredient,
        unit,
        category: cooking,
        inBox: false,
      });
    }
  }
  const matched = matchIngredients(query);
  for (const match of matched) {
    if (
      rows.some((row) => row.kind === 'ingredient' && row.ingredient.id === match.ingredient.id)
    ) {
      continue;
    }
    rows.push({
      kind: 'ingredient',
      ingredient: match.ingredient,
      unit: null,
      category: cooking,
      inBox: false,
    });
  }
  const best = rows.length > 0 && split ? 0 : (matched[0]?.matchClass ?? Infinity);
  return { rows, first: current === 'cooking' || best < (bestUnit ?? Infinity) };
}

/**
 * The unit typed before an ingredient ("cups" in "2 cups flour"): a weight, a volume, or the
 * ingredient's own unit, named exactly, else the best such match; none typed, the unit a bare
 * count of it means ("2 eggs"). Null when the words name no such unit.
 */
function cookedUnit(text: string, ingredient: Ingredient, options: TableOptions): Unit | null {
  if (text === '') return countedUnit(ingredient) ?? null;
  const fits = (unit: Unit) =>
    COOKING_OVER.has(unit.category) && (!unit.ingredient || unit.ingredient === ingredient.id);
  const exact = resolveExact(text, { system: options.system, ingredient: ingredient.id });
  if (exact && fits(exact)) return exact;
  const best = search(text, {
    system: options.system,
    tier: EVERY_TIER,
    limit: MATCH_LIMIT,
  }).results.find(
    (result) => result.kind === 'unit' && result.matchClass <= 3 && fits(result.unit),
  );
  return best?.kind === 'unit' ? best.unit : null;
}

/**
 * Whether typing has reached a unit: the text holds a query with a letter or a symbol in it,
 * beyond the characters numbers and sums are written with. The parser reads a half-typed number
 * as a query ("-" before "-5", "1e" before "1e5"), so those, and a lone "e" after a number, which
 * may be an exponent on its way, wait for the next key, as does a colon on the way to a time ("5:"
 * and "5:3" before "5:30").
 */
function typingUnit(parsed: ParsedInput): boolean {
  const { query } = parsed;
  if (!query) return false;
  if (parsed.valueText !== undefined && /^[eE][-+−]?$/.test(query)) return false;
  if (parsed.valueText !== undefined && /^:[0-5]?$/.test(query)) return false;
  return /[^\s\d.,+\-−*/×÷^()]/u.test(query);
}

/**
 * convert() throws only for a cross-category pair or a non-finite input, which the table and the
 * parser already rule out. A throw during render would take the island down, so an impossible
 * pair simply shows no value.
 */
function safeConvert(value: number, from: Unit, to: Unit): number | undefined {
  try {
    return convert(value, from, to);
  } catch {
    return undefined;
  }
}

/** convertWith, as safely: Cooking's rows through an ingredient's density. */
function safeWith(value: number, from: Unit, to: Unit, ingredient: Ingredient): number | undefined {
  try {
    return convertWith(value, from, to, ingredient);
  } catch {
    return undefined;
  }
}

/** convertChange, as safely: a scale with no size of its own shows no value. */
function safeChange(value: number, from: Unit, to: Unit): number | undefined {
  try {
    return convertChange(value, from, to);
  } catch {
    return undefined;
  }
}

function unitName(unit: Unit, value: number): string {
  return value === 1 ? unit.name : unit.plural;
}

/**
 * A typed amount as the live region says it, "250 milliliters": arithmetic by its value ("8
 * milliliters"), not by what was typed ("5+3").
 */
function spokenAmount(parsed: ParsedInput, unit: Unit, locale: string | undefined): string {
  // A compound by its reading, which names its units already: "5 ft 11 in in 13 units of length".
  if (parsed.compound && parsed.value !== undefined && unit.pair) {
    return pairText(parsed.value, unit, locale, BOX_PRECISION, true);
  }
  const typed =
    parsed.expression && parsed.value !== undefined
      ? formatNumber(parsed.value, { locale })
      : (parsed.valueText ?? '');
  return `${typed} ${unitName(unit, parsed.value ?? Number.NaN)}`.trim();
}

// ---------------------------------------------------------------------------
// Undo, redo, and the calculator's Escape (docs/UX-SPEC.md §9). The most recent interaction is
// what gets undone. Typing is grouped into chunks the way editors coalesce undo: keystrokes in the
// box, or in the calculator, less than TYPING_CHUNK_MS apart belong together, and a space starts a
// new chunk. A unit used or taken out, a chosen category, a clear, a send, and = or C are each a
// step of their own. In the calculator, Escape steps back through its chunks, each step undoable;
// the box's Escape has steps of its own (TableLayout.tsx).

interface Snapshot {
  state: ConverterState;
  chunks: string[];
}

export interface History {
  past: Snapshot[];
  present: ConverterState;
  future: Snapshot[];
  /** The typing chunk in progress: in the box or the calculator, and when its latest key landed. */
  run: { target: TextTarget; at: number } | null;
  /** The calculator's chunks of typing, oldest first, each the text it started from: what its Escape takes back. */
  chunks: string[];
}

export type HistoryAction =
  | Action
  | { type: 'undo' }
  | { type: 'redo' }
  /** Escape in the calculator: take back its latest chunk of typing. */
  | { type: 'stepBack' };

export const HISTORY_LIMIT = 50;

export const initialHistory: History = {
  past: [],
  present: initialState,
  future: [],
  run: null,
  chunks: [],
};

function sameState(a: ConverterState, b: ConverterState): boolean {
  return (
    a.text === b.text &&
    a.unit === b.unit &&
    a.category === b.category &&
    a.ingredient === b.ingredient &&
    a.brand === b.brand &&
    a.calc.text === b.calc.text &&
    a.calc.fresh === b.calc.fresh
  );
}

/** True when the new text extends the old one with a space: the space opens a new chunk. */
function startsWord(before: string, after: string): boolean {
  return after.length > before.length && after.startsWith(before) && after[before.length] === ' ';
}

/** A chunk can be stepped back through only while its starting text is still a proper prefix of the text. */
function isCheckpoint(before: string, text: string): boolean {
  return before.length < text.length && text.startsWith(before);
}

function commit(
  history: History,
  present: ConverterState,
  run: History['run'],
  chunks: string[],
): History {
  const snapshot: Snapshot = { state: history.present, chunks: history.chunks };
  const past = [...history.past, snapshot].slice(-HISTORY_LIMIT);
  return { past, present, future: [], run, chunks };
}

/**
 * Escape in the calculator: the latest chunk of typing still in its entry goes; without one (right
 * after = or C), the entry clears. A step undo can reverse.
 */
function stepBack(history: History): History {
  const text = history.present.calc.text;
  if (text === '') return history;
  let index = history.chunks.length - 1;
  while (index >= 0 && !isCheckpoint(history.chunks[index]!, text)) index -= 1;
  const kept = index >= 0 ? history.chunks.slice(0, index) : history.chunks;
  const before = index >= 0 ? history.chunks[index]! : '';
  const present = reduce(history.present, { type: 'calcSet', text: before, fresh: false });
  return commit(history, present, null, kept);
}

/** Typing in the box or the calculator: it joins the chunk in progress or starts a new one. */
function typed(
  history: History,
  present: ConverterState,
  target: TextTarget,
  before: string,
  after: string,
  at: number,
): History {
  const run = { target, at };
  const continues =
    history.run?.target === target &&
    at - history.run.at <= TYPING_CHUNK_MS &&
    !startsWord(before, after);
  if (continues) return { ...history, present, run };
  // Only the calculator's chunks are kept, for its Escape.
  const chunks = target === 'calc' ? [...history.chunks, before] : history.chunks;
  return commit(history, present, run, chunks);
}

export function reduceWithHistory(history: History, action: HistoryAction): History {
  if (action.type === 'undo') {
    const previous = history.past[history.past.length - 1];
    if (!previous) return history;
    return {
      past: history.past.slice(0, -1),
      present: previous.state,
      future: [{ state: history.present, chunks: history.chunks }, ...history.future],
      run: null,
      chunks: previous.chunks,
    };
  }
  if (action.type === 'redo') {
    const next = history.future[0];
    if (!next) return history;
    return {
      past: [...history.past, { state: history.present, chunks: history.chunks }],
      present: next.state,
      future: history.future.slice(1),
      run: null,
      chunks: next.chunks,
    };
  }
  if (action.type === 'stepBack') return stepBack(history);

  const present = reduce(history.present, action);
  if (sameState(present, history.present)) return { ...history, present };

  switch (action.type) {
    case 'hydrate':
      return { past: [], present, future: [], run: null, chunks: [] };
    case 'input':
      return typed(history, present, 'box', history.present.text, action.text, action.at);
    case 'calcType':
      return typed(history, present, 'calc', history.present.calc.text, action.text, action.at);
    case 'calcSet':
      // = and C start the entry over, so Escape then clears it rather than restoring the sum.
      return commit(history, present, null, []);
    case 'replace':
    case 'use':
    case 'useIngredient':
    case 'removeIngredient':
    case 'useBrand':
    case 'removeBrand':
    case 'chooseCategory':
    case 'unlock':
    case 'clear':
      return commit(history, present, null, history.chunks);
  }
}
