import {
  convert,
  convertChange,
  convertWith,
  cookingUnits,
  countedUnit,
  crossesDensity,
  formatClock,
  formatNumber,
  getCategory,
  getIngredient,
  getUnit,
  INGREDIENT_KINDS,
  ingredients,
  matchIngredients,
  parse,
  resolveExact,
  search,
  splitIngredient,
  unitListGroup,
  type Category,
  type CategoryId,
  type Ingredient,
  type ListGroup,
  type ParsedInput,
  type Separators,
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
   * The calculator's scratch entry. It lives here, outside the conversion, so one history holds
   * everything: undo goes from a send back into the arithmetic that produced it.
   */
  calc: CalculatorState;
}

/** Where typing lands: the box, or the calculator's entry. */
export type TextTarget = 'box' | 'calc';

/** The part of the state a URL or a later persistence layer restores, through the `hydrate` action. */
export type Restorable = Partial<Pick<ConverterState, 'text' | 'unit' | 'ingredient'>>;

export const EMPTY_CALC: CalculatorState = { text: '', fresh: false };

export const initialState: ConverterState = {
  text: '',
  unit: null,
  category: null,
  ingredient: null,
  calc: EMPTY_CALC,
};

/** The categories Cooking looks over (ADR 0021): a unit of these keeps the box's ingredient. */
const COOKING_OVER: ReadonlySet<CategoryId> = new Set(getCategory('cooking')?.over ?? []);

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
   * value, or the number as typed); with the ingredient a match brought ("2 cups flour"), by id.
   */
  | { type: 'use'; unit: string; text: string; ingredient?: string | null }
  /**
   * An ingredient taken into the box (a match, or a choice in Cooking's list): Cooking, the box
   * keeping a weight or a volume, and its new text, the number as typed.
   */
  | { type: 'useIngredient'; ingredient: string; text: string }
  /** The ingredient taken out (its pill's ×, Backspace): a weight or a volume stays, in its own category. */
  | { type: 'removeIngredient' }
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
      return {
        ...state,
        text: action.text,
        unit: unit.id,
        ingredient: cooks ? ingredient : null,
        category: cooks ? 'cooking' : unit.category,
      };
    }

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
        // Cooking keeps its ingredient; any other category leaves it.
        ingredient: action.category === 'cooking' ? state.ingredient : null,
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
      // A URL holds a unit and an ingredient, not a category: they name it.
      const next = { ...state, ...action.state };
      const unit = next.unit ? getUnit(next.unit) : undefined;
      const named = next.ingredient && getIngredient(next.ingredient) ? next.ingredient : null;
      const ingredient = unit?.ingredient ?? named;
      const cooks = ingredient !== null && (!unit || COOKING_OVER.has(unit.category));
      return {
        ...next,
        ingredient: cooks ? ingredient : null,
        category: cooks ? 'cooking' : (unit?.category ?? null),
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
  parsed: ParsedInput;
}

export function selectBox(state: ConverterState, options: NumberEnv): BoxView {
  return {
    text: state.text,
    unit: state.unit ? (getUnit(state.unit) ?? null) : null,
    ingredient: state.ingredient ? (getIngredient(state.ingredient) ?? null) : null,
    parsed: parse(state.text, options.separators),
  };
}

/**
 * Why a conversion has no answer to show: beyond what a double holds, rounded to zero, arithmetic
 * with no answer (a division by zero, a power with no real value), or 0 in a reciprocal unit.
 */
export type NoAnswer = 'large' | 'small' | 'divide-by-zero' | 'not-real' | 'zero';

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
  /** The value in this unit at full precision, for copying and for moving into the box; null without one. */
  value: number | null;
  /** As the row shows it: TABLE_PRECISION significant digits, "Too large" or "Too small", or NO_VALUE. */
  text: string;
  /**
   * What the text is: a value; a dash, while there is no number or no unit to convert from; or a
   * message, when a double cannot hold the value and there is nothing to copy or move.
   */
  tone: 'value' | 'empty' | 'message';
  /** The unit in the box. */
  inBox: boolean;
  /** A pace's value, in minutes and seconds (5:30), whatever the display's places or fractions. */
  clock: boolean;
  /** Measured, not exact: converted through an ingredient's density (Cooking's ≈, ADR 0021). */
  approx: boolean;
}

/** A match while a unit is typed: a unit, or a category whose name matched, to open. */
export type MatchRow =
  | { kind: 'unit'; unit: Unit; category: Category; inBox: boolean }
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
    };

interface TableViewBase {
  /** The categories the converter offers, in the start's tiles and in the category menu. */
  categories: Category[];
  /** What the live region says once the view settles, if anything. */
  announcement: string | null;
}

/** Before any category: the categories to start from. */
export interface StartView extends TableViewBase {
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
  /** A line under the table: Cooking's, what a cup of its ingredient weighs and where that comes from. */
  note: string | null;
}

/** While a unit is typed: matches from every category, under their category, without values. */
export interface MatchesView extends TableViewBase {
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
}

/** A hidden unit that matches, with the name of the section it would show in. */
export interface HiddenMatch {
  unit: Unit;
  category: Category;
  section: string;
}

export type TableView = StartView | UnitsView | MatchesView;

