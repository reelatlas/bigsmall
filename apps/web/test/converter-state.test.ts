import { describe, expect, it } from 'vitest';
import {
  initialState,
  reduce,
  selectView,
  type ConverterState,
} from '../src/features/converter/state';

const EN = { separators: { decimal: '.', group: ',' } };

function run(...actions: Parameters<typeof reduce>[1][]): ConverterState {
  return actions.reduce(reduce, initialState);
}

describe('reduce', () => {
  it('input stores the text and makes the box the source', () => {
    const s = run({ type: 'input', box: 'b', text: '5 ml' });
    expect(s.b.text).toBe('5 ml');
    expect(s.source).toBe('b');
    expect(s.a).toEqual(initialState.a);
  });

  it('lock keeps the number, drops the query, and sets the unit', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5 ml' },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    expect(s.a).toEqual({ text: '5', unit: 'milliliter' });
  });

  it('lock with a bare unit leaves the text empty', () => {
    const s = run(
      { type: 'input', box: 'a', text: 'ml' },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    expect(s.a).toEqual({ text: '', unit: 'milliliter' });
  });

  it('lock ignores unknown units', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5' },
      { type: 'lock', box: 'a', unit: 'cubit' },
    );
    expect(s.a.unit).toBeNull();
  });

  it('locking a different category in the other box clears the first unit and explains', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5' },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'fahrenheit' },
    );
    expect(s.a).toEqual({ text: '5', unit: null });
    expect(s.b.unit).toBe('fahrenheit');
    expect(s.notice).toBe('Switched to Temperature');
  });

  it('a derived box that loses its unit also loses its stale text', () => {
    const s = run(
      { type: 'input', box: 'b', text: '7' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
      { type: 'input', box: 'a', text: '5' },
      { type: 'lock', box: 'a', unit: 'celsius' },
    );
    expect(s.b).toEqual({ text: '', unit: null });
    expect(s.source).toBe('a');
  });

  it('unlock keeps the text', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5 ml' },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'unlock', box: 'a' },
    );
    expect(s.a).toEqual({ text: '5', unit: null });
  });

  it('swap exchanges boxes and moves the source with the typed value', () => {
    const s = run(
      { type: 'input', box: 'a', text: '1' },
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
      { type: 'input', box: 'a', text: '5' },
      { type: 'clear' },
    );
    expect(s).toEqual({ ...initialState, mode: 'advanced' });
  });

  it('hydrate merges and clears any notice', () => {
    const s = run({ type: 'hydrate', state: { a: { text: '2', unit: 'foot' }, source: 'a' } });
    expect(s.a).toEqual({ text: '2', unit: 'foot' });
    expect(s.notice).toBeNull();
  });
});

describe('selectView', () => {
  it('derives the other box from the source once both units are set', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5' },
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
    expect(v.error).toBeNull();
  });

  it('uses singular names for one', () => {
    const s = run(
      { type: 'input', box: 'a', text: '1' },
      { type: 'lock', box: 'a', unit: 'mile' },
      { type: 'lock', box: 'b', unit: 'kilometer' },
    );
    expect(selectView(s, EN).announcement).toBe('1 mile is 1.609344 kilometers');
  });

  it('shows nothing in the derived box until there is a value and both units', () => {
    const s = run(
      { type: 'input', box: 'a', text: 'ml' },
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
      { type: 'input', box: 'b', text: '3' },
      { type: 'lock', box: 'b', unit: 'fahrenheit' },
    );
    expect(selectView(s, EN).a.scope).toBe('temperature');
  });

  it('respects locale separators in the source text', () => {
    const s = run(
      { type: 'input', box: 'a', text: '1,5' },
      { type: 'lock', box: 'a', unit: 'kilometer' },
      { type: 'lock', box: 'b', unit: 'meter' },
    );
    const de = selectView(s, { separators: { decimal: ',', group: '.' }, locale: 'de-DE' });
    expect(de.b.text).toBe('1.500');
    expect(selectView(s, EN).b.text).toBe('1,500');
  });

  it('reports an error when the result overflows', () => {
    const s = run(
      { type: 'input', box: 'a', text: '1e308' },
      { type: 'lock', box: 'a', unit: 'kilometer' },
      { type: 'lock', box: 'b', unit: 'millimeter' },
    );
    const v = selectView(s, EN);
    expect(v.result).toBeNull();
    expect(v.error).toMatch(/too large/);
  });
});

