import { categories, unitsIn } from '@bigsmall/core';
import { expect, test, type Page } from '@playwright/test';
import { THEMES } from '../src/lib/themes';
import { ANNOUNCE_MS, TYPING_CHUNK_MS } from '../src/lib/timing';
import {
  applyTheme,
  blur,
  box,
  calculatorButton,
  calculatorPanel,
  expectNoA11yViolations,
  hiddenToggle,
  MARGIN_MS,
  menu,
  ready,
  row,
  setSettings,
  settingsButton,
  shortcutsButton,
  showEverything,
  unitCell,
} from './support';

// The converter (ADR 0012, ADR 0013, docs/UX-SPEC.md §1, §5, §7–§9, §11): one box, a category menu
// over it, and in the table's place the categories to start from, the category's units with their
// values, or the units a typed query matches. The caret stays in the field while a cursor moves
// through the table. The calculator's own flows are in calculator.spec.ts. Visitors are in the
// US: their own units come first (ADR 0011).

const tiles = (page: Page) => page.getByRole('listbox', { name: 'Categories' });
const matches = (page: Page) => page.getByRole('listbox', { name: 'Matching units' });
const VOLUME_UNITS = unitsIn('volume').length;
/** What a fresh visit lists: every unit but the specialist ones, the Standard preset (ADR 0018). */
const VOLUME_STANDARD = unitsIn('volume').filter((unit) => unit.tier === 'basic').length;

/** What the field's cursor is on, as it reads, or null while it rests. */
async function cursor(page: Page): Promise<string | null> {
  return box(page).evaluate((input) => {
    const id = input.getAttribute('aria-activedescendant');
    const element = id ? document.getElementById(id) : null;
    return element ? (element.textContent ?? '').replace(/\s+/g, ' ').trim() : null;
  });
}

/** Waits until the cursor is on something whose text contains `text`, or rests (null). */
async function expectCursor(page: Page, text: string | null) {
  if (text === null) await expect.poll(() => cursor(page)).toBeNull();
  else await expect.poll(() => cursor(page)).toContain(text);
}

test('the start lists the categories; a number alone keeps them; Enter goes into them', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  // One box, and no layout to switch to.
  await expect(page.getByRole('combobox')).toHaveCount(1);
  await expect(menu(page)).toHaveText(/^Category$/);
  await expect(box(page)).toHaveAttribute('placeholder', 'Number or unit');
  await expect(tiles(page).getByRole('option')).toHaveCount(categories.length);

  // A number, a half-typed one, or a sum keeps the categories in view.
  for (const text of ['250', '-', '1e', '6*3']) {
    await box(page).fill(text);
    await expect(tiles(page), text).toBeVisible();
  }
  await box(page).fill('250');
  // A click on a tile lists its units, none chosen and none highlighted: a dash for each value
  // until one is picked.
  await tiles(page).getByRole('option', { name: 'Volume' }).click();
  await expect(box(page)).toBeFocused();
  await expect(menu(page)).toHaveText(/Category\s*Volume/);
  await expect(page.locator('[data-row]')).toHaveCount(VOLUME_STANDARD);
  await expect(page.locator('[role="row"][aria-selected="true"]')).toHaveCount(0);
  await expect(row(page, 'us-cup')).toContainText('—');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(box(page)).toHaveValue('250');

  // Picking a unit then means that number in it: 250 cups, not 250 teaspoons converted.
  await unitCell(page, 'us-cup').click();
  await expect(box(page)).toHaveValue('250');
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(row(page, 'us-pint')).toContainText('125');
  await expect(box(page)).toHaveAttribute('placeholder', 'Number');
});

test('keyboard: the start’s categories are a grid the arrows move through', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await ready(page);
  await box(page).click();
  // Four across in a wide table: down into the grid, across, down a row, and back up.
  await box(page).press('ArrowDown');
  await expectCursor(page, 'Length');
  await box(page).press('ArrowRight');
  await box(page).press('ArrowRight');
  await expectCursor(page, 'Volume');
  await box(page).press('ArrowDown');
  await expectCursor(page, 'Time');
  await box(page).press('ArrowUp');
  await box(page).press('ArrowUp');
  await expectCursor(page, null);
  await expect(box(page)).toBeFocused();

  // A number, then Enter, goes into the categories; Enter opens one.
  await page.keyboard.type('250');
  await box(page).press('Enter');
  await expectCursor(page, 'Length');
  await box(page).press('ArrowRight');
  await box(page).press('ArrowRight');
  await box(page).press('Enter');
  // Nothing is highlighted for you: the caret waits in the field until ↓ moves into the units.
  await expectCursor(page, null);
  await expect(page.locator('[data-row]')).toHaveCount(VOLUME_STANDARD);
  await box(page).press('ArrowDown');
  await expectCursor(page, 'teaspoons');
  // Tablespoons, fluid ounces, then cups.
  for (let step = 0; step < 3; step += 1) await box(page).press('ArrowDown');
  await expectCursor(page, 'cups');
  await box(page).press('Enter');
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(box(page)).toHaveValue('250');
});

test('a number and a unit list the category’s standard units in their sections, the box’s own marked', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await box(page).fill('250 ml');
  await box(page).press('Enter');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await expect(box(page)).toBeFocused();

  const table = page.getByRole('region', { name: 'Volume' });
  await expect(table).toBeVisible();
  // A fresh visit lists every unit but the specialist ones, the visitor's own system first, each
  // section headed; the rest wait in Hidden at the foot (ADR 0018).
  await expect(table.locator('[data-row]')).toHaveCount(VOLUME_STANDARD);
  await expect(table.getByRole('columnheader')).toHaveText([
    'US (customary)',
    'Metric',
    'UK (imperial)',
  ]);
  await expect(table.getByRole('button', { name: /^Hidden/ })).toContainText(
    String(VOLUME_UNITS - VOLUME_STANDARD),
  );
  await expect(row(page, 'liter')).toContainText('0.25');
  // Two places, as a fresh visit writes values.
  await expect(row(page, 'us-cup')).toContainText('1.06');
  await expect(unitCell(page, 'milliliter')).toContainText('in the box');
});

