import { describe, expect, it } from 'vitest';
import {
  HISTORY_LIMIT,
  initialHistory,
  initialState,
  NO_VALUE,
  reduce,
  reduceWithHistory,
  selectBox,
  selectTable,
  TABLE_PRECISION,
  type Action,
  type ConverterState,
  type History,
  type HistoryAction,
} from '../src/features/converter/state';
import { TYPING_CHUNK_MS } from '../src/lib/timing';

const EN = { separators: { decimal: '.', group: ',' } };

function run(...actions: Action[]): ConverterState {
  return actions.reduce(reduce, initialState);
}

function steps(...actions: HistoryAction[]): History {
  return actions.reduce(reduceWithHistory, initialHistory);
}

const type = (text: string, at = 0): Action => ({ type: 'input', text, at });

describe('reduce', () => {
  it('input and replace store the box’s text', () => {
    expect(run(type('5 ml')).text).toBe('5 ml');
    expect(run(type('5+3'), { type: 'replace', text: '8' }).text).toBe('8');
  });

  it('use puts a unit in the box with its text, and its category follows', () => {
    const s = run(type('250 cu'), { type: 'use', unit: 'us-cup', text: '250' });
    expect(s).toMatchObject({ text: '250', unit: 'us-cup', category: 'volume' });
    expect(reduce(s, { type: 'use', unit: 'foot', text: '250' }).category).toBe('length');
  });

  it('use ignores unknown units', () => {
    const s = run(type('5'));
    expect(reduce(s, { type: 'use', unit: 'nope', text: '1' })).toBe(s);
  });

  it('a chosen category keeps the number, drops the query, and picks no unit', () => {
    const s = run(type('250 cu'), { type: 'chooseCategory', category: 'volume' });
    expect(s).toMatchObject({ text: '250', unit: null, category: 'volume' });
  });

  it('a chosen category takes the unit away unless the unit is of it', () => {
    const ml = run(type('250'), { type: 'use', unit: 'milliliter', text: '250' });
    expect(reduce(ml, { type: 'chooseCategory', category: 'length' })).toMatchObject({
      text: '250',
      unit: null,
      category: 'length',
    });
    expect(reduce(ml, { type: 'chooseCategory', category: 'volume' })).toMatchObject({
      text: '250',
      unit: 'milliliter',
    });
  });

  it('unlock takes the unit out and keeps the text and the category', () => {
    const s = run(
      type('250'),
      { type: 'use', unit: 'milliliter', text: '250' },
      { type: 'unlock' },
    );
    expect(s).toMatchObject({ text: '250', unit: null, category: 'volume' });
  });

  it('clear resets everything but the calculator’s entry', () => {
    const s = run(
      { type: 'calcType', text: '42', fresh: false, at: 0 },
      { type: 'use', unit: 'milliliter', text: '5' },
      { type: 'clear' },
    );
    expect(s).toEqual({ ...initialState, calc: { text: '42', fresh: false } });
  });

  it('hydrate restores the box, and its unit names the category', () => {
    const s = run({ type: 'hydrate', state: { text: '2', unit: 'foot' } });
    expect(s).toMatchObject({ text: '2', unit: 'foot', category: 'length' });
    expect(run({ type: 'hydrate', state: { text: '2', unit: null } }).category).toBeNull();
  });
});

describe('selectBox', () => {
  it('gives the unit and reads the text with the visitor’s separators', () => {
    const box = selectBox(run({ type: 'use', unit: 'liter', text: '1,5' }), {
      separators: { decimal: ',', group: '.' },
    });
    expect(box.unit?.id).toBe('liter');
    expect(box.parsed.value).toBe(1.5);
    expect(selectBox(initialState, EN).unit).toBeNull();
  });
});