describe('source handoff', () => {
  it('typing a bare unit into the other box does not take the source away', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5' },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'input', box: 'b', text: 'c' },
    );
    expect(s.source).toBe('a');
    const v = selectView(s, EN);
    expect(v.a.text).toBe('5');
    expect(v.b.text).toBe('c');
  });

  it('typing a number into the other box does take the source', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5' },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
      { type: 'input', box: 'b', text: '2' },
    );
    expect(s.source).toBe('b');
    expect(selectView(s, EN).a.text).toBe('473.176473');
  });

  it('a cleared source box leaves both sides empty', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5' },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
      { type: 'input', box: 'a', text: '' },
    );
    const v = selectView(s, EN);
    expect(v.a.text).toBe('');
    expect(v.b.text).toBe('');
    expect(v.result).toBeNull();
  });
});

import {
  initialHistory,
  reduceWithHistory,
  type History,
  type HistoryAction,
} from '../src/features/converter/state';

function steps(...actions: HistoryAction[]): History {
  return actions.reduce(reduceWithHistory, initialHistory);
}

describe('history', () => {
  it('coalesces a typing run into one entry', () => {
    const h = steps(
      { type: 'input', box: 'a', text: '2' },
      { type: 'input', box: 'a', text: '25' },
      { type: 'input', box: 'a', text: '250' },
    );
    expect(h.past).toHaveLength(1);
    expect(reduceWithHistory(h, { type: 'undo' }).present.a.text).toBe('');
  });

  it('undoing a lock keeps the number and drops the unit; redo brings it back', () => {
    const h = steps(
      { type: 'input', box: 'a', text: '250 ml' },
      { type: 'lock', box: 'a', unit: 'milliliter' },
    );
    expect(h.present.a).toEqual({ text: '250', unit: 'milliliter' });
    const undone = reduceWithHistory(h, { type: 'undo' });
    expect(undone.present.a).toEqual({ text: '250', unit: null });
    const redone = reduceWithHistory(undone, { type: 'redo' });
    expect(redone.present.a).toEqual({ text: '250', unit: 'milliliter' });
  });

  it('undoing a unit change restores the previous unit', () => {
    const h = steps(
      { type: 'input', box: 'a', text: '5' },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'a', unit: 'liter' },
    );
    expect(reduceWithHistory(h, { type: 'undo' }).present.a).toEqual({
      text: '5',
      unit: 'milliliter',
    });
  });

  it('undoes in interaction order across boxes', () => {
    let h = steps(
      { type: 'input', box: 'a', text: '5' },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'us-cup' },
      { type: 'input', box: 'b', text: '2' },
    );
    h = reduceWithHistory(h, { type: 'undo' });
    expect(h.present.b).toEqual({ text: '', unit: 'us-cup' });
    h = reduceWithHistory(h, { type: 'undo' });
    expect(h.present.b).toEqual({ text: '', unit: null });
    h = reduceWithHistory(h, { type: 'undo' });
    expect(h.present.a).toEqual({ text: '5', unit: null });
    h = reduceWithHistory(h, { type: 'undo' });
    expect(h.present.a.text).toBe('');
    expect(reduceWithHistory(h, { type: 'undo' })).toBe(h);
  });

  it('a new action clears the redo stack', () => {
    const h = steps(
      { type: 'input', box: 'a', text: '5' },
      { type: 'lock', box: 'a', unit: 'meter' },
    );
    const undone = reduceWithHistory(h, { type: 'undo' });
    expect(undone.future).toHaveLength(1);
    const branched = reduceWithHistory(undone, { type: 'lock', box: 'a', unit: 'foot' });
    expect(branched.future).toHaveLength(0);
    expect(reduceWithHistory(branched, { type: 'redo' })).toBe(branched);
  });

  it('hydrate starts a fresh history and no-ops add nothing', () => {
    const h = steps(
      { type: 'input', box: 'a', text: '5' },
      { type: 'hydrate', state: { a: { text: '1', unit: 'mile' }, source: 'a' } },
      { type: 'input', box: 'a', text: '1' },
    );
    expect(h.past).toHaveLength(0);
    expect(h.present.a).toEqual({ text: '1', unit: 'mile' });
  });
});