test('a typed unit lists matches from every category, grouped, without values', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  // "o" starts no category's name ("p" would start Pressure's, whose row would lead).
  await box(page).fill('250 o');
  await expect(matches(page)).toBeVisible();
  await expect(page.locator('[data-row]')).toHaveCount(0);
  const groups = matches(page).getByRole('group');
  await expect(groups.first()).toHaveAccessibleName('Weight');
  await expect(matches(page).getByRole('group', { name: 'Volume' })).toBeVisible();
  // No values among the matches: symbols and names only.
  await expect(matches(page).getByRole('option').first()).not.toContainText(/\d/);
  // The menu says how many each category has.
  await menu(page).click();
  await expect(page.locator('label', { hasText: 'Volume' })).toContainText(/\d+ match/);
  await expect(page.locator('label', { hasText: 'Temperature' })).not.toContainText('match');
  await page.keyboard.press('Escape');

  // Enter takes the best match, with the number as typed.
  await box(page).press('Enter');
  await expect(page.getByRole('button', { name: 'Remove ounces' })).toBeVisible();
  await expect(box(page)).toHaveValue('250');
  await expect(page.getByRole('region', { name: 'Weight' })).toBeVisible();

  // Inside a category, its own matches come first; a click takes any match.
  await box(page).press('End');
  await page.keyboard.type(' o');
  await expect(groups.first()).toHaveAccessibleName('Weight');
  await matches(page)
    .getByRole('option', { name: /^fl oz fluid ounces/ })
    .click();
  await expect(page.getByRole('button', { name: 'Remove fluid ounces' })).toBeVisible();
  await expect(box(page)).toHaveValue('250');
  await expect(page.getByRole('region', { name: 'Volume' })).toBeVisible();
});

test('the category menu keeps its width open, its counts fitting beside the names, in every theme', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await box(page).fill('250 p');
  const shell = page.locator('[data-tool="category"]').locator('xpath=..');
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    const closed = (await shell.boundingBox())!.width;
    await menu(page).click();
    expect((await shell.boundingBox())!.width, theme.id).toBe(closed);
    const overflowing = await shell
      .locator('label')
      .evaluateAll((labels) =>
        labels
          .filter((label) => label.scrollWidth > label.clientWidth)
          .map((label) => label.textContent),
      );
    expect(overflowing, theme.id).toEqual([]);
    // A bare number on screen; screen readers hear "2 matches".
    await expect(page.getByRole('radio', { name: /^Volume \d+ matches$/ })).toBeAttached();
    await page.keyboard.press('Escape');
  }
});

test('a typed category name opens the category with no unit chosen, and the menu keeps naming it', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await box(page).fill('5 len');
  await expect(matches(page).getByRole('option').first()).toContainText('Length');
  await expect(matches(page).getByRole('option').first()).toContainText('all its units');
  await box(page).press('Enter');
  await expect(box(page)).toHaveValue('5');
  await expect(menu(page)).toHaveText(/Category\s*Length/);
  await expect(row(page, 'inch')).toContainText('—');

  // Typing a unit then lists the matches, and the menu still names the category, its choice
  // checked.
  await box(page).press('End');
  await page.keyboard.type(' f');
  await expect(matches(page)).toBeVisible();
  await expect(menu(page)).toHaveText(/Category\s*Length/);
  await menu(page).click();
  await expect(page.getByRole('radio', { name: /^Length/ })).toBeChecked();
});

test('the category menu: the arrows move without choosing, Enter chooses, Escape closes', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  await menu(page).click();
  const radios = page.getByRole('group', { name: 'Category' }).getByRole('radio');
  await expect(radios).toHaveCount(categories.length);
  await expect(page.getByRole('radio', { name: 'Volume' })).toBeFocused();
  // Open, the trigger heads the list with the word "Category"; the list's fill marks the choice.
  await expect(menu(page)).toHaveText('Category');
  // Moving through the choices changes nothing until one is chosen.
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: 'Temperature' })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu(page)).toBeFocused();
  await expect(menu(page)).toHaveText(/Volume/);
  await expect(radios).toBeHidden();

  // Enter chooses: the number stays and the unit goes.
  await menu(page).press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(menu(page)).toHaveText(/Temperature/);
  await expect(box(page)).toBeFocused();
  await expect(box(page)).toHaveValue('250');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  // No unit is highlighted for you; Enter goes into the units, and Enter again takes one.
  await expectCursor(page, null);
  await box(page).press('Enter');
  await expectCursor(page, 'Fahrenheit');
  await box(page).press('Enter');
  await expect(page.getByRole('button', { name: 'Remove Fahrenheit' })).toBeVisible();

  // Choosing the category the box is in keeps its unit.
  await menu(page).click();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove Fahrenheit' })).toBeVisible();

  // ← and → close it unchanged and move along the toolbar, as from its button (Sean, 2026-10-15).
  await menu(page).click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await expect(radios).toBeHidden();
  await expect(calculatorButton(page)).toBeFocused();
  await expect(menu(page)).toHaveText(/Temperature/);
});

test('keyboard: the arrows go through every row from the unit in the box, onto the foot, the page’s bottom', async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?a=us-cup&v=250');
  await ready(page);
  await box(page).click();
  // Resting on cups, the arrows go on from its row.
  await box(page).press('ArrowDown');
  await expectCursor(page, 'pints');
  await box(page).press('ArrowUp');
  await box(page).press('ArrowUp');
  await expectCursor(page, 'fluid ounces');
  // Ctrl+C copies the row the cursor is on, as the row shows it (Sean, 2026-10-15).
  await box(page).press('Control+c');
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('2,000.00');

  // Down across the sections, past their headings, to the last row, the UK's gallon (fluid ounces
  // are the third); Enter takes it, its value to the box's 10 digits, and the cursor rests on it.
  for (let step = 3; step < VOLUME_STANDARD; step += 1) await box(page).press('ArrowDown');
  await expectCursor(page, 'imperial gallons');
  await box(page).press('Enter');
  await expect(box(page)).toHaveValue(/^13\.010534/);
  await expect(page.getByRole('button', { name: 'Remove imperial gallons' })).toBeVisible();
  await expectCursor(page, null);

  // Past the last row, the table's foot, Hidden, the cursor resting; it is the page's bottom, so
  // down again does nothing (ADR 0014; Sean, 2026-10-15: going round to the header jarred), and
  // up goes back to the last row.
  await box(page).press('ArrowDown');
  const hidden = hiddenToggle(page);
  await expect(hidden).toBeFocused();
  await expectCursor(page, null);
  await page.keyboard.press('ArrowDown');
  await expect(hidden).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(box(page)).toBeFocused();
  await expectCursor(page, 'imperial gallons');
});

