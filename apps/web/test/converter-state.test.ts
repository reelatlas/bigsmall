import { describe, expect, it } from 'vitest';
import {
  escapeTarget,
  HISTORY_LIMIT,
  initialHistory,
  initialState,
  NO_VALUE,
  nextBox,
  reduce,
  reduceWithHistory,
  selectTable,
  selectView,
  TABLE_PRECISION,
  type ConverterState,
  type History,
  type HistoryAction,
  type TextTarget,
} from '../src/features/converter/state';
import { TYPING_CHUNK_MS } from '../src/lib/timing';

const EN = { separators: { decimal: '.', group: ',' } };

function run(...actions: Parameters<typeof reduce>[1][]): ConverterState {
  return actions.reduce(reduce, initialState);
}

describe('reduce', () => {
  it('input stores the text and makes the box the source', () => {
    const s = run({ type: 'input', box: 'b', text: '5 ml', at: 0 });
    expect(s.b.text).toBe('5 ml');
    expect(s.source).toBe('b');
    expect(s.a).toEqual(initialState.a);
  });

  it('lock keeps the number, drops the query, and sets the unit', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5 ml', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    expect(s.a).toEqual({ text: '5', unit: 'milliliter' });
  });

  it('lock with a bare unit leaves the text empty', () => {
    const s = run(
      { type: 'input', box: 'a', text: 'ml', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    expect(s.a).toEqual({ text: '', unit: 'milliliter' });
  });

  it('lock ignores unknown units', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'lock', box: 'a', unit: 'cubit' },
    );
    expect(s.a.unit).toBeNull();
  });

  it('locking a different category in the other box clears the first unit', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'fahrenheit' },
    );
    expect(s.a).toEqual({ text: '5', unit: null });
    expect(s.b.unit).toBe('fahrenheit');
  });

  it('a derived box that loses its unit also loses its stale text', () => {
    const s = run(
      { type: 'input', box: 'b', text: '7', at: 0 },
      { type: 'lock', box: 'b', unit: 'us-cup' },
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'lock', box: 'a', unit: 'celsius' },
    );
    expect(s.b).toEqual({ text: '', unit: null });
    expect(s.source).toBe('a');
  });

  it('unlock keeps the text', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5 ml', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'unlock', box: 'a' },
    );
    expect(s.a).toEqual({ text: '5', unit: null });
  });

  it('swap exchanges boxes and moves the source with the typed value', () => {
    const s = run(
      { type: 'input', box: 'a', text: '1', at: 0 },
      { type: 'lock', box: 'a', unit: 'mile' },
      { type: 'lock', box: 'b', unit: 'kilometer' },
      { type: 'swap' },
    );
    expect(s.a.unit).toBe('kilometer');
    expect(s.b).toEqual({ text: '1', unit: 'mile' });
    expect(s.source).toBe('b');
  });

  it('clear resets everything but the mode', () => {
    const s = run(
      { type: 'setMode', mode: 'advanced' },
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'clear' },
    );
    expect(s).toEqual({ ...initialState, mode: 'advanced' });
  });

  it('setText replaces a box’s text without moving the source', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5 me', at: 0 },
      { type: 'setText', box: 'a', text: '5' },
    );
    expect(s.a.text).toBe('5');
    expect(s.source).toBe('a');
    const t = run(
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'setText', box: 'b', text: '7' },
    );
    expect(t.source).toBe('a');
  });

  it('hydrate merges the restored boxes, and their units name the category', () => {
    const s = run({ type: 'hydrate', state: { a: { text: '2', unit: 'foot' }, source: 'a' } });
    expect(s.a).toEqual({ text: '2', unit: 'foot' });
    expect(s.category).toBe('length');
    expect(run({ type: 'hydrate', state: { a: { text: '2', unit: null } } }).category).toBeNull();
  });
});

