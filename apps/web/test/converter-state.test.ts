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

  it('locking a different category in the other box clears the first unit and explains', () => {
    const s = run(
      { type: 'input', box: 'a', text: '5', at: 0 },
      { type: 'lock', box: 'a', unit: 'milliliter' },
      { type: 'lock', box: 'b', unit: 'fahrenheit' },
    );
    expect(s.a).toEqual({ text: '5', unit: null });
    expect(s.b.unit).toBe('fahrenheit');
    expect(s.notice).toBe('Switched to Temperature');
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

  it('hydrate merges and clears any notice', () => {
    const s = run({ type: 'hydrate', state: { a: { text: '2', unit: 'foot' }, source: 'a' } });
    expect(s.a).toEqual({ text: '2', unit: 'foot' });
    expect(s.notice).toBeNull();
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
    expect(v.error).toBeNull();
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

  it('reports an error when the result overflows', () => {
    const s = run(
      { type: 'input', box: 'a', text: '1e308', at: 0 },
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

import {
  initialHistory,
  escapeTarget,
  reduceWithHistory,
  TYPING_CHUNK_MS,
  type History,
  type HistoryAction,
} from '../src/features/converter/state';

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
  const back = (h: History, box: 'a' | 'b' = 'a') =>
    reduceWithHistory(h, { type: 'stepBack', box });

  it('keystrokes within the pause window form one chunk', () => {
    const h = steps(type('a', '2', 0), type('a', '25', 200), type('a', '250', 400));
    expect(h.past).toHaveLength(1);
    expect(undo(h).present.a.text).toBe('');
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