test('Escape steps back: off the table, the typed unit, the number, the unit and category, the page', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  await box(page).click();
  await box(page).press('ArrowDown');
  await expect.poll(() => cursor(page)).not.toBeNull();
  await box(page).press('Escape');
  await expectCursor(page, null);
  await expect(box(page)).toHaveValue('250');

  await box(page).press('End');
  await page.keyboard.type(' cu');
  await expect(matches(page)).toBeVisible();
  await box(page).press('Escape');
  await expect(box(page)).toHaveValue('250');
  await expect(page.locator('[data-row]')).toHaveCount(VOLUME_STANDARD);

  await box(page).press('Escape');
  await expect(box(page)).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();

  await box(page).press('Escape');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(menu(page)).toHaveText(/^Category$/);
  await expect(tiles(page)).toBeVisible();

  await box(page).press('Escape');
  await expect(box(page)).not.toBeFocused();

  // Each step can be undone.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
});

test('with nothing focused, Escape clears the box a step at a time, as in the box', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Escape needs a keyboard');
  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  await box(page).click();
  await box(page).press('End');
  await page.keyboard.type(' cu');
  await expect(matches(page)).toBeVisible();
  // Focus leaves the converter for the page.
  await blur(page);

  await page.keyboard.press('Escape');
  await expect(box(page)).toHaveValue('250');
  await page.keyboard.press('Escape');
  await expect(box(page)).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(tiles(page)).toBeVisible();
  // It clears without taking focus, and the steps can be undone.
  await expect(box(page)).not.toBeFocused();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
});

test('the cursor shows only while focus is in the box or its table', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  await box(page).click();
  await box(page).press('ArrowDown');
  await expect(page.locator('[role="row"][aria-selected="true"]')).toHaveCount(1);
  await calculatorButton(page).click();
  await expect(page.locator('[role="row"][aria-selected="true"]')).toHaveCount(0);
});

test('an Escape that closes the shortcuts map does nothing else', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the shortcuts map is hidden on touch-first devices');
  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  const toggle = shortcutsButton(page);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(box(page)).toHaveValue('250');
});

test('typing anywhere lands in the field, after what is there', async ({ page, isMobile }) => {
  test.skip(isMobile, 'typing from anywhere needs a keyboard');
  await page.goto('/?a=milliliter&v=554');
  await ready(page);
  await menu(page).focus();
  await page.keyboard.type('6');
  await expect(box(page)).toBeFocused();
  await expect(box(page)).toHaveValue('5546');

  await page.getByRole('button', { name: 'Edit', exact: true }).focus();
  await page.keyboard.type('7');
  await expect(box(page)).toHaveValue('55467');

  // With nothing focused on the page, too. From the chip, Backspace takes the last character back.
  await blur(page);
  await page.keyboard.type('8');
  await expect(box(page)).toBeFocused();
  await expect(box(page)).toHaveValue('554678');
  await page.getByRole('button', { name: 'Remove milliliters' }).focus();
  await page.keyboard.press('Backspace');
  await expect(box(page)).toHaveValue('55467');
});

test('× takes the unit out and keeps the category; so does Backspace on an empty field', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  await page.getByRole('button', { name: 'Remove milliliters' }).click();
  await expect(box(page)).toBeFocused();
  await expect(box(page)).toHaveValue('250');
  await expect(menu(page)).toHaveText(/Volume/);
  await expect(page.locator('[data-row]')).toHaveCount(VOLUME_STANDARD);
  await expect(row(page, 'liter')).toContainText('—');

  await page.goto('/?a=milliliter');
  await ready(page);
  await box(page).click();
  await box(page).press('Backspace');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(page.locator('[data-row]')).toHaveCount(VOLUME_STANDARD);
});

test('a row reads the value on the left, on the decimal point, then symbol and name on the right, each in its column', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  // Where each row's text actually ends or starts, not its cell, which the column sizes alike.
  const columns = () =>
    page.locator('[data-row] > [role="gridcell"]:first-child').evaluateAll((units) => {
      const text = (element: Element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getBoundingClientRect();
      };
      // The value's first cell holds its whole part: where it ends, the decimal point starts.
      return units.map((unit) => ({
        point: text(unit.firstElementChild!).right,
        symbolRight: text(unit.querySelector('[data-symbol]')!).right,
        nameLeft: text(unit.querySelector('[data-name]')!).left,
      }));
    });
  const lineUp = async () => {
    const cells = await columns();
    const same = (pick: (cell: (typeof cells)[number]) => number) =>
      new Set(cells.map((cell) => Math.round(pick(cell)))).size;
    expect(same((cell) => cell.point)).toBe(1);
    expect(same((cell) => cell.symbolRight)).toBe(1);
    expect(same((cell) => cell.nameLeft)).toBe(1);
    return cells;
  };

  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  await setSettings(page, 'Symbol and name');
  await expect(unitCell(page, 'liter')).toHaveAccessibleName(/^0\.25 L liters/);
  const cells = await lineUp();
  // The names sit on the right: past the middle of the row on a wide table.
  const card = (await page.getByRole('region', { name: 'Volume' }).boundingBox())!;
  expect(cells[0]!.nameLeft).toBeGreaterThan(card.x + card.width / 2);
  // With no limit the values have every count of decimals, and their points still line up; the
  // two columns they are drawn in are heard as one value.
  await setSettings(page, 'No limit');
  await lineUp();
  await expect(unitCell(page, 'us-cup')).toHaveAccessibleName(/^1\.05669 cup cups/);
  // In every theme, whose number faces differ (monospace, serif), the columns still line up.
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    await lineUp();
  }

  // Symbols line up on their last letter, an exponent hanging after it: "ha" ends where the "m"
  // of "m²" does. Screen readers hear the symbol whole.
  await page.goto('/?a=square-kilometer&v=1');
  await ready(page);
  await setSettings(page, 'Symbol and name');
  await lineUp();
  // No limit, set above and remembered across the page change, writes it whole.
  await expect(unitCell(page, 'square-kilometer')).toHaveAccessibleName(/^1 km² square kilometer/);
});

