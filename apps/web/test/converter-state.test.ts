import { brandChart, brandRowAt, getShoeBrand, getUnit } from '@bigsmall/core';
import { describe, expect, it } from 'vitest';
import {
  brandList,
  HISTORY_LIMIT,
  initialHistory,
  initialState,
  NO_VALUE,
  reduce,
  reduceWithHistory,
  scaleList,
  selectBox,
  selectTable,
  TABLE_PRECISION,
  targetRow,
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
    // Shoe size's "Foot length" holds the letters too (ADR 0028), after the category.
    expect(m.rows[1]).toMatchObject({ kind: 'unit', unit: { id: 'foot-cm' } });
    expect(m.announcement).toBe('2 matches');
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
    expect(table.note).toBe('All-purpose flour: spooned and leveled');
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

describe('compound quantities (ADR 0026)', () => {
  const options = { ...EN, locale: 'en-US', system: 'us' as const };
  const view = (...actions: Action[]) => selectTable(run(...actions), options);
  const units = (...actions: Action[]) => {
    const shown = view(...actions);
    if (shown.kind !== 'units') throw new Error(`expected units, got ${shown.kind}`);
    return shown;
  };
  const matches = (...actions: Action[]) => {
    const shown = view(...actions);
    if (shown.kind !== 'matches') throw new Error(`expected matches, got ${shown.kind}`);
    return shown;
  };

  it('offers a compound’s pair as the match to take, first, with whatever a trailing query matches', () => {
    const height = matches(type("5'11"));
    expect(height.rows.map((row) => row.kind === 'unit' && row.unit.id)).toEqual(['foot-inch']);
    expect(height.counts).toEqual({ length: 1 });
    expect(height.announcement).toBe('1 match');
    // "5'11 cm": the pair, then the centimeter its query names.
    const target = matches(type("5'11 cm"));
    expect(target.rows.slice(0, 2).map((row) => row.kind === 'unit' && row.unit.id)).toEqual([
      'foot-inch',
      'centimeter',
    ]);
    // In the box already, the pair converts: no match to take.
    expect(view(type("5'11"), { type: 'use', unit: 'foot-inch', text: "5'11" }).kind).toBe('units');
    // Another pair typed into a pair's box is offered in its turn.
    expect(
      matches({ type: 'use', unit: 'foot-inch', text: "5'11" }, type('11 st 4')).rows[0],
    ).toMatchObject({ kind: 'unit', unit: { id: 'stone-pound' } });
  });

  it('offers the units written as a clock for a clock typed alone, by its shape and the category it is in', () => {
    const ids = (shown: ReturnType<typeof matches>) =>
      shown.rows.map((row) => (row.kind === 'unit' ? row.unit.id : row.kind));
    // Two parts are minutes and seconds: the paces first, this US visitor's mile first.
    const clock = matches(type('5:55'));
    expect(ids(clock)).toEqual(['minute-per-mile', 'minute-per-kilometer', 'hour-minute-second']);
    expect(clock.counts).toEqual({ time: 1, speed: 2 });
    expect(clock.announcement).toBe('3 units written as a clock');
    // Three parts are hours, minutes, seconds: the time pair first.
    expect(ids(matches(type('1:30:00')))).toEqual([
      'hour-minute-second',
      'minute-per-mile',
      'minute-per-kilometer',
    ]);
    // The category the converter is in leads, as matches always come.
    expect(ids(matches({ type: 'chooseCategory', category: 'time' }, type('5:55')))[0]).toBe(
      'hour-minute-second',
    );
    expect(ids(matches({ type: 'chooseCategory', category: 'speed' }, type('1:30:00')))[0]).toBe(
      'minute-per-mile',
    );
    // A number and a lone foot mark are feet, the pair offered after them in case the inches follow.
    expect(ids(matches(type("5'")))).toEqual(['foot', 'foot-inch']);
    expect(matches(type("5'")).announcement).toBe('2 matches');
    // A unit typed after it is the match, as for any number; in the box, a unit takes the clock.
    expect(matches(type('5:55 min/mi')).rows[0]).toMatchObject({ unit: { id: 'minute-per-mile' } });
    expect(view(type('5:55'), { type: 'use', unit: 'hour-minute-second', text: '5:55' }).kind).toBe(
      'units',
    );
  });

  it('converts a compound from its pair, the pair’s row written in its own marks under Mixed units', () => {
    const t = units({ type: 'use', unit: 'foot-inch', text: "5'11" });
    const row = (id: string) => t.rows.find((each) => each.id === id)!;
    expect(row('foot-inch')).toMatchObject({
      text: '5′ 11″',
      inBox: true,
      pair: { id: 'foot-inch' },
    });
    expect(row('foot-inch').value).toBeCloseTo(5 + 11 / 12, 12);
    expect(row('centimeter').text).toBe('180.34');
    expect(row('inch').text).toBe('71');
    expect(row('foot').pair).toBeUndefined();
    // The pair sits in a section of its own, Mixed units, after the systems and before Specialty,
    // its value its own label (Sean, 2026-10-19); the single units read as before.
    expect(t.sections.map((section) => section.label)).toEqual([
      'US (customary)',
      'Metric',
      'Other',
      'Mixed units',
      'Specialty',
    ]);
    expect(t.sections[0]!.rows.map((each) => each.id).slice(0, 3)).toEqual([
      'inch',
      'foot',
      'yard',
    ]);
    expect(t.sections[3]!.rows.map((each) => each.id)).toEqual(['foot-inch']);
    expect(t.announcement).toBe(`5 ft 11 in in ${t.rows.length} units of length`);
  });

  it('writes a pair row from any unit, the total rounded and split, six digits in the table’s own text', () => {
    const cm = units({ type: 'use', unit: 'centimeter', text: '180' });
    expect(cm.rows.find((row) => row.id === 'foot-inch')?.text).toBe('5′ 10.8661″');
    // A plain number in a pair's box is its first part: 6 in feet and inches is 6 ft.
    const six = units({ type: 'use', unit: 'foot-inch', text: '6' });
    expect(six.rows.find((row) => row.id === 'foot-inch')?.text).toBe('6′ 0″');
    expect(six.rows.find((row) => row.id === 'inch')?.text).toBe('72');
    // 11 st 4 is 158 lb: pounds and ounces in the US section, stone and pounds in the UK's.
    const stone = selectTable(run({ type: 'use', unit: 'stone-pound', text: '11 st 4' }), {
      ...options,
      system: 'imperial',
    });
    if (stone.kind !== 'units') throw new Error(stone.kind);
    expect(stone.rows.find((row) => row.id === 'pound-ounce')?.text).toBe('158 lb 0 oz');
    // A duration as a stopwatch writes it, spoken in its words.
    const time = units({ type: 'use', unit: 'hour-minute-second', text: '1h30' });
    expect(time.rows.find((row) => row.id === 'hour-minute-second')?.text).toBe('1:30:00');
    expect(time.announcement).toBe(`1 h 30 min 0 s in ${time.rows.length} units of time`);
    expect(stone.rows.find((row) => row.id === 'kilogram')?.text).toBe('71.6676');
    expect(stone.sections.map((section) => section.label).slice(0, 2)).toEqual([
      'UK (imperial)',
      'Metric',
    ]);
    expect(
      stone.sections.find((section) => section.key === 'mixed')?.rows.map((each) => each.id),
    ).toEqual(['stone-pound', 'pound-ounce']);
  });

  it('keeps the compound as typed in the box, and the pair as the unit, through use and the URL’s hydrate', () => {
    const s = run(type("5'11"), { type: 'use', unit: 'foot-inch', text: "5'11" });
    expect(s).toMatchObject({ text: "5'11", unit: 'foot-inch', category: 'length' });
    const back = run({ type: 'hydrate', state: { text: '5 ft 11 in', unit: 'foot-inch' } });
    expect(selectBox(back, options).parsed.value).toBeCloseTo(5 + 11 / 12, 12);
  });
});

describe('shoe sizes (ADR 0027)', () => {
  const options = { ...EN, locale: 'en-US', system: 'us' as const };
  const units = (...actions: Action[]) => {
    const shown = selectTable(run(...actions), options);
    if (shown.kind !== 'units') throw new Error(`expected units, got ${shown.kind}`);
    return shown;
  };
  const row = (table: ReturnType<typeof units>, id: string) =>
    table.rows.find((each) => each.id === id)!;

  it('writes every row to its scale’s step, ≈ where that moved it, the box’s own as typed', () => {
    const table = units(type('us 11'), { type: 'use', unit: 'us-men', text: '11' });
    expect(table.category).toBe('shoe-size');
    expect(row(table, 'us-men')).toMatchObject({
      text: '11',
      inBox: true,
      approx: false,
      stepped: false,
    });
    // UK is exactly one size down; the European size rounds, as does the foot in Mondopoint.
    expect(row(table, 'uk')).toMatchObject({ text: '10', value: 10, approx: false, stepped: true });
    expect(row(table, 'us-women')).toMatchObject({ text: '12', approx: false });
    expect(row(table, 'eu')).toMatchObject({ text: '44', value: 44, approx: true, stepped: true });
    expect(row(table, 'mondopoint')).toMatchObject({ text: '280', approx: true });
    expect(row(table, 'japan')).toMatchObject({ text: '28', approx: true });
    // An adult's foot is beyond the children's table: the row says where each scale ends, in
    // place of a size no shoe is marked in (Sean, 2026-10-20; "Out of range" until then), the end
    // its value, for the table to write as a size under the display ("> 13 1/2" with Fraction).
    expect(row(table, 'us-children')).toMatchObject({
      text: '> 13.5',
      tone: 'beyond',
      value: 13.5,
      stepped: true,
      approx: false,
    });
    expect(row(table, 'uk-children')).toMatchObject({ text: '> 13.5', tone: 'beyond' });
    expect(row(table, 'eu-children')).toMatchObject({ text: '> 38', tone: 'beyond' });
    // The brands' rows under the scales, at the same foot (ADR 0028), left out of the count.
    expect(table.sections.map((section) => section.label)).toEqual([
      'US (customary)',
      'Metric',
      'UK (imperial)',
      'Brands, the same foot in US M',
    ]);
    expect(table.sections[0]!.rows.map((each) => each.id)).toEqual([
      'us-men',
      'us-women',
      'us-children',
    ]);
    expect(table.note).toMatch(/^ISO 19407/);
    expect(table.announcement).toBe('11 US men in 10 units of shoe size');
  });

  it('reads a child’s foot from its table, and a size outside a scale has no foot to convert', () => {
    const child = units(type('150 mm'), { type: 'use', unit: 'mondopoint', text: '150' });
    expect(row(child, 'us-children')).toMatchObject({ text: '8', approx: false });
    expect(row(child, 'uk-children')).toMatchObject({ text: '7.5', approx: false });
    expect(row(child, 'eu-children')).toMatchObject({ text: '24.5', approx: false });
    expect(row(child, 'eu')).toMatchObject({ text: '24.5', approx: true });
    const between = units(type('151 mm'), { type: 'use', unit: 'mondopoint', text: '151' });
    expect(row(between, 'us-children')).toMatchObject({ text: '8', approx: true });
    // A small foot is below the scales: where each begins.
    const small = units(type('100 mm'), { type: 'use', unit: 'mondopoint', text: '100' });
    expect(row(small, 'us-children')).toMatchObject({
      text: '< 4',
      tone: 'beyond',
      value: 4,
      detail: 'below its range',
    });
    expect(row(small, 'uk-children')).toMatchObject({ text: '< 3.5', tone: 'beyond' });
    expect(row(small, 'eu-children')).toMatchObject({ text: '< 19.5', tone: 'beyond' });
    // A size outside its own scale: the box's row as typed, the others waiting with dashes, and
    // the live region saying the scale's span.
    const outside = units(type('20'), { type: 'use', unit: 'us-children', text: '20' });
    expect(row(outside, 'us-children')).toMatchObject({ text: '20', inBox: true });
    expect(row(outside, 'us-men')).toMatchObject({ text: NO_VALUE, tone: 'empty', value: null });
    expect(row(outside, 'mondopoint')).toMatchObject({ tone: 'empty' });
    expect(outside.announcement).toBe('US children runs 4 to 13.5');
  });

  it('keeps a query’s target beside the matches, and names the row it rests the cursor on', () => {
    const typed = selectTable(run(type('us 11 to eu')), options);
    expect(typed.kind).toBe('matches');
    if (typed.kind !== 'matches') throw new Error('expected matches');
    expect(typed.target).toBe('eu');
    expect(typed.rows[0]).toMatchObject({ kind: 'unit', unit: { id: 'us-men' } });
    // "11m to eu" offers US men ahead of the meter; "11 us eu" needs no "to".
    const meter = selectTable(run(type('11m')), options);
    if (meter.kind !== 'matches') throw new Error('expected matches');
    expect(meter.rows[0]).toMatchObject({ kind: 'unit', unit: { id: 'meter' } });
    expect(meter.target).toBeUndefined();
    const named = selectTable(run(type('11m to eu')), options);
    if (named.kind !== 'matches') throw new Error('expected matches');
    expect(named.rows[0]).toMatchObject({ kind: 'unit', unit: { id: 'us-men' } });
    const bare = selectTable(run(type('11 us eu')), options);
    if (bare.kind !== 'matches') throw new Error('expected matches');
    expect(bare.rows[0]).toMatchObject({ kind: 'unit', unit: { id: 'us-men' } });
    expect(bare.target).toBe('eu');
    // The row a target names, among the rows the cursor moves through.
    const table = units(type('us 11'), { type: 'use', unit: 'us-men', text: '11' });
    expect(targetRow(table, 'eu')).toBe(table.rows.findIndex((each) => each.id === 'eu'));
    expect(targetRow(table, 'eur')).toBe(targetRow(table, 'eu'));
    expect(targetRow(table, 'e')).toBe(targetRow(table, 'eu'));
    // A shorthand reading listed after the as-typed one carries its own target ("11 w e").
    const we = selectTable(run(type('11 w e')), options);
    if (we.kind !== 'matches') throw new Error('expected matches');
    expect(we.rows[0]).toMatchObject({ kind: 'category' });
    expect(
      we.rows.find((each) => each.kind === 'unit' && each.unit.id === 'us-women'),
    ).toMatchObject({ target: 'e' });
    expect(targetRow(table, 'EU C')).toBe(
      table.rows.findIndex((each) => each.id === 'eu-children'),
    );
    expect(targetRow(table, 'kg')).toBe(-1);
    expect(targetRow(table, '')).toBe(-1);
    // With a unit in the box, a connective and a target typed after the number keep the table,
    // converting, and carry the target; a connective alone carries an empty one.
    const after = units({ type: 'use', unit: 'us-men', text: '11' }, type('11 to eu'));
    expect(after.target).toBe('eu');
    expect(row(after, 'eu')).toMatchObject({ text: '44', tone: 'value' });
    expect(units({ type: 'use', unit: 'us-men', text: '11' }, type('11 to')).target).toBe('');
    expect(units({ type: 'use', unit: 'us-men', text: '11' }, type('11 in')).target).toBe('');
    expect(units({ type: 'use', unit: 'us-men', text: '11' }, type('11')).target).toBeUndefined();
    // A compound's target goes through the same rule: the pair offered first, the target kept.
    const compound = selectTable(run(type("5'11 to cm")), options);
    if (compound.kind !== 'matches') throw new Error('expected matches');
    expect(compound.rows[0]).toMatchObject({ kind: 'unit', unit: { id: 'foot-inch' } });
    expect(compound.target).toBe('cm');
    // Without a unit, a connective alone is a query that matches nothing, its target kept.
    const alone = selectTable(run(type('11 to eu')), options);
    if (alone.kind !== 'matches') throw new Error('expected matches');
    expect(alone.rows).toEqual([]);
    expect(alone.target).toBe('eu');
  });
});

describe('brands (ADR 0028)', () => {
  const options = { ...EN, locale: 'en-US', system: 'us' as const };
  const units = (...actions: Action[]) => {
    const shown = selectTable(run(...actions), options);
    if (shown.kind !== 'units') throw new Error(`expected units, got ${shown.kind}`);
    return shown;
  };
  const matched = (text: string, ...before: Action[]) => {
    const shown = selectTable(run(...before, type(text)), options);
    if (shown.kind !== 'matches') throw new Error(`expected matches, got ${shown.kind}`);
    return shown;
  };
  const row = (table: ReturnType<typeof units>, id: string) =>
    table.rows.find((each) => each.id === id)!;
  const nike = (text = '10', unit = 'us-men'): Action => ({
    type: 'use',
    unit,
    text,
    brand: 'nike',
  });

  it('a shoe scale keeps the brand, another unit leaves it, and the category keeps it', () => {
    const state = run(type('nike 10'), nike());
    expect(state).toMatchObject({
      text: '10',
      unit: 'us-men',
      brand: 'nike',
      category: 'shoe-size',
    });
    expect(reduce(state, { type: 'use', unit: 'eu', text: '44' })).toMatchObject({
      unit: 'eu',
      brand: 'nike',
    });
    expect(reduce(state, { type: 'use', unit: 'eu', text: '44', brand: null })).toMatchObject({
      unit: 'eu',
      brand: null,
    });
    expect(reduce(state, { type: 'use', unit: 'meter', text: '10' })).toMatchObject({
      unit: 'meter',
      brand: null,
      category: 'length',
    });
    expect(reduce(state, { type: 'chooseCategory', category: 'shoe-size' })).toMatchObject({
      brand: 'nike',
      unit: 'us-men',
    });
    expect(reduce(state, { type: 'chooseCategory', category: 'length' })).toMatchObject({
      brand: null,
      unit: null,
    });
    expect(reduce(state, { type: 'removeBrand' })).toMatchObject({
      brand: null,
      unit: 'us-men',
      category: 'shoe-size',
    });
    // A brand alone keeps a shoe scale in the box and drops any other unit; an unknown brand does nothing.
    expect(
      run(
        type('10'),
        { type: 'use', unit: 'uk', text: '9' },
        { type: 'useBrand', brand: 'nike', text: '9' },
      ),
    ).toMatchObject({ brand: 'nike', unit: 'uk', category: 'shoe-size' });
    expect(
      run(
        { type: 'use', unit: 'meter', text: '9' },
        { type: 'useBrand', brand: 'nike', text: '9' },
      ),
    ).toMatchObject({ brand: 'nike', unit: null, category: 'shoe-size' });
    const s = run(type('10'));
    expect(reduce(s, { type: 'useBrand', brand: 'nope', text: '10' })).toBe(s);
    // Hydrated from a URL: a brand needs a shoe scale, or no unit yet.
    expect(
      run({ type: 'hydrate', state: { text: '10', unit: 'us-men', brand: 'nike' } }),
    ).toMatchObject({ brand: 'nike', category: 'shoe-size' });
    expect(
      run({ type: 'hydrate', state: { text: '10', unit: 'meter', brand: 'nike' } }),
    ).toMatchObject({ brand: null, category: 'length' });
    expect(run({ type: 'hydrate', state: { text: '', unit: null, brand: 'nike' } })).toMatchObject({
      brand: 'nike',
      category: 'shoe-size',
    });
    expect(selectBox(run(type('nike 10'), nike()), EN).brand?.id).toBe('nike');
  });

  it('reads a brand typed with the size, at either end, as one match with the scale beside it', () => {
    // A bare size at a brand is US men's, the match Enter takes, with the number the query carried.
    expect(matched('nike 10').rows[0]).toMatchObject({
      kind: 'brand',
      brand: { id: 'nike' },
      unit: { id: 'us-men' },
      text: '10',
    });
    expect(matched('10 nike').rows[0]).toMatchObject({
      kind: 'brand',
      brand: { id: 'nike' },
      unit: { id: 'us-men' },
    });
    expect(matched('nike women 8').rows[0]).toMatchObject({
      kind: 'brand',
      unit: { id: 'us-women' },
      text: '8',
    });
    expect(matched('eu 43 new balance').rows[0]).toMatchObject({
      kind: 'brand',
      brand: { id: 'new-balance' },
      unit: { id: 'eu' },
    });
    expect(matched('27 cm nike').rows[0]).toMatchObject({ kind: 'brand', unit: { id: 'foot-cm' } });
    expect(matched('nike 10 to eu').rows[0]).toMatchObject({
      kind: 'brand',
      unit: { id: 'us-men' },
      text: '10',
      target: 'eu',
    });
    // A brand alone brings no scale; typed with a scale in the box, the scale stays.
    expect(matched('nike').rows[0]).toMatchObject({ kind: 'brand', unit: null });
    expect(matched('9 nike', { type: 'use', unit: 'uk', text: '9' }).rows[0]).toMatchObject({
      kind: 'brand',
      unit: null,
    });
    // Part of a name, under Shoe size; a shorthand key only where the category is named.
    expect(matched('nik').rows[0]).toMatchObject({ kind: 'brand', brand: { id: 'nike' } });
    expect(matched('on 10').rows.some((each) => each.kind === 'brand')).toBe(false);
    expect(
      matched('on 10', { type: 'chooseCategory', category: 'shoe-size' }).rows[0],
    ).toMatchObject({ kind: 'brand', brand: { id: 'on' } });
    expect(matched('nb eu 43').rows[0]).toMatchObject({
      kind: 'brand',
      brand: { id: 'new-balance' },
      unit: { id: 'eu' },
    });
    // Words that name no scale after a brand offer nothing for it.
    expect(matched('nike xyz').rows.some((each) => each.kind === 'brand' && each.unit)).toBe(false);
    // A brand's name begun at either end beside the scale words (Sean, 2026-10-20): every brand
    // the letters begin, each with that scale and the number; nothing where the other words name
    // no scale; the brands lead where no unit matches better.
    const begun = (text: string) =>
      matched(text)
        .rows.flatMap((each) =>
          each.kind === 'brand' && each.unit
            ? [`${each.brand.id}:${each.unit.id}:${each.text ?? ''}`]
            : [],
        )
        .sort();
    expect(begun('11 us n')).toEqual(['new-balance:us-men:11', 'nike:us-men:11']);
    expect(begun('11 m us ni')).toEqual(['nike:us-men:11']);
    expect(begun('nik us 11')).toEqual(['nike:us-men:11']);
    expect(begun('eu 43 new')).toEqual(['new-balance:eu:43']);
    expect(begun('27 cm ni')).toEqual(['nike:foot-cm:27']);
    expect(begun('11 nik')).toEqual(['nike:us-men:11']);
    expect(begun('11 w ni')).toEqual(['nike:us-women:11']);
    expect(begun('11 xyz ni')).toEqual([]);
    expect(matched('nik us 11').rows[0]).toMatchObject({ kind: 'brand', brand: { id: 'nike' } });
  });

  it('with Nike’s 10 in the box, that is the one value in focus: the scales are ISO’s from Nike’s foot, the brands at the same foot', () => {
    const table = units(type('nike 10'), nike());
    // Nike's 10 is a 27.1 cm foot by its chart; ISO's scales read from it, none the box's own.
    expect(row(table, 'us-men')).toMatchObject({ text: '10', approx: true, inBox: false });
    expect(row(table, 'uk')).toMatchObject({ text: '9', approx: true, stepped: true });
    expect(row(table, 'eu')).toMatchObject({ text: '42.5', approx: true });
    expect(row(table, 'us-women')).toMatchObject({ text: '11', approx: true });
    expect(row(table, 'japan')).toMatchObject({ text: '27', approx: true });
    expect(row(table, 'mondopoint')).toMatchObject({ text: '271', value: 271, inBox: false });
    expect(row(table, 'foot-cm')).toMatchObject({ text: '27.1', approx: false });
    expect(row(table, 'us-children')).toMatchObject({ text: '> 13.5', tone: 'beyond' });
    // The brand's row is the one in focus: its section first, the scales after (Sean, 2026-10-21).
    expect(table.sections[0]?.label).toBe('Brands, the same foot in US M');
    expect(table.sections[0]?.repeats).toBe(true);
    expect(table.rows[0]?.id).toBe('brand:adidas');
    // Every brand by name, its size by its chart at that foot; Nike's row the box's, as typed.
    expect(row(table, 'brand:iso')).toBeUndefined();
    expect(row(table, 'brand:adidas')).toMatchObject({
      text: '10',
      approx: false,
      brand: { id: 'adidas', line: 'unisex' },
    });
    expect(row(table, 'brand:new-balance')).toMatchObject({
      text: '9',
      value: 9,
      approx: true,
      symbol: 'US M',
      inBox: false,
    });
    expect(row(table, 'brand:converse')).toMatchObject({ text: '8.5', approx: true });
    expect(row(table, 'brand:nike')).toMatchObject({
      text: '10',
      inBox: true,
      brand: { id: 'nike', line: 'men' },
    });
    expect(row(table, 'brand:puma')).toMatchObject({
      tone: 'empty',
      text: NO_VALUE,
      detail: 'no foot length',
    });
    expect(table.rows.filter((each) => each.inBox).map((each) => each.id)).toEqual(['brand:nike']);
    expect(table.note).toBe('Nike’s size chart, the men’s, nike.com, read Oct 2026.');
    expect(table.announcement).toBe('10 US men at Nike in 10 units of shoe size');
    // A brand's size that differs from ISO's shows the difference: New Balance's 9 is ISO's ≈ 10.
    const nb = units(type('new balance 9'), {
      type: 'use',
      unit: 'us-men',
      text: '9',
      brand: 'new-balance',
    });
    expect(row(nb, 'brand:new-balance')).toMatchObject({ text: '9', inBox: true });
    expect(row(nb, 'us-men')).toMatchObject({ text: '10', approx: true, inBox: false });
    expect(row(nb, 'brand:nike')).toMatchObject({ text: '10', approx: true, inBox: false });
  });

  it('a brand row’s words: the line where the scale does not say it, the dash’s reason naming the scale, nothing else; a row beyond its scale says where the foot stands', () => {
    const table = units(type('nike 10'), nike());
    expect(row(table, 'brand:nike').detail).toBeUndefined();
    expect(row(table, 'brand:new-balance').detail).toBeUndefined();
    expect(row(table, 'brand:adidas').detail).toBeUndefined();
    const eu = units(type('eu 43'), { type: 'use', unit: 'eu', text: '43' });
    expect(row(eu, 'brand:nike')).toMatchObject({ detail: 'men' });
    expect(row(eu, 'brand:adidas').detail).toBeUndefined();
    expect(row(eu, 'brand:reebok')).toMatchObject({ tone: 'empty', detail: 'prints no EU' });
    expect(row(eu, 'brand:brooks')).toMatchObject({
      tone: 'empty',
      detail: 'men · no foot length',
    });
    expect(row(table, 'us-children')).toMatchObject({ text: '> 13.5', detail: 'above its range' });
  });

  it('a range stands as printed in the brand’s own row; a scale the brand prints nothing for is ISO’s like every scale', () => {
    const birks = units(type('birkenstock 9'), {
      type: 'use',
      unit: 'us-men',
      text: '9',
      brand: 'birkenstock',
    });
    expect(row(birks, 'brand:birkenstock')).toMatchObject({
      text: '9–9.5',
      value: 9,
      printed: true,
      stepped: false,
      inBox: true,
    });
    expect(row(birks, 'us-men')).toMatchObject({ text: '10', approx: true, inBox: false });
    expect(row(birks, 'eu')).toMatchObject({ text: '42.5', approx: true });
    expect(birks.note).toContain('Whole EU sizes');
    const reebok = units(type('reebok 10'), {
      type: 'use',
      unit: 'us-men',
      text: '10',
      brand: 'reebok',
    });
    // Reebok's 10 is a 10.7 in foot, 271.8 mm: ISO's EU 42.75, to the half size 42.5.
    expect(row(reebok, 'eu')).toMatchObject({ text: '42.5', approx: true, stepped: true });
    expect(row(reebok, 'us-women')).toMatchObject({ text: '11', approx: true });
    expect(reebok.note).toContain('Prints US sizes and inches alone');
    expect(reebok.note).not.toContain('ISO 19407’s from');
  });

  it('a brand with no foot length has its size read as ISO’s label, said with what it prints; a size off its chart says the span', () => {
    const puma = units(type('puma 10'), { type: 'use', unit: 'us-men', text: '10', brand: 'puma' });
    expect(row(puma, 'brand:puma')).toMatchObject({ text: '10', inBox: true });
    expect(row(puma, 'eu')).toMatchObject({ text: '42.5', approx: true });
    expect(row(puma, 'brand:nike')).toMatchObject({ text: '10', approx: false });
    expect(puma.note).toBe(
      'Puma’s size chart, the men’s, us.puma.com, read Oct 2026. Puma gives no foot length, so its 10 is read as ISO’s US men 10; it prints UK 9, EU 43 for it.',
    );
    const beyond = units(type('nike 25'), nike('25'));
    expect(row(beyond, 'eu')).toMatchObject({ tone: 'empty' });
    expect(row(beyond, 'brand:nike')).toMatchObject({ text: '25', inBox: true });
    expect(row(beyond, 'brand:adidas')).toMatchObject({ tone: 'empty' });
    expect(beyond.note).toContain('Nike’s men’s chart runs US M 3.5 to 22.');
    const kids = units(type('nike 8'), nike('8', 'us-children'));
    expect(kids.note).toContain('Nike’s chart prints no US children.');
  });

  it('a length typed is the value in focus, the brand’s row its size at that foot, ≈', () => {
    const length = units(type('27 cm nike'), nike('27', 'foot-cm'));
    expect(row(length, 'foot-cm')).toMatchObject({ text: '27', inBox: true });
    expect(row(length, 'mondopoint')).toMatchObject({ text: '270', approx: false });
    expect(row(length, 'us-men')).toMatchObject({ text: '10', approx: true });
    expect(row(length, 'brand:asics')).toMatchObject({ text: '9', approx: false });
    expect(row(length, 'brand:nike')).toMatchObject({ text: '10', approx: true, inBox: false });
    expect(length.rows.filter((each) => each.inBox).map((each) => each.id)).toEqual(['foot-cm']);
    const puma = units(type('27 cm puma'), {
      type: 'use',
      unit: 'foot-cm',
      text: '27',
      brand: 'puma',
    });
    expect(row(puma, 'us-men')).toMatchObject({ text: '10', approx: true });
    expect(row(puma, 'brand:puma')).toMatchObject({
      tone: 'empty',
      detail: 'no foot length',
    });
    expect(row(puma, 'brand:nike')).toMatchObject({ text: '10', approx: true });
    expect(puma.note).toContain('has no size for a measured foot');
  });

  it('with no brand, the brands’ rows read every chart at ISO’s foot, the women’s charts for a women’s size', () => {
    const men = units(type('us 9'), { type: 'use', unit: 'us-men', text: '9' });
    expect(row(men, 'brand:iso')).toBeUndefined();
    expect(row(men, 'brand:nike')).toMatchObject({ text: '9', brand: { id: 'nike', line: 'men' } });
    expect(row(men, 'brand:new-balance')).toMatchObject({ text: '8.5', approx: true });
    expect(row(men, 'brand:brooks')).toMatchObject({
      tone: 'empty',
      detail: 'no foot length',
    });
    expect(men.rows.filter((each) => each.inBox).map((each) => each.id)).toEqual(['us-men']);
    const women = units(type('women 8'), { type: 'use', unit: 'us-women', text: '8' });
    expect(row(women, 'brand:nike')).toMatchObject({
      brand: { id: 'nike', line: 'women' },
      symbol: 'US W',
    });
    expect(women.sections.at(-1)?.label).toBe('Brands, the same foot in US W');
    const length = units(type('27 cm'), { type: 'use', unit: 'foot-cm', text: '27' });
    expect(row(length, 'brand:asics')).toMatchObject({ text: '9', approx: false, symbol: 'US M' });
    // A child's foot is off every adult chart.
    const kid = units(type('150 mm'), { type: 'use', unit: 'mondopoint', text: '150' });
    expect(row(kid, 'brand:nike')).toMatchObject({
      tone: 'empty',
      detail: 'off its chart',
    });
    // Nothing typed yet: dashes, the brands' too.
    const waiting = units({ type: 'chooseCategory', category: 'shoe-size' });
    expect(row(waiting, 'brand:nike')).toMatchObject({ tone: 'empty' });
    expect(waiting.note).toMatch(/^ISO 19407/);
  });

  it('keeps the women’s charts on a genderless scale while the line is women’s: set by a US women’s size, kept on EU, cleared by a US men’s size or another category', () => {
    const w = run({ type: 'use', unit: 'us-women', text: '8', brand: 'nike' });
    expect(w.line).toBe('women');
    const eu = reduce(w, { type: 'use', unit: 'eu', text: '39', brand: 'nike' });
    expect(eu).toMatchObject({ line: 'women', brand: 'nike', unit: 'eu' });
    const table = selectTable(eu, options);
    if (table.kind !== 'units') throw new Error('units');
    expect(row(table, 'brand:nike')).toMatchObject({
      text: '39',
      inBox: true,
      brand: { id: 'nike', line: 'women' },
      detail: 'women',
    });
    expect(row(table, 'foot-cm')).toMatchObject({ text: '24.5' });
    expect(table.sections[0]?.label).toBe('Brands, the same foot in EU');
    expect(table.note).toContain('the women’s');
    expect(reduce(eu, { type: 'use', unit: 'us-men', text: '7', brand: 'nike' }).line).toBeNull();
    expect(reduce(eu, { type: 'use', unit: 'meter', text: '1' })).toMatchObject({
      line: null,
      brand: null,
    });
    expect(
      reduce(eu, { type: 'use', unit: 'uk', text: '5.5', brand: 'nike', line: null }).line,
    ).toBe(null);
    expect(reduce(eu, { type: 'removeBrand' }).line).toBe('women');
    expect(reduce(eu, { type: 'chooseCategory', category: 'length' }).line).toBeNull();
    expect(
      run({ type: 'hydrate', state: { text: '39', unit: 'eu', brand: 'nike', line: 'women' } })
        .line,
    ).toBe('women');
    expect(
      run({ type: 'hydrate', state: { text: '7', unit: 'us-men', brand: 'nike', line: 'women' } })
        .line,
    ).toBeNull();
    expect(selectBox(eu, EN).line).toBe('women');
  });

  it('lists the brand’s scales to choose from (the chip’s list): every scale its chart prints with the row’s size, the foot’s units where it gives the foot, the one in the box marked, the line carried', () => {
    const table = units(type('nike 10'), nike());
    const nikeRow = brandRowAt(brandChart(getShoeBrand('nike')!, false), 'us-men', 10, false)!;
    const list = scaleList(table, getShoeBrand('nike')!, getUnit('us-men')!, 10, null, 'en-US');
    const cells = Object.fromEntries(
      list.rows.map((each) => (each.kind === 'brand' ? [each.unit?.id, each.text] : ['', ''])),
    );
    expect(cells).toEqual({
      'us-men': '10',
      'us-women': String(nikeRow.usWomen),
      uk: String(nikeRow.uk),
      eu: String(nikeRow.eu),
      japan: String(nikeRow.jp),
      mondopoint: String(nikeRow.foot),
      'foot-cm': String(nikeRow.foot! / 10),
    });
    expect(list.rows.filter((each) => each.kind === 'brand' && each.inBox)).toHaveLength(1);
    expect(list.rows[0]).toMatchObject({
      kind: 'brand',
      group: 'Nike’s chart, the men’s',
      line: null,
    });
    expect(list.announcement).toBe('7 scales of Nike’s chart to choose from');
    // Reebok prints US sizes and inches: the two US scales and the foot's units, no EU or UK.
    const reebok = units(type('reebok 10'), {
      type: 'use',
      unit: 'us-men',
      text: '10',
      brand: 'reebok',
    });
    const reebokList = scaleList(
      reebok,
      getShoeBrand('reebok')!,
      getUnit('us-men')!,
      10,
      null,
      'en-US',
    );
    expect(
      reebokList.rows.map((each) => (each.kind === 'brand' ? each.unit?.id : '')).sort(),
    ).toEqual(['foot-cm', 'mondopoint', 'us-men', 'us-women']);
    // Puma gives no foot: its scales alone. A women's reading carries its line.
    const puma = units(type('puma 10'), { type: 'use', unit: 'us-men', text: '10', brand: 'puma' });
    const pumaList = scaleList(puma, getShoeBrand('puma')!, getUnit('us-men')!, 10, null, 'en-US');
    expect(pumaList.rows.some((each) => each.kind === 'brand' && each.unit?.id === 'foot-cm')).toBe(
      false,
    );
    const women = units(type('women 8'), {
      type: 'use',
      unit: 'us-women',
      text: '8',
      brand: 'nike',
    });
    const womenList = scaleList(
      women,
      getShoeBrand('nike')!,
      getUnit('us-women')!,
      8,
      'women',
      'en-US',
    );
    expect(womenList.rows[0]).toMatchObject({ line: 'women', group: 'Nike’s chart, the women’s' });
    expect(
      womenList.rows.find((each) => each.kind === 'brand' && each.unit?.id === 'eu'),
    ).toMatchObject({ text: '39' });
  });

  it('waits for the charts (ADR 0029): loading or failed, the brands’ rows are dashes, a brand in the box leaves every row a dash, and the line says so', () => {
    const loading = selectTable(run(type('nike 10'), nike()), { ...options, charts: 'loading' });
    if (loading.kind !== 'units') throw new Error('units');
    expect(row(loading, 'eu')).toMatchObject({ tone: 'empty' });
    expect(row(loading, 'brand:nike')).toMatchObject({ tone: 'empty', inBox: false });
    expect(loading.notice).toBe('Nike’s chart loading…');
    expect(loading.note).toBeNull();
    const failed = selectTable(run(type('nike 10'), nike()), { ...options, charts: 'failed' });
    if (failed.kind !== 'units') throw new Error('units');
    expect(row(failed, 'eu')).toMatchObject({ tone: 'empty' });
    expect(failed.notice).toBe('Brand charts not loaded. Reload to try again.');
    // Without a brand the scales convert as ever; the brands' rows wait.
    const iso = selectTable(run(type('us 10'), { type: 'use', unit: 'us-men', text: '10' }), {
      ...options,
      charts: 'loading',
    });
    if (iso.kind !== 'units') throw new Error('units');
    expect(row(iso, 'eu')).toMatchObject({ tone: 'value' });
    expect(row(iso, 'brand:nike')).toMatchObject({ tone: 'empty' });
    expect(iso.note).toMatch(/^ISO 19407/);
    expect(iso.notice).toBeUndefined();
    expect(iso.sections.at(-1)?.label).toBe('Brand charts loading…');
    const isoFailed = selectTable(run(type('us 10'), { type: 'use', unit: 'us-men', text: '10' }), {
      ...options,
      charts: 'failed',
    });
    if (isoFailed.kind !== 'units') throw new Error('units');
    expect(isoFailed.sections.at(-1)?.label).toBe('Brand charts not loaded');
    expect(isoFailed.notice).toBeUndefined();
    // Given to core, as the tests' setup does, ready needs no word.
    expect(row(units(type('nike 10'), nike()), 'brand:nike')).toMatchObject({ text: '10' });
  });

  it('lists the brand’s scales to choose from while it has no scale (the chip emptied, a brand alone): the heading asks, and the number as typed goes with the scale', () => {
    const table = units(type('nike 10'), nike());
    const list = scaleList(table, getShoeBrand('nike')!, null, 11, null, 'en-US', true);
    expect(list.rows[0]).toMatchObject({
      kind: 'brand',
      group: 'Nike’s chart, the men’s: choose the scale to read it on',
    });
    expect(list.rows.every((each) => each.kind === 'brand' && each.text === undefined)).toBe(true);
    expect(list.rows.some((each) => each.kind === 'brand' && each.unit?.id === 'eu')).toBe(true);
  });

  it('lists every brand to choose from, the one in the box marked (the pill’s list)', () => {
    const table = units(type('nike 10'), nike());
    const list = brandList(table, selectBox(run(type('nike 10'), nike()), EN).brand);
    expect(list.rows).toHaveLength(20);
    expect(list.rows.filter((each) => each.kind === 'brand' && each.inBox)).toHaveLength(1);
    expect(list.rows[0]).toMatchObject({ kind: 'brand', group: 'Brands' });
    expect(list.announcement).toBe('20 brands to choose from');
  });
});