describe('the state’s category', () => {
  it('follows every unit put in, and stays when the unit is removed', () => {
    const s = run({ type: 'lock', box: 'a', unit: 'milliliter' });
    expect(s.category).toBe('volume');
    expect(reduce(s, { type: 'unlock', box: 'a' }).category).toBe('volume');
    expect(reduce(s, { type: 'use', box: 'a', unit: 'foot', text: '' }).category).toBe('length');
    expect(reduce(s, { type: 'clear' }).category).toBeNull();
  });

  it('a chosen category keeps the number, drops the query, and picks no unit', () => {
    const s = run(
      { type: 'input', box: 'a', text: '250 cu', at: 0 },
      { type: 'chooseCategory', box: 'a', category: 'volume' },
    );
    expect(s.a).toEqual({ text: '250', unit: null });
    expect(s.category).toBe('volume');
  });

  it('a chosen category takes the unit away unless the unit is of it', () => {
    const ml = run(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    expect(reduce(ml, { type: 'chooseCategory', box: 'a', category: 'length' }).a).toEqual({
      text: '250',
      unit: null,
    });
    expect(reduce(ml, { type: 'chooseCategory', box: 'a', category: 'volume' }).a).toEqual({
      text: '250',
      unit: 'milliliter',
    });
  });

  it('a chosen category clears the other box’s unit of another category, never a pair across', () => {
    const pair = run(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
    );
    expect(reduce(pair, { type: 'chooseCategory', box: 'a', category: 'volume' }).b.unit).toBe(
      'us-cup',
    );
    expect(reduce(pair, { type: 'chooseCategory', box: 'a', category: 'length' }).b).toEqual({
      text: '',
      unit: null,
    });
  });

  it('a unit taken from another category clears the other box’s unit too', () => {
    const pair = run(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
    );
    const s = reduce(pair, { type: 'use', box: 'a', unit: 'foot', text: '250' });
    expect(s.a).toEqual({ text: '250', unit: 'foot' });
    expect(s.b).toEqual({ text: '', unit: null });
  });

  it('choosing a category is one undoable step', () => {
    const h = steps(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'chooseCategory', box: 'a', category: 'length' },
    );
    expect(h.present.category).toBe('length');
    const undone = reduceWithHistory(h, { type: 'undo' });
    expect(undone.present.a).toEqual({ text: '250', unit: 'milliliter' });
    expect(undone.present.category).toBe('volume');
    // A category alone, with no unit, is still a step of its own.
    const bare = steps({ type: 'chooseCategory', box: 'a', category: 'time' });
    expect(bare.past).toHaveLength(1);
  });
});