test('where a name would not fit on one line, the names give way in every row, and come back with the room', async ({
  page,
}) => {
  // Each name as drawn: shown and whole, or hidden in every row, never clipped. The rule, not a
  // width, is checked, since each theme's fonts move where it switches.
  // The rows' names, not the sizer's, which measures their column unseen.
  const names = () =>
    page.locator('[data-row] [data-column="name"]').evaluateAll((cells) => {
      const shown = cells.filter((cell) => !(cell as HTMLElement).hidden);
      return {
        rows: cells.length,
        shown: shown.length,
        clipped: shown.filter((cell) => cell.scrollWidth > cell.clientWidth).length,
      };
    });
  const rows = unitsIn('speed').length;
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/?a=kilometer-per-hour&v=100');
  await ready(page);
  await showEverything(page);
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    expect(await names(), theme.id).toEqual({ rows, shown: rows, clipped: 0 });
  }

  // At 320 px "kilometers per hour" has no room beside its value: the names give way, the symbols
  // standing alone, and screen readers still hear each row's name.
  await page.setViewportSize({ width: 320, height: 800 });
  await applyTheme(page, THEMES[0]!);
  await expect.poll(names).toEqual({ rows, shown: 0, clipped: 0 });
  await expect(unitCell(page, 'mile-per-hour')).toHaveAccessibleName(
    /^62\.1371 mph miles per hour/,
  );
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    const narrow = await names();
    expect([0, narrow.rows], theme.id).toContain(narrow.shown);
    expect(narrow.clipped, theme.id).toBe(0);
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(names).toEqual({ rows, shown: rows, clipped: 0 });
});

test('a row moves into the box with its value; undo takes it back', async ({ page }) => {
  await page.goto('/?a=milliliter&v=250');
  await ready(page);

  await unitCell(page, 'liter').click();
  await expect(box(page)).toHaveValue('0.25');
  await expect(page.getByRole('button', { name: 'Remove liters' })).toBeVisible();
  await expect(unitCell(page, 'liter')).toContainText('in the box');
  await expect(row(page, 'milliliter')).toContainText('250');
  await expect(row(page, 'us-cup')).toContainText('1.06');
  await expect(page).toHaveURL(/\?a=liter&v=0\.25$/);

  await page.keyboard.press('Control+z');
  await expect(box(page)).toHaveValue('250');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
});

test('a link from two boxes opens on the box that held the number', async ({ page }) => {
  await page.goto('/?a=milliliter&b=us-cup&v=250&s=a');
  await ready(page);
  await expect(box(page)).toHaveValue('250');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  // The link is rewritten in today's form, the second box's unit gone.
  await expect(page).toHaveURL(/\?a=milliliter&v=250$/);

  await page.goto('/?a=milliliter&b=us-cup&v=2&s=b');
  await ready(page);
  await expect(box(page)).toHaveValue('2');
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(row(page, 'us-pint')).toContainText('1');
});

test('a value with no answer says so once; a row too large for a double, or undefined for 0, says so', async ({
  page,
}) => {
  await page.goto('/?a=kilometer&v=1');
  await ready(page);
  await box(page).fill('1e400');
  await expect(page.getByRole('region', { name: 'Length' })).toContainText('Too large to convert');
  await expect(page.locator('[data-row]')).toHaveCount(0);

  await box(page).fill('1e306');
  const millimeters = row(page, 'millimeter');
  await expect(millimeters).toContainText('Too large');
  await expect(millimeters.getByRole('button', { name: /^Copy/ })).toHaveCount(0);
  await expect(row(page, 'kilometer')).toContainText('1E306');

  // 0 in a reciprocal unit leaves the units it divides into without a value.
  await page.goto('/?a=mile-per-us-gallon&v=0');
  await ready(page);
  await expect(row(page, 'liter-per-100-kilometers')).toContainText('Undefined for 0');
  await expect(row(page, 'kilometer-per-liter')).toContainText('0');
});

test('the live region says how many units the value is shown in', async ({ page }) => {
  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  await expect(page.locator('[aria-live="polite"]')).toHaveText(
    `250 milliliters in ${VOLUME_STANDARD} units of volume`,
    { timeout: ANNOUNCE_MS + MARGIN_MS * 5 },
  );
});