export interface TableOptions extends NumberEnv {
  /** The visitor's unit family, listed first. */
  system: UnitPreference;
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
  // Cooking looks over the unit's own category.
  const category = state.category === 'cooking' ? 'cooking' : (unit?.category ?? state.category);
  const base = {
    categories: search('', { tier: EVERY_TIER }).results.flatMap((result) =>
      result.kind === 'category' ? [result.category] : [],
    ),
  };
  if (typingUnit(parsed)) return selectMatches(base, parsed.query ?? '', unit, category, options);
  if (!category) return { ...base, kind: 'start', announcement: null };
  if (category === 'cooking') {
    return ingredient
      ? selectCooking(base, ingredient, unit, parsed, options)
      : ingredientList(base);
  }
  return selectUnits(base, category, unit, parsed, options);
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
): UnitsView {
  const listed = search('', {
    category,
    system: options.system,
    tier: EVERY_TIER,
  }).results.flatMap((result) => (result.kind === 'unit' ? [result.unit] : []));
  const kind = getCategory(category)?.name.toLowerCase() ?? '';
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
   * A category of readings on scales with zero points (temperature's) says the box's number as a
   * change too, in a section after the readings (Sean, 2026-10-16): every shown scale but the
   * box's own, by their degree sizes alone, so 5 °C warmer is 9 °F warmer.
   */
  const withChange = (view: ReturnType<typeof arranged>) => {
    if (!listed.some((each) => each.kind === 'affine')) return view;
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
      note: null,
      announcement: `${view.rows.length} units of ${kind}`,
    };
  }

  const value = parsed.value;
  const view = arranged(listed.map((target) => valueRow(target, unit, value, options.locale)));
  const from = spokenAmount(parsed, unit, options.locale);
  return {
    ...base,
    ...withChange(view),
    message: null,
    note: null,
    announcement: `${from} in ${view.rows.length} units of ${kind}`,
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
  const amount = `${typed}${NO_BREAK}${unit.symbol}`;
  return parsed.value < 0 ? `${heading}: ${amount}` : `${heading}: ${amount} warmer or cooler`;
}

/** The no-break space between an amount and its symbol. */
const NO_BREAK = String.fromCharCode(0x00a0);

/** How a row converts the box's value into its unit: convert, or Cooking's through a density. */
type Converter = (value: number, from: Unit, to: Unit) => number | undefined;

function valueRow(
  target: Unit,
  from: Unit,
  value: number,
  locale: string | undefined,
  converter: Converter = safeConvert,
): TableRow {
  const converted = target.id === from.id ? value : converter(value, from, target);
  const text =
    converted === undefined
      ? ''
      : target.pace
        ? formatClock(converted, { locale })
        : formatNumber(converted, { precision: TABLE_PRECISION, locale });
  const tooSmall = converted === 0 && value !== 0;
  const shown = text && !tooSmall ? (converted ?? null) : null;
  // 0 in a reciprocal unit has no value in the others: 0 mpg is no distance at all, so no L/100 km.
  const problem: NoAnswer | null =
    shown !== null ? null : tooSmall ? 'small' : value === 0 ? 'zero' : 'large';
  return {
    unit: target,
    id: target.id,
    name: unitName(target, shown ?? Number.NaN),
    symbol: target.symbol,
    value: shown,
    text: problem ? NO_ANSWER_MESSAGES[problem].short : text,
    tone: problem ? 'message' : 'value',
    inBox: target.id === from.id,
    clock: target.pace === true,
    // Converted through an ingredient's density: measured, not exact (Cooking's ≈).
    approx: converter !== safeConvert && target.id !== from.id && crossesDensity(from, target),
  };
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
): MatchesView {
  const { results } = search(query, {
    system: options.system,
    tier: EVERY_TIER,
    prefer: current,
    limit: MATCH_LIMIT,
  });
  const rule = options.rule ?? SHOW_ALL;
  const hidden: HiddenMatch[] = [];
  const ranked = results.flatMap((result): MatchRow[] => {
    if (result.kind === 'category') return [{ kind: 'category', category: result.category }];
    const category = getCategory(result.unit.category);
    if (!category) return [];
    const inBox = result.unit.id === unit?.id;
    // A hidden unit leaves the matches and is offered apart, under its section's name.
    if (!inBox && !shows(result.unit, rule, options.system)) {
      const section = SECTION_LABEL[sectionOf(result.unit, options.system)];
      hidden.push({ unit: result.unit, category, section });
      return [];
    }
    return [{ kind: 'unit', unit: result.unit, category, inBox }];
  });
  // Ingredients under Cooking (ADR 0021): one the query ends with first, with the unit typed
  // before it ("2 cups flour"), then those whose names match, the group placed by its best match.
  const cooked = ingredientMatches(query, current, results[0]?.matchClass, options);
  if (cooked.first) ranked.unshift(...cooked.rows);
  else ranked.push(...cooked.rows);
  const order: CategoryId[] = [];
  for (const row of ranked) if (!order.includes(row.category.id)) order.push(row.category.id);
  const rows = order.flatMap((id) => [
    ...ranked.filter((row) => row.category.id === id && row.kind === 'category'),
    ...ranked.filter((row) => row.category.id === id && row.kind !== 'category'),
  ]);
  const counts: Partial<Record<CategoryId, number>> = {};
  for (const row of rows) {
    counts[row.category.id] = (counts[row.category.id] ?? 0) + (row.kind === 'category' ? 0 : 1);
  }
  const announcement =
    rows.length > 0
      ? `${rows.length} ${rows.length === 1 ? 'match' : 'matches'}`
      : hidden.length > 0
        ? 'Only hidden units match'
        : 'No unit matches';
  return {
    ...base,
    kind: 'matches',
    category: current,
    query,
    rows,
    counts,
    hidden,
    announcement,
  };
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
    case 'chooseCategory':
    case 'unlock':
    case 'clear':
      return commit(history, present, null, history.chunks);
  }
}