describe('selectView', () => {
  it('derives the other box from the source once both units are set', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
    );
    const v = selectView(s, EN);
    expect(v.category).toBe('volume');
    expect(v.a.isSource).toBe(true);
    expect(v.a.text).toBe('5');
    expect(v.b.text).toBe('0.02113376419');
    expect(v.result).toMatchObject({ box: 'b', text: '0.02113376419' });
    expect(v.announcement).toBe('5 milliliters is 0.02113376419 cups');
    expect(v.b.message).toBeNull();
  });

  it('uses singular names for one', () => {
    const s = run(
      { type: 'input', box: 'a', text: '1', at: 0 },
      { type: 'lock', box: 'a', unit: 'mile' },
      { type: 'lock', box: 'b', unit: 'kilometer' },
    );
    expect(selectView(s, EN).announcement).toBe('1 mile is 1.609344 kilometers');
  });

  it('shows nothing in the derived box until there is a value and both units', () => {
    const s = run(
      { type: 'input', box: 'a', text: 'ml', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    const v = selectView(s, EN);
    expect(v.b.text).toBe('');
    expect(v.result).toBeNull();
    expect(v.b.scope).toBe('volume');
    expect(v.a.scope).toBe('volume');
  });

  it('scopes an empty box to the other box’s category', () => {
    const s = run(
      { type: 'input', box: 'b', text: '3', at: 0 },
      { type: 'lock', box: 'b', unit: 'fahrenheit' },
    );
    expect(selectView(s, EN).a.scope).toBe('temperature');
  });

  it('respects locale separators in the source text', () => {
    const s = run(
      { type: 'input', box: 'a', text: '1,5', at: 0 },
      { type: 'lock', box: 'a', unit: 'kilometer' },
      { type: 'lock', box: 'b', unit: 'meter' },
    );
    const de = selectView(s, { separators: { decimal: ',', group: '.' }, locale: 'de-DE' });
    expect(de.b.text).toBe('1.500');
    expect(selectView(s, EN).b.text).toBe('1,500');
  });

  it('says "too large" in the other box when the result overflows, never a bare zero', () => {
    const s = run(
      { type: 'input', box: 'a', text: '1e308', at: 0 },
      { type: 'lock', box: 'a', unit: 'kilometer' },
      { type: 'lock', box: 'b', unit: 'millimeter' },
    );
    const v = selectView(s, EN);
    expect(v.result).toBeNull();
    expect(v.b.text).toBe('');
    expect(v.b.message).toBe('Too large to convert');
    expect(v.a.message).toBeNull();
    expect(v.announcement).toBe('1e308 kilometers is too large to convert to millimeters');
  });

  it('converts arithmetic by its value and names the value, not the sum, aloud', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5+3', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'liter' },
    );
    const v = selectView(s, EN);
    expect(v.a.text).toBe('5+3');
    expect(v.b.text).toBe('0.008');
    expect(v.announcement).toBe('8 milliliters is 0.008 liters');
  });

  it('says so when arithmetic divides by zero', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5/0', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'liter' },
    );
    const v = selectView(s, EN);
    expect(v.result).toBeNull();
    expect(v.b.message).toBe('Can’t divide by zero');
    expect(v.announcement).toBe('Can’t divide by zero');
  });

  it('says "too small" when a nonzero result underflows to zero', () => {
    const s = run(
      { type: 'input', box: 'a', text: '1e-320', at: 0 },
      { type: 'lock', box: 'a', unit: 'millimeter' },
      { type: 'lock', box: 'b', unit: 'kilometer' },
    );
    const v = selectView(s, EN);
    expect(v.result).toBeNull();
    expect(v.b.message).toBe('Too small to convert');
  });

  it('a typed number beyond what a double holds still drives the other box, which says so', () => {
    const s = run(
      { type: 'lock', box: 'a', unit: 'kilometer' },
      { type: 'lock', box: 'b', unit: 'millimeter' },
      { type: 'input', box: 'b', text: '1e400', at: 0 },
    );
    expect(s.source).toBe('b');
    const v = selectView(s, EN);
    expect(v.a.message).toBe('Too large to convert');
    expect(v.b.message).toBeNull();
  });

  it('a real zero converts to zero', () => {
    const s = run(
      { type: 'input', box: 'a', text: '0', at: 0 },
      { type: 'lock', box: 'a', unit: 'kilometer' },
      { type: 'lock', box: 'b', unit: 'millimeter' },
    );
    const v = selectView(s, EN);
    expect(v.b.message).toBeNull();
    expect(v.b.text).toBe('0');
  });

  it('a unit query typed into the other box hides its message while it is typed', () => {
    const s = run(
      { type: 'input', box: 'a', text: '1e308', at: 0 },
      { type: 'lock', box: 'a', unit: 'kilometer' },
      { type: 'lock', box: 'b', unit: 'millimeter' },
      { type: 'input', box: 'b', text: 'mi', at: 10 },
    );
    expect(selectView(s, EN).b.message).toBeNull();
  });
});

describe('category, and the source before a number', () => {
  const view = (...actions: Parameters<typeof reduce>[1][]) => selectView(run(...actions), EN);

  it('is empty until a unit is chosen', () => {
    expect(view({ type: 'input', box: 'a', text: '5', at: 0 }).category).toBeNull();
  });

  it('comes from either box’s unit, so the label names it whichever box drives', () => {
    const v = view(
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'lock', box: 'b', unit: 'milliliter' },
    );
    expect(v.a.isSource).toBe(true);
    expect(v.category).toBe('volume');
  });

  it('before any number, the first box to get a unit becomes the source', () => {
    const s = run(
      { type: 'lock', box: 'b', unit: 'milliliter' },
      { type: 'lock', box: 'a', unit: 'us-cup' },
    );
    expect(s.source).toBe('b');
  });

  it('a later lock does not take the source from a box that holds a number', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'lock', box: 'b', unit: 'milliliter' },
      { type: 'lock', box: 'a', unit: 'liter' },
    );
    expect(s.source).toBe('a');
  });

  it('follows a switch of category', () => {
    const v = view(
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'fahrenheit' },
    );
    expect(v.category).toBe('temperature');
  });
});