test('a side panel takes a column from md, its top level with the box, and sits between the box and the table below it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  // Three units, so the calculator is far taller than the box and the table together.
  await page.goto('/?a=celsius&v=20');
  await ready(page);
  const table = page.getByRole('region', { name: 'Temperature' });
  const calculator = calculatorPanel(page);
  const field = page.locator('[data-plane="box"]');
  const gapUnderBox = async () => {
    const edge = (await field.boundingBox())!;
    return Math.round((await table.boundingBox())!.y - (edge.y + edge.height));
  };
  // The table sits 8 px under the box, its popup, as the toolbar sits 8 px over it.
  const closed = await gapUnderBox();
  expect(closed).toBe(8);

  await calculatorButton(page).click();
  const wide = {
    calculator: (await calculator.boundingBox())!,
    table: (await table.boundingBox())!,
    field: (await field.boundingBox())!,
    converter: (await page.getByRole('region', { name: 'Unit converter' }).boundingBox())!,
  };
  expect(wide.calculator.x).toBeGreaterThan(wide.table.x + wide.table.width);
  // Its top level with the box's (Sean, 2026-10-15), and so is a settings panel's.
  expect(Math.abs(wide.calculator.y - wide.field.y)).toBeLessThan(1);
  for (const name of ['Units', 'Display'] as const) {
    await settingsButton(page, name).click();
    const panel = (await page.getByRole('group', { name, exact: true }).boundingBox())!;
    expect(Math.abs(panel.y - wide.field.y), name).toBeLessThan(1);
    expect(await gapUnderBox(), name).toBe(closed);
  }
  await calculatorButton(page).click();
  // Flush right with the page, and the table still right under the box.
  expect(
    Math.abs(wide.calculator.x + wide.calculator.width - (wide.converter.x + wide.converter.width)),
  ).toBeLessThan(1);
  expect(await gapUnderBox()).toBe(closed);

  await page.setViewportSize({ width: 375, height: 900 });
  const narrow = {
    calculator: (await calculator.boundingBox())!,
    table: (await table.boundingBox())!,
    menu: (await menu(page).boundingBox())!,
  };
  // Between the box and the table, 16 px from each: a panel apart.
  const boxEdge = (await field.boundingBox())!;
  expect(Math.round(narrow.calculator.y - (boxEdge.y + boxEdge.height))).toBe(16);
  expect(Math.round(narrow.table.y - (narrow.calculator.y + narrow.calculator.height))).toBe(16);
  // Flush left, under the menu's edge.
  expect(Math.abs(narrow.calculator.x - narrow.menu.x)).toBeLessThan(4);
});

test('the chip gives up its name before the number shrinks, sooner in a narrower box', async ({
  page,
}) => {
  // Numbers are set in the system's font, so how many digits fit differs by machine: the test
  // types every length from 1 to 20 digits and checks the rule, not a count.
  await page.goto('/?a=milliliter&v=1');
  await ready(page);
  await setSettings(page, 'Symbol and name');
  const name = page
    .getByRole('button', { name: 'Change unit: milliliters' })
    .getByText('milliliters', { exact: true });
  const fontSize = () => box(page).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const sweep = async (width: number) => {
    await page.setViewportSize({ width, height: 720 });
    await box(page).fill('1');
    const largest = await fontSize();
    const seen: { digits: number; named: boolean; full: boolean }[] = [];
    for (let digits = 1; digits <= 20; digits += 1) {
      await box(page).fill('12345678901234567890'.slice(0, digits));
      seen.push({ digits, named: await name.isVisible(), full: (await fontSize()) === largest });
    }
    return seen;
  };
  const firstUnnamed = (seen: Awaited<ReturnType<typeof sweep>>) =>
    seen.find((step) => !step.named)?.digits ?? Infinity;

  const wide = await sweep(1280);
  const narrow = await sweep(375);
  for (const step of [...wide, ...narrow]) {
    expect(step.named && !step.full, `${step.digits} digits: name kept, number shrunk`).toBe(false);
  }
  // The wide box keeps the name past the six characters a count once gave up at.
  expect(wide.some((step) => step.digits > 6 && step.named)).toBe(true);
  // A phone's box gives it up sooner, and the number then keeps its size for a while.
  expect(firstUnnamed(narrow)).toBeLessThan(firstUnnamed(wide));
  expect(narrow.some((step) => !step.named && step.full)).toBe(true);
  // In every theme, whose figures differ in width (monospace, serif), the rule holds on a phone.
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    for (const step of await sweep(375)) {
      expect(step.named && !step.full, `${theme.id}, ${step.digits} digits`).toBe(false);
    }
  }
});

test('before the island hydrates, the server’s page shows the start, so nothing jumps', async ({
  page,
}) => {
  // Without the island's code (its source on the dev server, its chunk in a build) the page stays
  // as the server rendered it.
  await page.route(/Converter[\w.-]*\.(tsx|js)/, (route) => route.abort());
  await page.goto('/');
  await expect(box(page)).toBeVisible();
  await expect(page.locator('section[data-hydrated]')).toHaveCount(0);
  await expect(box(page)).toHaveAttribute('placeholder', 'Number or unit');
  await expect(menu(page)).toBeVisible();
  await expect(tiles(page)).toBeVisible();
});

test('keys typed before the island loads are kept, the link’s unit staying', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'typing from anywhere needs a keyboard');
  // Hold the island's code until the keys are in, so they land in the server's page.
  let release = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(/Converter[\w.-]*\.(tsx|js)/, async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('/?a=milliliter', { waitUntil: 'domcontentloaded' });
  // With nothing focused, the first key moves focus into the box, and the keys land there.
  await page.keyboard.type('25');
  await expect(box(page)).toBeFocused();
  await expect(box(page)).toHaveValue('25');
  release();
  await ready(page);
  await expect(box(page)).toHaveValue('25');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  // Two places, as a fresh visit writes values.
  await expect(row(page, 'liter')).toContainText('0.03');
});

test('the categories go four across once the column has the room, and fit in every theme', async ({
  page,
}) => {
  // The table's place is the page less its 16 px gutters until it is 576 px: 511, then 512.
  const options = () => tiles(page).getByRole('option');
  const across = () =>
    options().evaluateAll((all) => {
      const top = (all[0] as HTMLElement).offsetTop;
      return all.filter((tile) => (tile as HTMLElement).offsetTop === top).length;
    });
  const overflowing = () =>
    options().evaluateAll((all) =>
      all.filter((tile) => tile.scrollWidth > tile.clientWidth).map((tile) => tile.textContent),
    );
  await page.goto('/');
  await ready(page);
  for (const [width, expected] of [
    [543, 2],
    [544, 4],
  ] as const) {
    await page.setViewportSize({ width, height: 800 });
    expect(await across(), `${width} px`).toBe(expected);
    for (const theme of THEMES) {
      await applyTheme(page, theme);
      expect(await overflowing(), `${theme.id} at ${width} px`).toEqual([]);
    }
  }
});