describe('selectTable', () => {
  const options = { ...EN, locale: 'en-US', system: 'us' as const };
  const view = (...actions: Action[]) => selectTable(run(...actions), options);
  /** The category's units, as the table shows them once there is one. */
  const table = (...actions: Action[]) => {
    const shown = view(...actions);
    if (shown.kind !== 'units') throw new Error(`expected units, got ${shown.kind}`);
    return shown;
  };
  /** The matches, as the table shows them while a unit is typed. */
  const matches = (text: string, ...before: Action[]) => {
    const shown = view(...before, type(text));
    if (shown.kind !== 'matches') throw new Error(`expected matches, got ${shown.kind}`);
    return shown;
  };
  const ml = (text = '250'): Action => ({ type: 'use', unit: 'milliliter', text });

  it('starts from the categories, with or without a number', () => {
    for (const shown of [view(), view(type('250'))]) {
      expect(shown.kind).toBe('start');
      expect(shown.categories.map((category) => category.id)).toContain('volume');
      expect(shown.announcement).toBeNull();
    }
  });

  it('lists a chosen category’s units with a dash for each until there is a number and a unit', () => {
    const chosen = table(type('250'), { type: 'chooseCategory', category: 'volume' });
    expect(chosen.rows.map((row) => row.id)).toContain('us-cup');
    expect(chosen.rows.every((row) => row.tone === 'empty' && row.text === NO_VALUE)).toBe(true);
    expect(chosen.rows.every((row) => row.value === null && !row.inBox)).toBe(true);
    expect(chosen.announcement).toBe(`${chosen.rows.length} units of volume`);

    // A unit with no number: dashes, the box's unit marked.
    const bare = table(ml(''));
    expect(bare.rows.find((row) => row.inBox)?.id).toBe('milliliter');
    expect(bare.rows.every((row) => row.tone === 'empty')).toBe(true);

    // Taking the unit out leaves the table in place.
    const removed = table(ml(), { type: 'unlock' });
    expect(removed.category).toBe('volume');
    expect(removed.rows.every((row) => row.tone === 'empty')).toBe(true);
  });

  it('lists every unit of the category in the listed order, the box’s own marked', () => {
    const t = table(ml());
    expect(t.category).toBe('volume');
    // The visitor's own standard units first, smallest first; specialty ones come last.
    expect(t.rows.map((row) => row.id).slice(0, 4)).toEqual([
      'us-teaspoon',
      'us-tablespoon',
      'us-fluid-ounce',
      'us-cup',
    ]);
    expect(t.rows.filter((row) => row.inBox).map((row) => row.id)).toEqual(['milliliter']);
    const liter = t.rows.find((row) => row.id === 'liter')!;
    expect(liter.text).toBe('0.25');
    expect(liter.value).toBeCloseTo(0.25, 12);
    expect(liter.name).toBe('liters');
  });

  it(`shows ${TABLE_PRECISION} significant digits and keeps the full value behind them`, () => {
    const cups = table(ml()).rows.find((row) => row.id === 'us-cup')!;
    expect(cups.text).toBe('1.05669');
    expect(cups.value).toBeCloseTo(1.056688209, 9);
  });

  it('writes a pace in minutes and seconds, a clock its rows keep (Sean, 2026-10-16)', () => {
    const pace = table({ type: 'use', unit: 'minute-per-kilometer', text: '5:30' });
    const row = (id: string) => pace.rows.find((each) => each.id === id)!;
    expect(row('minute-per-kilometer')).toMatchObject({ text: '5:30', clock: true, inBox: true });
    expect(row('minute-per-mile')).toMatchObject({ text: '8:51', clock: true });
    expect(row('kilometer-per-hour')).toMatchObject({ text: '10.9091', clock: false });
    expect(row('minute-per-mile').value).toBeCloseTo(5.5 * 1.609344, 12);
    // Paces in a section of their own, after the speeds' systems and before Specialty, the
    // visitor's own first.
    expect(pace.sections.map((section) => section.label)).toEqual([
      'US (customary)',
      'Metric',
      'Other',
      'Pace',
      'Specialty',
    ]);
    expect(pace.sections[3]!.rows.map((each) => each.id)).toEqual([
      'minute-per-mile',
      'minute-per-kilometer',
    ]);
    // A treadmill's 10 km/h is 6:00 a kilometer.
    const treadmill = table({ type: 'use', unit: 'kilometer-per-hour', text: '10' });
    expect(treadmill.rows.find((each) => each.id === 'minute-per-kilometer')?.text).toBe('6:00');
  });

  it('says a temperature as a change too, after the readings, every scale but the box’s own', () => {
    const celsius = table({ type: 'use', unit: 'celsius', text: '5' });
    const change = celsius.sections.at(-1)!;
    expect(change).toMatchObject({ key: 'change', repeats: true });
    expect(change.label).toBe('As a change: 5 °C warmer or cooler');
    expect(change.rows.map((row) => [row.id, row.unit.id, row.text])).toEqual([
      ['fahrenheit-change', 'fahrenheit', '9'],
      ['kelvin-change', 'kelvin', '5'],
      ['rankine-change', 'rankine', '9'],
    ]);
    // The readings stay readings: 5 °C reads 41 °F.
    expect(celsius.rows.find((row) => row.id === 'fahrenheit')?.text).toBe('41');
    // A negative change says its direction itself, its sign kept in every row.
    const colder = table({ type: 'use', unit: 'fahrenheit', text: '-25' });
    expect(colder.sections.at(-1)!.label).toBe('As a change: -25 °F');
    expect(colder.rows.find((row) => row.id === 'celsius-change')?.text).toBe('-13.8889');
    // No number yet: the section waits with dashes; other categories have none.
    expect(table(ml('')).sections.some((section) => section.key === 'change')).toBe(false);
    const waiting = table({ type: 'use', unit: 'kelvin', text: '' });
    expect(waiting.sections.at(-1)!.label).toBe('As a change');
  });

  it('names one unit in the singular', () => {
    expect(table(ml('1000')).rows.find((row) => row.id === 'liter')?.name).toBe('liter');
  });

  it('says once when the value has no answer, and per row when one unit cannot hold it', () => {
    const km = (text: string): Action => ({ type: 'use', unit: 'kilometer', text });
    const none = table(km('1e400'));
    expect(none.message).toBe('Too large to convert');
    expect(none.rows).toEqual([]);
    expect(none.announcement).toBe('1e400 kilometers is too large to convert');

    const mm = table(km('1e306')).rows.find((row) => row.id === 'millimeter')!;
    expect(mm.text).toBe('Too large');
    expect(mm.tone).toBe('message');
    expect(mm.value).toBeNull();
  });

  it('says a reciprocal unit is undefined for 0, the others reading 0', () => {
    const rows = table({ type: 'use', unit: 'mile-per-us-gallon', text: '0' }).rows;
    const per100km = rows.find((row) => row.id === 'liter-per-100-kilometers')!;
    expect(per100km.text).toBe('Undefined for 0');
    expect(per100km.tone).toBe('message');
    expect(per100km.value).toBeNull();
    expect(rows.find((row) => row.id === 'kilometer-per-liter')?.text).toBe('0');
  });

  it('announces how many units the value is shown in', () => {
    const t = table(ml());
    expect(t.announcement).toBe(`250 milliliters in ${t.rows.length} units of volume`);
  });

  it('names arithmetic by its value aloud', () => {
    expect(table(ml('5+3')).announcement).toMatch(/^8 milliliters in /);
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

  it('puts the current category first among equal matches, hiding none, and names it', () => {
    const anywhere = matches('250 o');
    expect(anywhere.rows[0]?.category.id).toBe('mass');
    expect(anywhere.category).toBeNull();
    const inVolume = matches('250 o', { type: 'chooseCategory', category: 'volume' });
    expect(inVolume.rows[0]?.category.id).toBe('volume');
    expect(inVolume.rows.map((row) => row.category.id)).toContain('mass');
    // The category stays named while a unit is typed, chosen alone or with a unit in the box.
    expect(inVolume.category).toBe('volume');
    expect(matches('250 o', ml()).category).toBe('volume');
  });

  it('offers a category whose name is typed, leading its group, counted with no units', () => {
    const m = matches('len');
    expect(m.rows[0]).toMatchObject({ kind: 'category', category: { id: 'length' } });
    expect(m.counts.length).toBe(0);
    expect(m.announcement).toBe('1 match');
  });

  it('marks the unit in the box among the matches, and says when nothing matches', () => {
    const m = matches('250 mil', ml());
    expect(m.rows.filter((row) => row.kind === 'unit' && row.inBox)).toHaveLength(1);
    const none = matches('250 xyzzy');
    expect(none.rows).toEqual([]);
    expect(none.announcement).toBe('No unit matches');
  });

  it('waits on a sign, a decimal mark, or an exponent on its way, as for a number', () => {
    for (const text of ['-', '-3', '1e', '1e-', '6*3', '5.']) {
      expect(view(type(text)).kind, text).toBe('start');
    }
  });
});

describe('history', () => {
  const undo = (h: History) => reduceWithHistory(h, { type: 'undo' });
  const redo = (h: History) => reduceWithHistory(h, { type: 'redo' });
  const back = (h: History) => reduceWithHistory(h, { type: 'stepBack' });
  const calcType = (text: string, at: number): HistoryAction => ({
    type: 'calcType',
    text,
    fresh: false,
    at,
  });

  it('keystrokes within the pause window form one chunk', () => {
    const h = steps(type('2', 0), type('25', 200), type('250', 400));
    expect(h.past).toHaveLength(1);
    expect(undo(h).present.text).toBe('');
  });

  it('a pause longer than the window starts a new chunk', () => {
    const h = steps(type('25', 0), type('250', TYPING_CHUNK_MS + 1));
    expect(h.past).toHaveLength(2);
    expect(undo(h).present.text).toBe('25');
    expect(undo(undo(h)).present.text).toBe('');
  });

  it('the pause is measured from the latest keystroke, not from the start of the chunk', () => {
    const gap = TYPING_CHUNK_MS - 100;
    expect(steps(type('1', 0), type('12', gap), type('123', gap * 2)).past).toHaveLength(1);
  });

  it('a space starts a new chunk, so the number and the unit text are separate steps', () => {
    const h = steps(type('5', 0), type('5 ', 50), type('5 m', 100), type('5 ml', 150));
    expect(h.past).toHaveLength(2);
    expect(undo(h).present.text).toBe('5');
  });

  it('typing in the calculator and then in the box makes separate chunks', () => {
    expect(steps(type('5', 0), calcType('7', 50), type('55', 100)).past).toHaveLength(3);
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
      h = back(h);
      seen.push(h.present.calc.text);
    }
    expect(seen).toEqual(['123', '12', '']);
    expect(back(h)).toBe(h);
    // Each Escape step is undoable.
    expect(undo(h).present.calc.text).toBe('12');
  });

  it('after = or C, the calculator’s Escape clears the entry rather than restoring the sum', () => {
    const h = steps(calcType('12×3', 0), { type: 'calcSet', text: '36', fresh: true });
    expect(back(h).present.calc.text).toBe('');
  });

  it('undo goes from a send back into the arithmetic that produced it', () => {
    let h = steps(
      calcType('1', 0),
      calcType('12', 100),
      calcType('12×', 200),
      calcType('12×3', 300),
      { type: 'calcSet', text: '36', fresh: true },
      { type: 'replace', text: '36' },
    );
    expect(h.present.text).toBe('36');
    h = undo(h);
    expect(h.present.text).toBe('');
    expect(h.present.calc.text).toBe('36');
    h = undo(h);
    expect(h.present.calc.text).toBe('12×3');
    h = redo(redo(h));
    expect(h.present.text).toBe('36');
  });

  it('clear all leaves the calculator’s entry and its chunks alone', () => {
    const h = steps(calcType('42', 0), type('5', 1000), { type: 'clear' });
    expect(h.present.calc.text).toBe('42');
    expect(back(h).present.calc.text).toBe('');
  });

  it('replace is a step of its own, so undo brings the arithmetic back', () => {
    const h = steps(type('5+3', 0), { type: 'replace', text: '8' });
    expect(h.past).toHaveLength(2);
    expect(undo(h).present.text).toBe('5+3');
    expect(redo(undo(h)).present.text).toBe('8');
  });

  it('using a unit, choosing a category, and taking the unit out are steps of their own', () => {
    const h = steps(
      type('250', 0),
      { type: 'use', unit: 'milliliter', text: '250' },
      { type: 'unlock' },
      { type: 'chooseCategory', category: 'length' },
    );
    expect(h.past).toHaveLength(4);
    const undone = undo(h);
    expect(undone.present).toMatchObject({ unit: null, category: 'volume' });
    const before = undo(undone);
    expect(before.present).toMatchObject({ text: '250', unit: 'milliliter', category: 'volume' });
    // Taking out a unit that is not there changes nothing, so it is no step.
    expect(reduceWithHistory(h, { type: 'unlock' }).past).toHaveLength(4);
    // A category alone, with no unit, is still a step.
    expect(steps({ type: 'chooseCategory', category: 'time' }).past).toHaveLength(1);
  });

  it('keeps at most HISTORY_LIMIT steps, dropping the oldest', () => {
    const actions: HistoryAction[] = [];
    for (let i = 0; i < HISTORY_LIMIT + 10; i += 1) {
      actions.push({ type: 'replace', text: String(i) });
    }
    expect(steps(...actions).past).toHaveLength(HISTORY_LIMIT);
  });

  it('a new action clears the redo stack', () => {
    const h = undo(steps(type('5', 0), { type: 'replace', text: '6' }));
    expect(h.future).toHaveLength(1);
    expect(reduceWithHistory(h, { type: 'replace', text: '7' }).future).toEqual([]);
  });

  it('hydrate starts a fresh history and no-ops add nothing', () => {
    const h = steps(type('5', 0), { type: 'hydrate', state: { text: '2', unit: 'foot' } });
    expect(h.past).toEqual([]);
    expect(h.present.category).toBe('length');
    expect(reduceWithHistory(h, { type: 'replace', text: '2' }).past).toEqual([]);
  });
});

describe('Cooking (ADR 0021)', () => {
  const options = { ...EN, locale: 'en-US', system: 'us' as const };
  const units = (state: ConverterState) => {
    const shown = selectTable(state, options);
    if (shown.kind !== 'units') throw new Error(`expected units, got ${shown.kind}`);
    return shown;
  };
  const flour = (text = '2'): Action => ({
    type: 'use',
    unit: 'us-cup',
    text,
    ingredient: 'all-purpose-flour',
  });

  it('reads "2 cups flour" as one match, the cup and the flour, under Cooking first', () => {
    const typed = selectTable(run(type('2 cups flour')), options);
    if (typed.kind !== 'matches') throw new Error(typed.kind);
    expect(typed.rows[0]).toMatchObject({
      kind: 'ingredient',
      ingredient: { id: 'all-purpose-flour' },
      unit: { id: 'us-cup' },
    });
    // "2 eggs" counts eggs, a large egg each.
    const eggs = selectTable(run(type('2 eggs')), options);
    if (eggs.kind !== 'matches') throw new Error(eggs.kind);
    expect(eggs.rows[0]).toMatchObject({ kind: 'ingredient', unit: { id: 'large-egg' } });
  });

  it('lists Weight, then Volume, the visitor’s own first, the weights measured (≈)', () => {
    const state = run(flour());
    expect(state).toMatchObject({ category: 'cooking', ingredient: 'all-purpose-flour' });
    const table = units(state);
    expect(table.sections.map((section) => section.label)).toEqual(['Weight', 'Volume']);
    expect(table.sections[0]!.rows.map((row) => row.id)).toEqual([
      'ounce',
      'pound',
      'gram',
      'kilogram',
    ]);
    const row = (id: string) => table.rows.find((each) => each.id === id)!;
    expect(row('gram')).toMatchObject({ text: '254', approx: true });
    expect(row('milliliter')).toMatchObject({ approx: false });
    expect(row('us-cup')).toMatchObject({ inBox: true, approx: false });
    expect(table.note).toBe('All-purpose flour: spooned and leveled, 1 cup ≈ 127 g.');
    expect(table.announcement).toBe('2 cups of all-purpose flour in 10 units');
  });

  it('keeps the ingredient for a weight or a volume, and lets it go for anything else', () => {
    const grams = run(flour(), { type: 'use', unit: 'gram', text: '250' });
    expect(grams).toMatchObject({ category: 'cooking', ingredient: 'all-purpose-flour' });
    const meters = run(flour(), { type: 'use', unit: 'meter', text: '2' });
    expect(meters).toMatchObject({ category: 'length', ingredient: null });
    // Another category chosen leaves Cooking; Cooking chosen keeps the cup.
    expect(run(flour(), { type: 'chooseCategory', category: 'volume' })).toMatchObject({
      unit: 'us-cup',
      ingredient: null,
    });
  });

  it('takes a pill out and keeps Cooking: the ingredient to its list, the unit to dashes', () => {
    const list = run(flour(), { type: 'removeIngredient' });
    expect(list).toMatchObject({ category: 'cooking', unit: 'us-cup', ingredient: null });
    expect(selectTable(list, options)).toMatchObject({ kind: 'matches', category: 'cooking' });
    // Both out, one at a time: still Cooking, with nothing in the box.
    expect(reduce(list, { type: 'unlock' })).toMatchObject({ category: 'cooking', unit: null });
    const waiting = run(flour(), { type: 'unlock' });
    expect(waiting).toMatchObject({ category: 'cooking', unit: null });
    expect(units(waiting).rows.every((row) => row.tone === 'empty')).toBe(true);
    // A stick of butter brings butter, and goes with it.
    const stick = run({ type: 'use', unit: 'stick-of-butter', text: '1' });
    expect(stick).toMatchObject({ category: 'cooking', ingredient: 'butter' });
    expect(
      run({ type: 'use', unit: 'stick-of-butter', text: '1' }, { type: 'removeIngredient' }),
    ).toMatchObject({
      unit: null,
      category: 'cooking',
    });
  });

  it('lists every ingredient to choose from when Cooking has none, and a link brings one back', () => {
    const list = selectTable(run({ type: 'chooseCategory', category: 'cooking' }), options);
    expect(list).toMatchObject({ kind: 'matches', category: 'cooking', query: '' });
    if (list.kind !== 'matches') throw new Error(list.kind);
    expect(list.rows.length).toBe(list.counts.cooking);
    const taken = run(
      { type: 'chooseCategory', category: 'cooking' },
      { type: 'useIngredient', ingredient: 'honey', text: '' },
    );
    expect(taken).toMatchObject({ category: 'cooking', ingredient: 'honey' });
    const linked = run({
      type: 'hydrate',
      state: { text: '2', unit: 'us-cup', ingredient: 'all-purpose-flour' },
    });
    expect(linked).toMatchObject({ category: 'cooking', ingredient: 'all-purpose-flour' });
    expect(run({ type: 'hydrate', state: { unit: 'meter', ingredient: 'honey' } })).toMatchObject({
      category: 'length',
      ingredient: null,
    });
  });
});