describe('source handoff', () => {
  it('typing a bare unit into the other box does not take the source away', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'input', box: 'b', text: 'c', at: 0 },
    );
    expect(s.source).toBe('a');
    const v = selectView(s, EN);
    expect(v.a.text).toBe('5');
    expect(v.b.text).toBe('c');
  });

  it('typing a number into the other box does take the source', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
      { type: 'input', box: 'b', text: '2', at: 0 },
    );
    expect(s.source).toBe('b');
    expect(selectView(s, EN).a.text).toBe('473.176473');
  });

  it('a cleared source box leaves both sides empty', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
      { type: 'input', box: 'a', text: '', at: 0 },
    );
    const v = selectView(s, EN);
    expect(v.a.text).toBe('');
    expect(v.b.text).toBe('');
    expect(v.result).toBeNull();
  });
});

describe('nextBox', () => {
  const view = (...actions: Parameters<typeof reduce>[1][]) => selectView(run(...actions), EN);

  it('moves on to the other box once this one has a number and a unit', () => {
    const v = view(
      { type: 'input', box: 'a', text: '5 ml', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    expect(nextBox(v, 'a')).toBe('b');
  });

  it('stays while the other box has its unit', () => {
    const v = view(
      { type: 'input', box: 'a', text: '5 ml', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
    );
    expect(nextBox(v, 'a')).toBeNull();
  });

  it('stays while there is no number to convert', () => {
    const v = view({ type: 'lock', box: 'a', unit: 'milliliter' });
    expect(nextBox(v, 'a')).toBeNull();
  });

  it('stays while this box has no unit', () => {
    expect(nextBox(view({ type: 'input', box: 'a', text: '5', at: 0 }), 'a')).toBeNull();
  });

  it('moves to the box holding the number when only it lacks a unit', () => {
    const v = view(
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'lock', box: 'b', unit: 'foot' },
    );
    expect(nextBox(v, 'b')).toBe('a');
  });

  it('moves on after a switch of category clears the other box’s unit', () => {
    const v = view(
      { type: 'input', box: 'a', text: '5 ml', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
      { type: 'lock', box: 'a', unit: 'kilogram' },
    );
    expect(v.b.unit).toBeNull();
    expect(nextBox(v, 'a')).toBe('b');
  });
});

describe('use', () => {
  const pair = (): ConverterState =>
    run(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
    );

  it('moves a row into the box with its value, keeping the other box’s unit for two boxes', () => {
    const s = reduce(pair(), { type: 'use', box: 'a', unit: 'liter', text: '0.25' });
    expect(s.a).toEqual({ text: '0.25', unit: 'liter' });
    expect(s.b.unit).toBe('us-cup');
    expect(s.source).toBe('a');
  });

  it('gives the other box the box’s old unit when its unit moves in, so they never share one', () => {
    const s = reduce(pair(), { type: 'use', box: 'a', unit: 'us-cup', text: '1.056688209' });
    expect(s.a).toEqual({ text: '1.056688209', unit: 'us-cup' });
    expect(s.b).toEqual({ text: '', unit: 'milliliter' });
  });

  it('makes the box the source', () => {
    const s = reduce(
      run({ type: 'input', box: 'b', text: '2', at: 0 }, { type: 'lock', box: 'b', unit: 'liter' }),
      { type: 'use', box: 'a', unit: 'milliliter', text: '2000' },
    );
    expect(s.source).toBe('a');
  });

  it('ignores unknown units', () => {
    const s = pair();
    expect(reduce(s, { type: 'use', box: 'a', unit: 'nope', text: '1' })).toBe(s);
  });

  it('is one undoable step, after which Escape clears the number, then the unit', () => {
    let h = steps(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    h = reduceWithHistory(h, { type: 'use', box: 'a', unit: 'liter', text: '0.25' });
    expect(h.present.a).toEqual({ text: '0.25', unit: 'liter' });
    expect(escapeTarget(h, 'a')).toBe('text');
    const undone = reduceWithHistory(h, { type: 'undo' });
    expect(undone.present.a).toEqual({ text: '250', unit: 'milliliter' });
  });
});

describe('selectTable', () => {
  const options = { ...EN, locale: 'en-US', system: 'us' as const, tier: 'basic' as const };
  const view = (...actions: Parameters<typeof reduce>[1][]) =>
    selectTable(run(...actions), options);
  /** The category's units, as the table shows them once there is one. */
  const table = (...actions: Parameters<typeof reduce>[1][]) => {
    const shown = view(...actions);
    if (shown.kind !== 'units') throw new Error(`expected units, got ${shown.kind}`);
    return shown;
  };
  /** The matches, as the table's place shows them while a unit is typed. */
  const matches = (text: string, ...before: Parameters<typeof reduce>[1][]) => {
    const shown = view(...before, { type: 'input', box: 'a', text, at: 0 });
    if (shown.kind !== 'matches') throw new Error(`expected matches, got ${shown.kind}`);
    return shown;
  };

  it('starts from the categories, with or without a number', () => {
    for (const shown of [view(), view({ type: 'input', box: 'a', text: '250', at: 0 })]) {
      expect(shown.kind).toBe('start');
      if (shown.kind !== 'start') continue;
      expect(shown.categories.map((category) => category.id)).toContain('volume');
      expect(shown.announcement).toBeNull();
    }
  });

  it('lists a chosen category’s units with a dash for each until there is a number and a unit', () => {
    const chosen = table(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'chooseCategory', box: 'a', category: 'volume' },
    );
    expect(chosen.rows.map((row) => row.id)).toContain('us-cup');
    expect(chosen.rows.every((row) => row.tone === 'empty' && row.text === NO_VALUE)).toBe(true);
    expect(chosen.rows.every((row) => row.value === null && !row.inBox)).toBe(true);
    expect(chosen.announcement).toBe(`${chosen.rows.length} units of volume`);

    // A unit with no number: dashes, the box's unit marked.
    const bare = table({ type: 'lock', box: 'a', unit: 'milliliter' });
    expect(bare.rows.find((row) => row.inBox)?.id).toBe('milliliter');
    expect(bare.rows.every((row) => row.tone === 'empty')).toBe(true);

    // Removing the unit leaves the table in place.
    const removed = table(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'unlock', box: 'a' },
    );
    expect(removed.category).toBe('volume');
    expect(removed.rows.every((row) => row.tone === 'empty')).toBe(true);
  });

  it('lists every unit of the category in the list’s order, the box’s own marked', () => {
    const t = table(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    expect(t.box).toBe('a');
    expect(t.category).toBe('volume');
    expect(t.rows.map((row) => row.id)).toContain('liter');
    expect(t.rows.filter((row) => row.inBox).map((row) => row.id)).toEqual(['milliliter']);
    const liter = t.rows.find((row) => row.id === 'liter')!;
    expect(liter.text).toBe('0.25');
    expect(liter.value).toBeCloseTo(0.25, 12);
    expect(liter.name).toBe('liters');
  });

  it(`shows ${TABLE_PRECISION} significant digits and keeps the full value behind them`, () => {
    const t = table(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    const cups = t.rows.find((row) => row.id === 'us-cup')!;
    expect(cups.text).toBe('1.05669');
    expect(cups.value).toBeCloseTo(1.056688209, 9);
  });

  it('lists the other box’s unit like any other, in its place, kept only for two boxes', () => {
    const alone = table(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    const t = table(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
    );
    expect(t.rows.map((row) => row.id)).toEqual(alone.rows.map((row) => row.id));
    expect(t.rows.find((row) => row.id === 'us-cup')?.text).toBe('1.05669');
    expect(t.announcement).toBe(alone.announcement);
  });

  it('converts from the source, whichever box it is', () => {
    const t = table(
      { type: 'input', box: 'b', text: '2', at: 0 },
      { type: 'lock', box: 'b', unit: 'liter' },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    expect(t.box).toBe('b');
    expect(t.rows.filter((row) => row.inBox).map((row) => row.id)).toEqual(['liter']);
    expect(t.rows.find((row) => row.id === 'milliliter')?.text).toBe('2,000');
  });

  it('names one unit in the singular', () => {
    const t = table(
      { type: 'input', box: 'a', text: '1000', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    expect(t.rows.find((row) => row.id === 'liter')?.name).toBe('liter');
  });

  it('says once when the value has no answer, and per row when one unit cannot hold it', () => {
    const none = table(
      { type: 'input', box: 'a', text: '1e400', at: 0 },
      { type: 'lock', box: 'a', unit: 'kilometer' },
    );
    expect(none.message).toBe('Too large to convert');
    expect(none.rows).toEqual([]);
    expect(none.announcement).toBe('1e400 kilometers is too large to convert');

    const some = table(
      { type: 'input', box: 'a', text: '1e306', at: 0 },
      { type: 'lock', box: 'a', unit: 'kilometer' },
    );
    const mm = some.rows.find((row) => row.id === 'millimeter')!;
    expect(mm.text).toBe('Too large');
    expect(mm.tone).toBe('message');
    expect(mm.value).toBeNull();
  });

  it('announces how many units the value is shown in', () => {
    const t = table(
      { type: 'input', box: 'a', text: '250', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    expect(t.announcement).toBe(`250 milliliters in ${t.rows.length} units of volume`);
  });

  it('lists matches from every category while a unit is typed, grouped, with counts', () => {
    const m = matches('250 p');
    expect(m.query).toBe('p');
    // Each category's matches stay together, in the order of their best match.
    const groups = m.rows.map((row) => row.category.id);
    expect(groups).toEqual([...groups].sort((a, b) => groups.indexOf(a) - groups.indexOf(b)));
    expect(groups).toContain('mass');
    expect(groups).toContain('volume');
    expect(m.counts.volume).toBe(m.rows.filter((row) => row.category.id === 'volume').length);
    expect(m.announcement).toBe(`${m.rows.length} matches`);
  });

  it('puts the current category first among equal matches, hiding none', () => {
    expect(matches('250 p').rows[0]?.category.id).toBe('mass');
    const inVolume = matches('250 p', { type: 'chooseCategory', box: 'a', category: 'volume' });
    expect(inVolume.rows[0]?.category.id).toBe('volume');
    expect(inVolume.rows.map((row) => row.category.id)).toContain('mass');
  });

  it('offers a category whose name is typed, leading its group, counted with no units', () => {
    const m = matches('len');
    expect(m.rows[0]).toMatchObject({ kind: 'category', category: { id: 'length' } });
    expect(m.counts.length).toBe(0);
    expect(m.announcement).toBe('1 match');
  });

  it('marks the unit in the box among the matches, and says when nothing matches', () => {
    const m = matches('250 mil', { type: 'lock', box: 'a', unit: 'milliliter' });
    expect(m.rows.filter((row) => row.kind === 'unit' && row.inBox)).toHaveLength(1);
    const none = matches('250 xyzzy');
    expect(none.rows).toEqual([]);
    expect(none.announcement).toBe('No unit matches');
  });

  it('waits on a sign, a decimal mark, or an exponent on its way, as for a number', () => {
    for (const text of ['-', '-3', '1e', '1e-', '6*3', '5.']) {
      expect(view({ type: 'input', box: 'a', text, at: 0 }).kind, text).toBe('start');
    }
  });
});

function steps(...actions: HistoryAction[]): History {
  return actions.reduce(reduceWithHistory, initialHistory);
}

describe('history', () => {
  const type = (box: 'a' | 'b', text: string, at: number): HistoryAction => ({
    type: 'input',
    box,
    text,
    at,
  });
  const undo = (h: History) => reduceWithHistory(h, { type: 'undo' });
  const redo = (h: History) => reduceWithHistory(h, { type: 'redo' });
  const back = (h: History, box: TextTarget = 'a') =>
    reduceWithHistory(h, { type: 'stepBack', box });
  const calcType = (text: string, at: number): HistoryAction => ({
    type: 'calcType',
    text,
    fresh: false,
    at,
  });

  it('keystrokes within the pause window form one chunk', () => {
    const h = steps(type('a', '2', 0), type('a', '25', 200), type('a', '250', 400));
    expect(h.past).toHaveLength(1);
    expect(undo(h).present.a.text).toBe('');
  });

  it('the calculator types in chunks that Escape takes back one at a time', () => {
    const later = TYPING_CHUNK_MS + 100;
    let h = steps(
      calcType('1', 0),
      calcType('12', 100),
      calcType('123', 100 + later),
      calcType('1234', 200 + 2 * later),
    );
    const seen: string[] = [];
    for (let step = 0; step < 3; step += 1) {
      h = back(h, 'calc');
      seen.push(h.present.calc.text);
    }
    expect(seen).toEqual(['123', '12', '']);
    expect(escapeTarget(h, 'calc')).toBeNull();
    // Each Escape step is undoable, like a box's.
    expect(undo(h).present.calc.text).toBe('12');
  });

  it('undo goes from a send back into the arithmetic that produced it', () => {
    let h = steps(
      calcType('1', 0),
      calcType('12', 100),
      calcType('12×', 200),
      calcType('12×3', 300),
      { type: 'calcSet', text: '36', fresh: true },
      { type: 'replace', box: 'b', text: '36' },
    );
    expect(h.present.b.text).toBe('36');
    h = undo(h);
    expect(h.present.b.text).toBe('');
    expect(h.present.calc.text).toBe('36');
    h = undo(h);
    expect(h.present.calc.text).toBe('12×3');
    h = redo(redo(h));
    expect(h.present.b.text).toBe('36');
  });

  it('clear all and swap leave the calculator’s entry alone', () => {
    const h = steps(calcType('42', 0), type('a', '5', 1000), { type: 'swap' }, { type: 'clear' });
    expect(h.present.calc.text).toBe('42');
    expect(escapeTarget(h, 'calc')).toBe('text');
  });

  it('replace is a step of its own, so undo brings the arithmetic back', () => {
    const h = steps(type('a', '5+3', 0), { type: 'replace', box: 'a', text: '8' });
    expect(h.past).toHaveLength(2);
    expect(h.present.a.text).toBe('8');
    expect(undo(h).present.a.text).toBe('5+3');
    expect(redo(undo(h)).present.a.text).toBe('8');
  });

  it('a pause longer than the window starts a new chunk', () => {
    const h = steps(type('a', '25', 0), type('a', '250', TYPING_CHUNK_MS + 1));
    expect(h.past).toHaveLength(2);
    expect(undo(h).present.a.text).toBe('25');
    expect(undo(undo(h)).present.a.text).toBe('');
  });

  it('the pause is measured from the latest keystroke, not from the start of the chunk', () => {
    const gap = TYPING_CHUNK_MS - 100;
    const h = steps(type('a', '1', 0), type('a', '12', gap), type('a', '123', gap * 2));
    expect(h.past).toHaveLength(1);
  });

  it('a space starts a new chunk, so the number and the unit text are separate steps', () => {
    const h = steps(
      type('a', '5', 0),
      type('a', '5 ', 50),
      type('a', '5 m', 100),
      type('a', '5 ml', 150),
    );
    expect(h.past).toHaveLength(2);
    expect(undo(h).present.a.text).toBe('5');
  });

  it('typing in the other box starts a new chunk', () => {
    const h = steps(type('a', '5', 0), type('b', '7', 50), type('a', '55', 100));
    expect(h.past).toHaveLength(3);
  });

  it('Escape steps back one chunk at a time, and each step can be undone', () => {
    const h = steps(type('a', '25', 0), type('a', '250', 2000));
    expect(escapeTarget(h, 'a')).toBe('text');
    const once = back(h);
    expect(once.present.a.text).toBe('25');
    const twice = back(once);
    expect(twice.present.a.text).toBe('');
    expect(escapeTarget(twice, 'a')).toBeNull();
    expect(back(twice)).toBe(twice);
    expect(undo(twice).present.a.text).toBe('25');
    expect(undo(undo(twice)).present.a.text).toBe('250');
  });

  it('Escape takes back the unit when it was the latest entry, then the typing before it', () => {
    let h = steps(type('a', '250 ml', 0), { type: 'lock', box: 'a', unit: 'milliliter' });
    expect(escapeTarget(h, 'a')).toBe('unit');
    h = back(h);
    expect(h.present.a).toEqual({ text: '250', unit: null });
    expect(escapeTarget(h, 'a')).toBe('text');
    h = back(h);
    expect(h.present.a.text).toBe('');
  });

  it('Escape takes back typing done after the lock before it takes the unit', () => {
    let h = steps(
      type('a', '250 ml', 0),
      { type: 'lock', box: 'a', unit: 'milliliter' },
      type('a', '2500', 5000),
    );
    expect(escapeTarget(h, 'a')).toBe('text');
    h = back(h);
    expect(h.present.a).toEqual({ text: '250', unit: 'milliliter' });
    expect(escapeTarget(h, 'a')).toBe('unit');
    h = back(h);
    expect(h.present.a).toEqual({ text: '250', unit: null });
  });

  it('a unit query typed into the derived box is a text step; its stale number is not', () => {
    let h = steps(
      type('b', '2', 0),
      { type: 'lock', box: 'b', unit: 'us-cup' },
      type('a', '5', 1000),
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    expect(escapeTarget(h, 'b')).toBe('unit');
    h = reduceWithHistory(h, type('b', 'c', 2000));
    expect(escapeTarget(h, 'b')).toBe('text');
    h = back(h, 'b');
    expect(h.present.b.text).toBe('');
    expect(h.present.source).toBe('a');
    expect(escapeTarget(h, 'b')).toBe('unit');
  });

  it('falls back to the text, then the unit, for a conversion loaded from the URL', () => {
    let h = steps({
      type: 'hydrate',
      state: { a: { text: '5', unit: 'mile' }, b: { text: '', unit: 'kilometer' }, source: 'a' },
    });
    expect(escapeTarget(h, 'a')).toBe('text');
    expect(escapeTarget(h, 'b')).toBe('unit');
    h = back(h);
    expect(h.present.a).toEqual({ text: '', unit: 'mile' });
    expect(escapeTarget(h, 'a')).toBe('unit');
  });

  it('undoing a lock keeps the number and drops the unit; redo brings it back', () => {
    const h = steps(type('a', '250 ml', 0), { type: 'lock', box: 'a', unit: 'milliliter' });
    expect(h.present.a).toEqual({ text: '250', unit: 'milliliter' });
    const undone = undo(h);
    expect(undone.present.a).toEqual({ text: '250', unit: null });
    expect(redo(undone).present.a).toEqual({ text: '250', unit: 'milliliter' });
  });

  it('undoing a unit change restores the previous unit', () => {
    const h = steps(
      type('a', '5', 0),
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'a', unit: 'liter' },
    );
    expect(undo(h).present.a).toEqual({ text: '5', unit: 'milliliter' });
  });

  it('undoes in interaction order across boxes', () => {
    let h = steps(
      type('a', '5', 0),
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
      type('b', '2', 100),
    );
    h = undo(h);
    expect(h.present.b).toEqual({ text: '', unit: 'us-cup' });
    h = undo(h);
    expect(h.present.b).toEqual({ text: '', unit: null });
    h = undo(h);
    expect(h.present.a).toEqual({ text: '5', unit: null });
    h = undo(h);
    expect(h.present.a.text).toBe('');
    expect(undo(h)).toBe(h);
  });

  it('keeps at most HISTORY_LIMIT steps, dropping the oldest', () => {
    const actions: HistoryAction[] = [];
    for (let i = 1; i <= HISTORY_LIMIT + 10; i += 1) {
      actions.push(type('a', String(i), i * (TYPING_CHUNK_MS + 1)));
    }
    const h = steps(...actions);
    expect(h.past).toHaveLength(HISTORY_LIMIT);
    let undone = h;
    for (let i = 0; i < HISTORY_LIMIT; i += 1) undone = undo(undone);
    expect(undone.present.a.text).toBe('10');
    expect(undo(undone)).toBe(undone);
  });

  it('a new action clears the redo stack', () => {
    const h = steps(type('a', '5', 0), { type: 'lock', box: 'a', unit: 'meter' });
    const undone = undo(h);
    expect(undone.future).toHaveLength(1);
    const branched = reduceWithHistory(undone, { type: 'lock', box: 'a', unit: 'foot' });
    expect(branched.future).toHaveLength(0);
    expect(redo(branched)).toBe(branched);
  });

  it('hydrate starts a fresh history and no-ops add nothing', () => {
    const h = steps(
      type('a', '5', 0),
      { type: 'hydrate', state: { a: { text: '1', unit: 'mile' }, source: 'a' } },
      type('a', '1', 100),
    );
    expect(h.past).toHaveLength(0);
    expect(h.present.a).toEqual({ text: '1', unit: 'mile' });
  });

  it('swap carries each box’s steps to the other side', () => {
    let h = steps(
      type('a', '250 ml', 0),
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'swap' },
    );
    expect(escapeTarget(h, 'b')).toBe('unit');
    expect(escapeTarget(h, 'a')).toBeNull();
    h = back(h, 'b');
    expect(h.present.b).toEqual({ text: '250', unit: null });
  });

  it('a cross-category lock takes the other box’s unit step with it', () => {
    const h = steps(
      type('a', '5', 0),
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'fahrenheit' },
    );
    expect(h.present.a).toEqual({ text: '5', unit: null });
    expect(escapeTarget(h, 'a')).toBe('text');
  });
});