test('at 320 px the rows and the categories fit without scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  await page.goto('/?a=kilometer-per-hour&v=100');
  await ready(page);
  await expect(row(page, 'mile-per-hour')).toBeVisible();
  expect(await overflow()).toBe(0);
  await page.goto('/');
  await ready(page);
  await expect(tiles(page)).toBeVisible();
  expect(await overflow()).toBe(0);
});

test('a line between sections sits evenly between their text, and the first heading clear of the top', async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  // The ink the eye measures: text runs' own boxes, not their elements'.
  const gaps = () =>
    page.locator('[data-table-card]').evaluate((card) => {
      const text = (el: Element) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect();
      };
      const top =
        card.getBoundingClientRect().top + parseFloat(getComputedStyle(card).borderTopWidth);
      const headings = [...card.querySelectorAll('[data-section]')];
      const lines = headings.slice(1).map((heading) => {
        const line = heading.getBoundingClientRect().top;
        const group = heading.closest('[role="rowgroup"]')!.previousElementSibling!;
        const above =
          line - text(group.querySelector('[data-row]:last-of-type [data-symbol]')!).bottom;
        const below = text(heading).top - line;
        return [Math.round(above), Math.round(below)];
      });
      return { first: Math.round(text(headings[0]!).top - top), lines };
    });
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    const { first, lines } = await gaps();
    expect(first, theme.id).toBeGreaterThanOrEqual(16);
    for (const [above, below] of lines)
      expect(Math.abs(above! - below!), theme.id).toBeLessThanOrEqual(4);
  }
});

test('a fill never touches a line: the foot and Edit’s headings keep 4 px from it', async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  // Around each line in the card, the nearest box that can fill (a button, a checkbox's row, a
  // unit's row) above it and below it (docs/DESIGN-SYSTEM.md, "Sections and dividers").
  const gaps = () =>
    page.locator('[data-table-card]').evaluate((card) => {
      const boxes = [...card.querySelectorAll('button, label, [data-row]')]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height >= 28);
      const found: number[] = [];
      for (const el of card.querySelectorAll('*')) {
        const style = getComputedStyle(el);
        const width = parseFloat(style.borderTopWidth);
        if (width < 1 || parseFloat(style.borderLeftWidth) >= 1) continue;
        const top = el.getBoundingClientRect().top;
        const above = boxes.filter((r) => r.bottom <= top + 0.5).map((r) => top - r.bottom);
        const below = boxes
          .filter((r) => r.top >= top + width - 0.5)
          .map((r) => r.top - top - width);
        if (above.length) found.push(Math.min(...above));
        if (below.length) found.push(Math.min(...below));
      }
      return found.map((gap) => Math.round(gap * 10) / 10);
    });
  const card = page.locator('[data-table-card]');
  for (const step of ['rows', 'Hidden open', 'Edit'] as const) {
    if (step === 'Hidden open') await card.getByRole('button', { name: /^Hidden/ }).click();
    if (step === 'Edit') await card.getByRole('button', { name: 'Edit', exact: true }).click();
    // In every theme: the gap is padding, but each theme's type sets the rows' height.
    for (const theme of THEMES) {
      await applyTheme(page, theme);
      const found = await gaps();
      expect(found.length, `${step}, ${theme.id}`).toBeGreaterThan(0);
      for (const gap of found) expect(gap, `${step}, ${theme.id}`).toBeGreaterThanOrEqual(4);
    }
  }
});

test('a long name wraps in Edit, in Hidden, and among the hidden matches, never cut short', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/?a=liter-per-100-kilometers&v=5');
  await ready(page);
  // Each name as it shows: cut at its box's edge, and how many lines it takes.
  const names = (selector: string) =>
    page.locator(selector).evaluateAll((all) =>
      all.map((name) => ({
        text: name.textContent,
        cut: name.scrollWidth > name.clientWidth + 1,
        lines: Math.round(
          name.getBoundingClientRect().height / parseFloat(getComputedStyle(name).lineHeight),
        ),
      })),
    );
  const expectWhole = async (selector: string, wrapped: string) => {
    const seen = await names(selector);
    expect(seen.filter((name) => name.cut)).toEqual([]);
    expect(seen.find((name) => name.text?.includes(wrapped))?.lines).toBeGreaterThan(1);
  };
  const card = page.locator('[data-table-card]');
  await card.getByRole('button', { name: 'Edit', exact: true }).click();
  await expectWhole('[data-list="shown"] label[data-unit] > span:last-child', 'per 100 kilometers');
  // Sent to Hidden, it wraps there too.
  await card.getByLabel(/miles per imperial gallon/).click();
  await card.getByRole('button', { name: 'Done', exact: true }).click();
  await hiddenToggle(page).click();
  await expectWhole('[data-list="hidden"] label[data-unit] > span:last-child', 'imperial gallon');
  // Its symbol keeps one line, as the matches keep theirs.
  const symbols = await names('[data-list="hidden"] label[data-unit] > span:first-of-type');
  expect(symbols.filter((symbol) => symbol.lines > 1)).toEqual([]);
  // And among the hidden matches its name brings up.
  await box(page).fill('5 miles per imperial');
  await page.getByRole('button', { name: 'Show them' }).click();
  await expectWhole(
    '[role="listbox"][aria-labelledby] [role="option"] > span:last-child > span:first-child',
    'imperial gallon',
  );
  // The line's button keeps its words on one line, the line's own words wrapping beside it.
  const buttonLines = await page.getByRole('button', { name: 'Hide them' }).evaluate((button) => {
    const range = document.createRange();
    range.selectNodeContents(button);
    return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
  });
  expect(buttonLines).toBe(1);
});

test('the box’s × clears its text and keeps the unit, one step undo brings back', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  const clear = page.getByRole('button', { name: 'Clear number' });
  await clear.click();
  await expect(box(page)).toHaveValue('');
  await expect(box(page)).toBeFocused();
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  // Only while there is text to clear.
  await expect(clear).toHaveCount(0);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(box(page)).toHaveValue('250');
  // With a unit typed after the number, the whole text goes, and the button says so.
  await page.keyboard.press('End');
  await page.keyboard.type(' cu');
  await page.getByRole('button', { name: 'Clear text' }).click();
  await expect(box(page)).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
});

test('the hint has a line of its own; the toolbar under it leads with the menu, the calculator, Units, and Display, which wrap under the other tools on a phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await ready(page);
  const words = 'Type a number, unit, or both to compare all at once.';
  const geometry = async () => ({
    hint: (await page.getByText(words).boundingBox())!,
    toolbar: (await page.getByRole('toolbar', { name: 'Tools' }).boundingBox())!,
    calculator: (await calculatorButton(page).boundingBox())!,
    units: (await settingsButton(page, 'Units').boundingBox())!,
    display: (await settingsButton(page, 'Display').boundingBox())!,
    undo: (await page.getByRole('button', { name: 'Undo' }).boundingBox())!,
    last: (await page.getByRole('button', { name: 'Clear all' }).boundingBox())!,
    menu: (await menu(page).boundingBox())!,
    field: (await box(page).boundingBox())!,
    start: (await tiles(page).boundingBox())!,
  });
  const middle = (b: { y: number; height: number }) => b.y + b.height / 2;
  // Wide: the menu at the toolbar's left, its edge on the column's, over the box, the calculator,
  // Units, and Display after it; undo, redo, and clear all at the right end, the last button's edge
  // on the column's too, so a fill lines up with the table (Sean, 2026-10-10). The menu is as wide
  // as its widest label in the theme's font, so every theme is checked.
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    const wide = await geometry();
    // 8 px under the hint, as the toolbar sits over the box.
    expect(Math.round(wide.toolbar.y - (wide.hint.y + wide.hint.height)), theme.id).toBe(8);
    expect(Math.abs(middle(wide.menu) - middle(wide.last)), theme.id).toBeLessThan(4);
    expect(wide.menu.x + wide.menu.width, theme.id).toBeLessThan(wide.calculator.x);
    expect(wide.calculator.x + wide.calculator.width, theme.id).toBeLessThanOrEqual(wide.units.x);
    expect(wide.units.x + wide.units.width, theme.id).toBeLessThanOrEqual(wide.display.x);
    expect(wide.display.x + wide.display.width, theme.id).toBeLessThan(wide.undo.x);
    expect(Math.abs(wide.menu.x - wide.start.x), theme.id).toBeLessThanOrEqual(3);
    expect(
      Math.abs(wide.last.x + wide.last.width - (wide.start.x + wide.start.width)),
      theme.id,
    ).toBeLessThanOrEqual(1);
    expect(wide.menu.y + wide.menu.height, theme.id).toBeLessThanOrEqual(wide.field.y);
  }

  // A phone has no room for both: undo, redo, and clear all keep the top line, and the menu, the
  // calculator, Units, and Display take the next, both lines flush left over the box (Sean,
  // 2026-10-15).
  await page.setViewportSize({ width: 375, height: 800 });
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    const narrow = await geometry();
    // 8 px under the hint on a phone too.
    expect(Math.round(narrow.toolbar.y - (narrow.hint.y + narrow.hint.height)), theme.id).toBe(8);
    expect(Math.abs(narrow.undo.x - narrow.start.x), theme.id).toBeLessThanOrEqual(1);
    expect(narrow.menu.y, theme.id).toBeGreaterThanOrEqual(narrow.last.y + narrow.last.height);
    expect(Math.abs(middle(narrow.menu) - middle(narrow.display)), theme.id).toBeLessThan(4);
    expect(Math.abs(narrow.menu.x - narrow.start.x), theme.id).toBeLessThanOrEqual(3);
    expect(narrow.menu.y + narrow.menu.height, theme.id).toBeLessThanOrEqual(narrow.field.y);
  }
  await expect(box(page)).toHaveAccessibleDescription(words);
});

test('one copy button, laid over the active row’s end, copies what the row shows', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?a=foot&v=2');
  await ready(page);
  await box(page).click();
  const copyCell = (unitId: string) => row(page, unitId).locator('[data-copy-cell]');
  const shown = () =>
    page
      .locator('[data-copy-cell]')
      .evaluateAll((cells) =>
        cells
          .filter((cell) => getComputedStyle(cell).opacity !== '0')
          .map((cell) => cell.closest<HTMLElement>('[data-row]')!.dataset.row),
      );
  // The box has no copy button; at rest the row of the box's unit shows the table's one.
  await expect(page.getByRole('button', { name: 'Copy value' })).toHaveCount(0);
  await expect.poll(shown).toEqual(['foot']);
  // No column is kept: the row runs to the card's edge, the button over its end.
  const edges = await row(page, 'yard').evaluate((each) => {
    const cell = each.querySelector('[role="gridcell"]')!.getBoundingClientRect();
    const copy = each.querySelector('[data-copy-cell]')!.getBoundingClientRect();
    return { row: each.getBoundingClientRect().right, cell: cell.right, copy: copy.right };
  });
  expect(Math.abs(edges.cell - edges.row)).toBeLessThanOrEqual(1);
  expect(Math.abs(edges.copy - edges.row)).toBeLessThanOrEqual(1);

  // The mouse's row shows it instead, and it copies what the row shows, not the full value.
  await unitCell(page, 'meter').hover();
  await expect.poll(shown).toEqual(['meter']);
  const copyMeter = copyCell('meter').getByRole('button', { name: /^Copy/ });
  await copyMeter.click();
  await expect(copyMeter.locator('[data-copied]')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('0.61');
  await expect(copyMeter).toHaveAttribute('title', 'Copy (Ctrl+C)');
  // The click kept focus in the box: the arrows go on through the rows, the cursor's row showing it.
  await expect(box(page)).toBeFocused();
  await page.mouse.move(0, 0);
  await expect.poll(shown).toEqual(['foot']);
  await page.keyboard.press('ArrowDown');
  await expect.poll(shown).toEqual(['yard']);
  await page.keyboard.press('Escape');
  await expect.poll(shown).toEqual(['foot']);

  // A row taken into the box shows it, the cursor resting there, and Ctrl/⌘+C copies it.
  await unitCell(page, 'yard').click();
  await expect(page.getByRole('button', { name: 'Remove yards' })).toBeVisible();
  await page.mouse.move(0, 0);
  await expect.poll(shown).toEqual(['yard']);
  await page.keyboard.press('ControlOrMeta+c');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('0.67');

  // The cursor's row shows it, and Ctrl/⌘+C copies that row as shown.
  await page.keyboard.press('ArrowUp');
  await expect.poll(shown).toEqual(['foot']);
  await page.keyboard.press('ControlOrMeta+c');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('2.00');
});

test('Copy URL copies the current conversion and confirms with a check', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?a=mile&v=2');
  await ready(page);
  const copyUrl = page.getByRole('button', { name: 'Copy URL' });

  // Typed just before the click, so the address bar may not have caught up; the copied URL has.
  await box(page).fill('3');
  await copyUrl.click();
  await expect(copyUrl.locator('[data-copied]')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'URL copied' })).toHaveCount(1);
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(copied).search).toBe('?a=mile&v=3');
});

test('clear all empties the box, its unit, and its category; undo brings them back', async ({
  page,
}) => {
  await page.goto('/?a=mile&v=1');
  await ready(page);
  const clear = page.getByRole('button', { name: 'Clear all' });

  await clear.click();
  await expect(box(page)).toHaveValue('');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(menu(page)).toHaveText(/^Category$/);
  await expect(tiles(page)).toBeVisible();
  await expect(box(page)).toBeFocused();
  await expect(clear).toBeDisabled();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('button', { name: 'Remove miles' })).toBeVisible();
  await expect(box(page)).toHaveValue('1');
  await expect(row(page, 'kilometer')).toContainText('1.61');

  // A category alone is something to clear too.
  await page.goto('/');
  await ready(page);
  await tiles(page).getByRole('option', { name: 'Time' }).click();
  await clear.click();
  await expect(tiles(page)).toBeVisible();
});

test('undo takes typing back a burst at a time; Ctrl+Y and Ctrl+Shift+Z both redo', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await box(page).pressSequentially('25');
  await page.waitForTimeout(TYPING_CHUNK_MS + MARGIN_MS);
  await box(page).pressSequentially('0');
  await expect(box(page)).toHaveValue('250');

  await box(page).press('Control+z');
  await expect(box(page)).toHaveValue('25');
  await box(page).press('Control+z');
  await expect(box(page)).toHaveValue('');
  await box(page).press('Control+y');
  await expect(box(page)).toHaveValue('25');
  await box(page).press('Control+Shift+z');
  await expect(box(page)).toHaveValue('250');
});

test('Enter works out arithmetic and keeps the unit; with no unit, the next Enter goes into the table', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&v=1');
  await ready(page);
  await box(page).fill('2 × 3');
  await expect(row(page, 'us-teaspoon')).toContainText('1.22');
  await box(page).press('Enter');
  await expect(box(page)).toHaveValue('6');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await box(page).fill('5/0');
  await expect(page.getByRole('region', { name: 'Volume' })).toContainText('Can’t divide by zero');

  await page.goto('/');
  await ready(page);
  await box(page).fill('6*3');
  await box(page).press('Enter');
  await expect(box(page)).toHaveValue('18');
  await expectCursor(page, null);
  await box(page).press('Enter');
  await expectCursor(page, 'Length');
});

test('a long number steps down a size and fits, or scrolls at the smallest; its exponent marker is bold, in the box and in a row', async ({
  page,
}) => {
  // How many digits fit depends on the machine's font, so the test checks the rule, not a length:
  // at every length, the number fits on one line, or it is at the smallest size and scrolls.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/?a=kilometer&v=1');
  await ready(page);
  const fontSize = () => box(page).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const fits = () => box(page).evaluate((el) => el.scrollWidth <= el.clientWidth);
  const short = await fontSize();
  await box(page).fill('1234567890123456789012345678901234567890');
  expect(await fontSize()).toBeLessThan(short);
  // In every theme, whose figures differ in width (monospace, serif).
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    await box(page).fill('1234567890123456789012345678901234567890');
    const smallest = await fontSize();
    for (let digits = 1; digits <= 24; digits += 1) {
      await box(page).fill('123456789012345678901234'.slice(0, digits));
      const ok = (await fits()) || (await fontSize()) === smallest;
      expect(ok, `${theme.id}, ${digits} digits`).toBe(true);
    }
  }
  await applyTheme(page, THEMES[0]!);
  await box(page).fill('1.5E21');
  await expect(page.locator('[data-plane="box"] [data-marker]')).toHaveText('E');
  // A row's value in exponent form sets its marker as the box does, and reads whole.
  const marker = row(page, 'millimeter').locator('[data-marker]');
  await expect(marker).toHaveText('E');
  expect(await marker.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('600');
  await expect(unitCell(page, 'millimeter')).toHaveAccessibleName(/^1\.5E27 mm millimeters/);
});

test('the matches and the open menu pass axe, and matched letters are set heavier', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  await box(page).fill('250 me');
  await expect(matches(page)).toBeVisible();
  const weight = await matches(page)
    .locator('[data-match]')
    .first()
    .evaluate((el) => Number(getComputedStyle(el).fontWeight));
  expect(weight).toBeGreaterThanOrEqual(600);
  await expectNoA11yViolations(page);
  await menu(page).click();
  await expect(page.getByRole('group', { name: 'Category' })).toBeVisible();
  await expectNoA11yViolations(page);
});

test.describe('in a German locale', () => {
  test.use({ locale: 'de-DE' });

  test('numbers read and write the German way, and the URL keeps the number meant', async ({
    page,
  }) => {
    await page.goto('/?a=kilometer');
    await ready(page);
    await box(page).fill('1.000');
    await expect(row(page, 'meter')).toContainText('1.000.000');
    await expect(page).toHaveURL(/v=1000$/);
    // A link's number opens in the visitor's own decimal mark, every digit kept.
    await page.goto('/?a=kilometer&v=1234.567890123456789');
    await ready(page);
    await expect(box(page)).toHaveValue('1234,567890123456789');
  });
});
