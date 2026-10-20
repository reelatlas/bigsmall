import { categories, INGREDIENT_KINDS, unitsIn } from '@bigsmall/core';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { THEMES } from '../src/lib/themes';
import { ANNOUNCE_MS, COPIED_MS, TYPING_CHUNK_MS } from '../src/lib/timing';
import {
  applyTheme,
  blur,
  box,
  calculatorButton,
  calculatorPanel,
  copyCell,
  countOffBaseline,
  expectNoA11yViolations,
  hiddenToggle,
  MARGIN_MS,
  menu,
  pressControl,
  pressTool,
  ready,
  row,
  sectionIds,
  setSettings,
  settingsButton,
  settingsPanel,
  shortcutsButton,
  showEverything,
  sidewaysOverflow,
  unitCell,
  windowOf,
} from './support';

// The converter (ADR 0012, ADR 0013, docs/UX-SPEC.md §1, §5, §7–§9, §11): one box, a category menu
// over it, and in the table's place the categories to start from, the category's units with their
// values, or the units a typed query matches. The caret stays in the field while a cursor moves
// through the table. The calculator's own flows are in calculator.spec.ts. Visitors are in the
// US: their own units come first (ADR 0011).

const tiles = (page: Page) => page.getByRole('listbox', { name: 'Categories' });
const matches = (page: Page) => page.getByRole('listbox', { name: 'Matches' });
/** The headings over a list's groups, in order: the ingredients' kinds under the Cooking pill. */
const kindHeadings = (list: Locator) =>
  list
    .getByRole('group')
    .evaluateAll((groups) =>
      groups.map((group) =>
        document.getElementById(group.getAttribute('aria-labelledby') ?? '')?.textContent?.trim(),
      ),
    );
const VOLUME_UNITS = unitsIn('volume').length;
/** What a fresh visit lists: every unit but the specialty ones, the Standard preset (ADR 0018). */
const VOLUME_STANDARD = unitsIn('volume').filter((unit) => unit.tier === 'standard').length;

/**
 * The name of the section being read sits a pixel under the stuck head's lower edge, the strip of
 * canvas as deep as the gap to the table (the hairline tuck): the lowest name at or above that
 * edge, since the one before it is pushed up behind the head. `names` says whose: the table's and
 * the matches' (TABLE_NAMES), or Edit's and Hidden's headings.
 */
const nameUnderHead = (page: Page, names: string) =>
  page.evaluate((selector) => {
    const cell = document.querySelector('[data-head]')!;
    const box = cell.getBoundingClientRect();
    const strip = parseFloat(getComputedStyle(cell, '::after').height) || 0;
    const edge = Math.round(box.bottom + strip);
    const tops = [...document.querySelectorAll(selector)]
      .map((name) => Math.round(name.getBoundingClientRect().top))
      .filter((top) => top <= edge);
    return { first: Math.max(...tops), boxBottom: edge };
  }, names);
const TABLE_NAMES = '[role="grid"] [data-section], [role="listbox"] [role="group"] > :first-child';

/**
 * Scrolls so a heading's own place would sit 10 px above the stuck head's lower edge, where it
 * sticks a pixel under the edge instead, whatever its list's length: the head's height stands in
 * for its stuck place, since the head is measured before it sticks.
 */
const scrollHeadingUnder = (page: Page, heading: string) =>
  page.evaluate((selector) => {
    const cell = document.querySelector('[data-head]')!;
    const strip = parseFloat(getComputedStyle(cell, '::after').height) || 0;
    const edge = cell.getBoundingClientRect().height + strip;
    // Measured from the page's top, where no heading is stuck: a stuck heading's rect is not its
    // place in the flow, and a target taken from it lands past its group (2026-10-19).
    window.scrollTo(0, 0);
    const own = document.querySelector(selector)!.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.round(own - edge + 10));
  }, heading);

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
  // The tile under Volume, four on in the list.
  await expectCursor(page, categories[6]!.name);
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
  // A fresh visit lists every unit but the specialty ones, the visitor's own system first, each
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

test('open, the category menu is two columns as wide as the menu, down the first and on into the second, its counts fitting beside the names, in every theme', async ({
  page,
}) => {
  // The narrowest window the site supports, where the two columns have the least room.
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await ready(page);
  await box(page).fill('250 p');
  const shell = page.locator('[data-tool="category"]').locator('xpath=..');
  const toolbar = page.getByRole('toolbar', { name: 'Tools' });
  const rows = Math.ceil(categories.length / 2);
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    const closed = (await shell.boundingBox())!.width;
    await menu(page).click();
    const open = (await shell.boundingBox())!;
    // Twice the closed menu, but never past the toolbar's right edge (a phone with wider fonts),
    // so the page never scrolls sideways: the two columns then share the toolbar's width.
    const bar = (await toolbar.boundingBox())!;
    const wanted = Math.min(2 * closed, bar.x + bar.width - open.x);
    expect(Math.abs(open.width - wanted), theme.id).toBeLessThanOrEqual(1);
    expect(open.x + open.width, theme.id).toBeLessThanOrEqual(bar.x + bar.width + 1);
    const lefts = await shell
      .locator('label')
      .evaluateAll((labels) => labels.map((label) => Math.round(label.getBoundingClientRect().x)));
    expect(new Set(lefts).size, theme.id).toBe(2);
    expect(new Set(lefts.slice(0, rows)), theme.id).toEqual(new Set([lefts[0]]));
    expect(Math.min(...lefts.slice(rows)), theme.id).toBeGreaterThan(lefts[0]!);
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
    // The count on the name's baseline, in the numeric face's own line box (docs/LEARNINGS.md,
    // 2026-10-10).
    const volume = shell.locator('label').filter({ hasText: /^Volume/ });
    expect(await countOffBaseline(volume), theme.id).toBeLessThan(0.5);
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

test('opening the category menu leaves the page where it was; the keyboard brings the choice into view', async ({
  page,
  isMobile,
}) => {
  // A window short enough that Torque, near the list's end, opens below its edge.
  await page.setViewportSize({ width: page.viewportSize()?.width ?? 1280, height: 600 });
  await page.goto('/?a=pound-foot&v=80');
  await ready(page);
  const torque = page.getByRole('radio', { name: 'Torque' });
  await menu(page).click();
  await expect(torque).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  if (isMobile) return;
  await page.keyboard.press('Escape');
  await expect(menu(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(torque).toBeFocused();
  // The radio itself is visually hidden; the choice people see is its label.
  const label = page
    .getByRole('group', { name: 'Category' })
    .locator('label', { hasText: 'Torque' });
  await expect(label).toBeInViewport();
});

test('a letter pressed on an open menu’s choice stays with the menu: the box takes nothing', async ({
  page,
  isMobile,
}) => {
  // docs/UX-SPEC.md §8, Typing: never with focus in another control, a menu's choices among them,
  // as the header's theme menu already kept its keys (Sean, 2026-10-18; until then a letter on
  // the category menu's choice typed into the box and shut the menu).
  await page.goto('/?a=meter&v=1');
  await ready(page);
  const before = await box(page).inputValue();
  await menu(page).click();
  const chosen = page.getByRole('radio', { name: 'Length' });
  await expect(chosen).toBeFocused();
  await page.keyboard.press('k');
  await expect(menu(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(chosen).toBeFocused();
  expect(await box(page).inputValue()).toBe(before);
  await page.keyboard.press('Escape');
  await expect(menu(page)).toHaveAttribute('aria-expanded', 'false');
  if (isMobile) return;
  // More's menu the same, where a pointer gets More (ADR 0023).
  await windowOf(page, 375, 800);
  const more = page
    .getByRole('toolbar', { name: 'Tools' })
    .getByRole('button', { name: 'More tools' });
  await more.focus();
  await page.keyboard.press('Enter');
  const first = page.getByRole('menuitem').first();
  await expect(first).toBeFocused();
  await page.keyboard.press('k');
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(first).toBeFocused();
  expect(await box(page).inputValue()).toBe(before);
});

test('in a short window the open category menu scrolls inside, the chosen category in view and the page still', async ({
  page,
}) => {
  // Angle, the last in the list, chosen.
  await page.goto('/?a=degree&v=90');
  await ready(page);
  const group = page.getByRole('group', { name: 'Category' });
  const list = group.locator(':scope > div');
  // A window with room under the list's top for five and a half of its rows, measured open.
  await menu(page).click();
  const top = (await list.boundingBox())!.y;
  const row = (await group.locator('label').first().boundingBox())!.height;
  await page.keyboard.press('Escape');
  const width = page.viewportSize()?.width ?? 1280;
  await page.setViewportSize({ width, height: Math.round(top + 5.5 * row) });

  await menu(page).click();
  await expect(page.getByRole('radio', { name: 'Angle' })).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect(await list.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  // The list ends inside the window, and scrolls to show Angle.
  const card = (await page.locator('[data-tool="category"]').locator('xpath=..').boundingBox())!;
  expect(card.y + card.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await expect(group.locator('label', { hasText: 'Angle' })).toBeInViewport({ ratio: 1 });
});

test('the open category menu: ↓ runs down the first column and on into the second, ↑ back', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  // The first column's last category and the second's first, from the list itself.
  const rows = Math.ceil(categories.length / 2);
  const foot = categories[rows - 1]!;
  const head = categories[rows]!;
  await page.goto(`/?a=${unitsIn(foot.id)[0]!.id}&v=1`);
  await ready(page);
  await menu(page).press('Enter');
  const last = page.getByRole('radio', { name: foot.name, exact: true });
  const next = page.getByRole('radio', { name: head.name, exact: true });
  await expect(last).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(next).toBeFocused();
  // It heads the second column, level with the first's head.
  const label = (name: string) =>
    page.getByRole('group', { name: 'Category' }).locator('label', { hasText: name });
  const first = (await label(categories[0]!.name).boundingBox())!;
  const second = (await label(head.name).boundingBox())!;
  expect(second.x).toBeGreaterThan(first.x + first.width / 2);
  expect(Math.abs(second.y - first.y)).toBeLessThan(1);
  await page.keyboard.press('ArrowUp');
  await expect(last).toBeFocused();
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
  // Moving through the choices changes nothing until one is chosen: past Cooking to Temperature.
  await page.keyboard.press('ArrowDown');
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
  browserName,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  test.skip(browserName === 'webkit', 'WebKit grants the test runner no clipboard permission');
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
  // With nothing focused the page's own Escape would clear the box, so the map's must stop there.
  await blur(page);
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
  // One step right of the box's column, in the page's second track, the column whole beside it
  // (the two tracks, 2026-10-17; flush with the page's right edge until then), inside the page,
  // and the table still right under the box.
  const column = (await page.locator('[data-head]').boundingBox())!;
  expect(Math.round(wide.calculator.x - (column.x + column.width))).toBe(16);
  expect(Math.round(column.width)).toBe(576);
  expect(wide.calculator.x + wide.calculator.width).toBeLessThanOrEqual(
    wide.converter.x + wide.converter.width + 1,
  );
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
    .getByRole('button', { name: 'Unit: milliliters' })
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
    await windowOf(page, width, 800);
    expect(await across(), `${width} px`).toBe(expected);
    for (const theme of THEMES) {
      await applyTheme(page, theme);
      expect(await overflowing(), `${theme.id} at ${width} px`).toEqual([]);
    }
  }
});

test('at 320 px the rows and the categories fit without scrolling sideways', async ({ page }) => {
  // A true 320 px window, the rule's own case (docs/LEARNINGS.md, 2026-10-18).
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/?a=kilometer-per-hour&v=100');
  await ready(page);
  await expect(row(page, 'mile-per-hour')).toBeVisible();
  // Nothing past the window.
  expect(await sidewaysOverflow(page)).toBe(0);
  await page.goto('/');
  await ready(page);
  await expect(tiles(page)).toBeVisible();
  expect(await sidewaysOverflow(page)).toBe(0);
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
  await expectWhole('[data-list="shown"] label[data-unit] [data-name]', 'per 100 kilometers');
  // Sent to Hidden, it wraps there too.
  await pressControl(card.getByLabel(/miles per imperial gallon/));
  await card.getByRole('button', { name: 'Done', exact: true }).click();
  await hiddenToggle(page).click();
  await expectWhole('[data-list="hidden"] label[data-unit] [data-name]', 'imperial gallon');
  // Its symbol keeps one line, as the matches keep theirs.
  const symbols = await names('[data-list="hidden"] label[data-unit] [data-symbol]');
  expect(symbols.filter((symbol) => symbol.lines > 1)).toEqual([]);
  // And among the hidden matches its name brings up.
  await box(page).fill('5 miles per imperial');
  await page.getByRole('button', { name: 'Show them' }).click();
  await expectWhole(
    '[role="listbox"][aria-labelledby] [role="option"] [data-name]',
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

test('the intro has a line of its own; the toolbar under it is one row, which a touch screen scrolls and a pointer folds into More where it lacks room', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await ready(page);
  const words = 'Type a number, unit, or both to compare all at once.';
  const geometry = async () => ({
    intro: (await page.getByText(words).boundingBox())!,
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
    // 8 px under the intro, as the toolbar sits over the box.
    expect(Math.round(wide.toolbar.y - (wide.intro.y + wide.intro.height)), theme.id).toBe(8);
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

  // A phone has no room for all seven, and the row never wraps (ADR 0023). With a pointer, the
  // tools the row has no room for fold into More at its end, the right end's three here, More's
  // edge on the column's; on a touch screen the row scrolls sideways instead, every tool on one
  // line, a fade where more waits, and clear all's edge on the column's once scrolled to the end.
  // Which it is follows the pointer, which each project emulates.
  await windowOf(page, 375, 800);
  const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
  const bar = page.getByRole('toolbar', { name: 'Tools' });
  const rowOf = (name: string) => bar.getByRole('button', { name, exact: true });
  const more = rowOf('More tools');
  const reach = () => bar.evaluate((row) => row.parentElement?.dataset['reach'] ?? null);
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    const intro = (await page.getByText(words).boundingBox())!;
    const toolbar = (await bar.boundingBox())!;
    const menuBox = (await menu(page).boundingBox())!;
    const start = (await tiles(page).boundingBox())!;
    // 8 px under the intro on a phone too, the menu's edge on the column's.
    expect(Math.round(toolbar.y - (intro.y + intro.height)), theme.id).toBe(8);
    expect(Math.abs(menuBox.x - start.x), theme.id).toBeLessThanOrEqual(3);
    // One line: every control's middle on the menu's.
    const middles = await bar.locator('[data-tool]').evaluateAll((all) =>
      all.map((control) => {
        const rect = control.getBoundingClientRect();
        return rect.top + rect.height / 2;
      }),
    );
    for (const each of middles) expect(Math.abs(each - middle(menuBox)), theme.id).toBeLessThan(4);
    if (coarse) {
      await expect(more, theme.id).toHaveCount(0);
      for (const name of ['Undo', 'Redo', 'Clear all']) {
        await expect(rowOf(name), theme.id).toHaveCount(1);
      }
      const scroll = await bar.evaluate((row) => ({
        width: row.clientWidth,
        content: row.scrollWidth,
      }));
      expect(scroll.content, theme.id).toBeGreaterThan(scroll.width);
      expect(await reach(), theme.id).toBe('right');
      await bar.evaluate((row) => {
        row.scrollLeft = row.scrollWidth;
      });
      await expect.poll(reach, { message: theme.id }).toBe('left');
      const last = (await rowOf('Clear all').boundingBox())!;
      expect(Math.abs(last.x + last.width - (start.x + start.width)), theme.id).toBeLessThanOrEqual(
        1,
      );
      await bar.evaluate((row) => {
        row.scrollLeft = 0;
      });
    } else {
      await expect(more, theme.id).toBeVisible();
      for (const name of ['Undo', 'Redo', 'Clear all']) {
        await expect(rowOf(name), theme.id).toHaveCount(0);
      }
      const last = (await more.boundingBox())!;
      expect(Math.abs(last.x + last.width - (start.x + start.width)), theme.id).toBeLessThanOrEqual(
        1,
      );
      // The page itself never scrolls sideways.
      expect(await sidewaysOverflow(page), theme.id).toBe(0);
    }
  }
  await expect(box(page)).toHaveAccessibleDescription(words);
});

test('More: a tool the row had no room for acts from the menu, with the keys, and hands focus back to More (ADR 0023)', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a touch screen scrolls the row instead');
  await page.goto('/?a=meter&v=1');
  await ready(page);
  await windowOf(page, 375, 800);
  const bar = page.getByRole('toolbar', { name: 'Tools' });
  const more = bar.getByRole('button', { name: 'More tools' });
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  // Enter on More opens it on the first item; ↑ and ↓ go round; Escape closes it back on More.
  await more.focus();
  await page.keyboard.press('Enter');
  const items = page.getByRole('menuitem');
  await expect(items).toHaveText(['Undo', 'Redo', 'Clear all']);
  await expect(items.first()).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(items.last()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(items.first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(more).toBeFocused();
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  // → from an item closes the menu and moves along the toolbar, round to the category menu.
  await page.keyboard.press('Enter');
  await expect(items.first()).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(menu(page)).toBeFocused();
  // Clear all from More clears the box, and does what clear all does: the caret goes into the box.
  await more.click();
  await page.getByRole('menuitem', { name: 'Clear all' }).click();
  await expect(box(page)).toHaveValue('');
  await expect(box(page)).toBeFocused();
  await expectNoA11yViolations(page);
  // At 320 px Display folds too; opened from More, its panel closes back onto More.
  await windowOf(page, 320, 800);
  await expect(settingsButton(page, 'Display')).toHaveCount(0);
  await more.click();
  await page.getByRole('menuitem', { name: 'Display' }).click();
  await expect(settingsPanel(page, 'Display')).toBeVisible();
  await settingsPanel(page, 'Display')
    .getByRole('button', { name: /^Close/ })
    .click();
  await expect(more).toBeFocused();
  // Wider again, every tool is back on the row and More is gone.
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(more).toHaveCount(0);
  await expect(bar.getByRole('button', { name: 'Clear all', exact: true })).toBeVisible();
});

test('a second tap or click on a row copies what it shows, the check flashing over its end; Ctrl/⌘+C copies the cursor’s row', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName === 'webkit', 'WebKit grants the test runner no clipboard permission');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?a=foot&v=2');
  await ready(page);
  await box(page).click();
  // No copy button anywhere (Copy URL is the header's): nothing covers a name, and no column is
  // kept (Sean, 2026-10-19).
  await expect(page.getByRole('button', { name: /^Copy (?!URL)/ })).toHaveCount(0);
  await expect(page.locator('[data-copy-cell]')).toHaveCount(0);
  // A click takes the row into the box; a second within the window copies it as it shows, not
  // the full value, the check over the row's end and the status saying so.
  await unitCell(page, 'meter').click();
  await expect(page.getByRole('button', { name: 'Remove meters' })).toBeVisible();
  await unitCell(page, 'meter').click();
  await expect(copyCell(page, 'meter').locator('[data-copied]')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('0.61');
  // The clicks kept focus in the box, and the check goes after a moment.
  await expect(box(page)).toBeFocused();
  await expect(copyCell(page, 'meter')).toHaveCount(0, { timeout: COPIED_MS + MARGIN_MS });
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(0);

  // Ctrl/⌘+C copies the row the cursor rests on, the box's unit's right after a take, as shown.
  await unitCell(page, 'yard').click();
  await expect(page.getByRole('button', { name: 'Remove yards' })).toBeVisible();
  await page.keyboard.press('ControlOrMeta+c');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('0.67');
  await expect(copyCell(page, 'yard').locator('[data-copied]')).toBeVisible();
  // The cursor's row, moved to with the keys, copies as shown.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ControlOrMeta+c');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('2.00');
});

test('a pace: "5:30 /km" lists the speeds, then the paces in minutes and seconds, which copy, move into the box, and link as written', async ({
  page,
  context,
  isMobile,
  browserName,
}) => {
  test.skip(browserName === 'webkit', 'WebKit grants the test runner no clipboard permission');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await ready(page);
  await box(page).fill('5:30 /km');
  await box(page).press('Enter');
  await expect(page.getByRole('button', { name: 'Remove minutes per kilometer' })).toBeVisible();
  await expect(box(page)).toHaveValue('5:30');
  await expect(row(page, 'kilometer-per-hour')).toContainText('10.91');
  await expect(row(page, 'minute-per-mile')).toContainText('8:51');
  // The paces in a section of their own, after the speeds' (Sean, 2026-10-16).
  expect((await sectionIds(page)).at(-1)).toBe('pace');
  // The colon lines up with the decimal points, as a decimal point would, in every theme, whose
  // number faces differ (monospace, serif).
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    const lineUp = await page.evaluate(() =>
      ['kilometer-per-hour', 'minute-per-mile'].map((id) =>
        Math.round(
          document.querySelector(`[data-row="${id}"] [data-whole]`)!.getBoundingClientRect().right,
        ),
      ),
    );
    expect(Math.abs(lineUp[0]! - lineUp[1]!), theme.id).toBeLessThanOrEqual(1);
  }
  // The link keeps the minutes and seconds as typed.
  await expect(page).toHaveURL(/[?&]v=5%3A30/);

  if (!isMobile) {
    // A second click on the pace's row copies it as written, the first taking it into the box.
    await unitCell(page, 'minute-per-mile').click();
    await unitCell(page, 'minute-per-mile').click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('8:51');
  }

  // A pace taken into the box comes as the row writes it, and a link brings it back.
  await unitCell(page, 'minute-per-mile').click();
  await expect(page.getByRole('button', { name: 'Remove minutes per mile' })).toBeVisible();
  await expect(box(page)).toHaveValue('8:51');
  await expect(row(page, 'minute-per-kilometer')).toContainText('5:30');
  await expect(page).toHaveURL(/[?&]v=8%3A51/);
  await page.reload();
  await ready(page);
  await expect(box(page)).toHaveValue('8:51');
});

test('a temperature is said as a change too, after the readings: 5 °C warmer is 9 °F warmer', async ({
  page,
}) => {
  await page.goto('/?a=celsius&v=5');
  await ready(page);
  await expect(page.locator('[data-section="change"]')).toHaveText(
    'As a change: 5 °C warmer or cooler',
  );
  await expect(row(page, 'fahrenheit')).toContainText('41.00');
  await expect(row(page, 'fahrenheit-change')).toContainText('9.00');
  await expect(row(page, 'kelvin-change')).toContainText('5.00');
  // Every scale but the box's own.
  await expect(row(page, 'celsius-change')).toHaveCount(0);
  // Edit lists the units, never their change again.
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('label[data-unit="fahrenheit"]')).toHaveCount(1);
  await expect(page.locator('label[data-unit="fahrenheit-change"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  // Taking a change row brings its scale, the same change said in it: 9 °F, and as a change 5 °C.
  await unitCell(page, 'fahrenheit-change').click();
  await expect(page.getByRole('button', { name: 'Remove Fahrenheit' })).toBeVisible();
  await expect(box(page)).toHaveValue('9');
  await expect(row(page, 'celsius-change')).toContainText('5.00');
  // A negative change keeps its sign, and says its direction itself.
  await box(page).fill('-25');
  await expect(page.locator('[data-section="change"]')).toHaveText('As a change: -25 °F');
  await expect(row(page, 'celsius-change')).toContainText('-13.89');
});

test('Cooking: "2 cups flour" takes the cup and the flour, two pills, Weight then Volume, the weights measured', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await box(page).fill('2 cups flour');
  await expect(page.getByRole('option').first()).toHaveText(/cups of all-purpose flour/);
  await box(page).press('Enter');
  // Two pills in the box (ADR 0021), each removable.
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove all-purpose flour' })).toBeVisible();
  await expect(box(page)).toHaveValue('2');
  await expect(menu(page)).toHaveText(/Cooking/);
  expect(await sectionIds(page)).toEqual(['weight', 'volume']);
  // A weight goes through the flour's density, said "about"; a volume stays exact.
  await expect(row(page, 'gram')).toContainText('≈ 254.00');
  await expect(row(page, 'gram')).toContainText('about 254.00');
  await expect(row(page, 'us-tablespoon')).toContainText('32.00');
  await expect(row(page, 'us-tablespoon')).not.toContainText('≈');
  await expect(
    page.getByText('All-purpose flour: spooned and leveled', { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/[?&]i=all-purpose-flour/);

  // Backspace in an empty box takes the last pill out first: the flour. Cooking stays, its
  // ingredients to choose from, the cups waiting; then the cups, still Cooking (Sean, 2026-10-16).
  await box(page).fill('');
  await box(page).press('Backspace');
  await expect(page.getByRole('button', { name: 'Remove all-purpose flour' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(menu(page)).toHaveText(/Cooking/);
  await expect(page.getByRole('listbox', { name: 'Matches' })).toBeVisible();
  await box(page).press('Backspace');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(menu(page)).toHaveText(/Cooking/);
});

test('in Cooking, Escape and the pills’ × take one pill a step and keep Cooking; the start comes after both', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Escape needs a keyboard');
  await page.goto('/?a=us-cup&v=2&i=all-purpose-flour');
  await ready(page);
  await box(page).click();
  await box(page).press('Escape');
  await expect(box(page)).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Remove all-purpose flour' })).toBeVisible();
  await box(page).press('Escape');
  await expect(page.getByRole('button', { name: 'Remove all-purpose flour' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(menu(page)).toHaveText(/Cooking/);
  await expect(page.getByRole('listbox', { name: 'Matches' })).toBeVisible();
  await box(page).press('Escape');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(menu(page)).toHaveText(/^Category$/);
  await expect(tiles(page)).toBeVisible();
  // The pill's × is the same step: the flour goes, Cooking and the cups stay.
  await page.goto('/?a=us-cup&v=2&i=all-purpose-flour');
  await ready(page);
  await page.getByRole('button', { name: 'Remove all-purpose flour' }).click();
  await expect(menu(page)).toHaveText(/Cooking/);
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(box(page)).toHaveValue('2');
  await expect(page.getByRole('listbox', { name: 'Matches' })).toBeVisible();
});

test('Cooking’s box keeps one line where it can, fitted as with one pill: the unit’s symbol, then the sizes, then a line of their own', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'the widths are set here');
  // The row's state, as the fit leaves it: the chip's name as a person sees it, shown or given way.
  const name = page
    .getByRole('button', { name: 'Unit: fluid ounces' })
    .getByText('fluid ounces', { exact: true });
  const fit = async () => ({
    ...(await box(page).evaluate((input) => {
      const row = input.parentElement!.parentElement!;
      return {
        wrapped: row.hasAttribute('data-wrap'),
        size: parseFloat(getComputedStyle(input).fontSize),
        height: Math.round(row.getBoundingClientRect().height),
      };
    })),
    named: await name.isVisible(),
  });
  await page.goto('/?a=us-fluid-ounce&v=123&i=all-purpose-flour');
  await ready(page);
  // In every theme, whose fonts set what fits beside the pills.
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    await page.setViewportSize({ width: 1280, height: 800 });
    // A short number and both names on one line (Sean, 2026-10-16: "123" wrapped on a desktop).
    // Whether the unit's name shows beside it depends on the system's fonts, the theme's own.
    await box(page).fill('123');
    await expect.poll(fit, { message: theme.id }).toMatchObject({ wrapped: false, height: 60 });
    const full = await fit();
    // A longer one: too long for its full size beside both names, short enough for one line at a
    // smaller size in any font: the unit's name gives way, the number steps down, still one line.
    await box(page).fill('6.66666667111');
    await expect
      .poll(fit, { message: theme.id })
      .toMatchObject({ wrapped: false, named: false, height: 60 });
    expect((await fit()).size, theme.id).toBeLessThan(full.size);
    // At a phone's width the pills take a line of their own under the number.
    await page.setViewportSize({ width: 320, height: 640 });
    await expect.poll(async () => (await fit()).wrapped, { message: theme.id }).toBe(true);
    await expect(
      page.getByRole('button', { name: 'Ingredient: all-purpose flour' }),
      theme.id,
    ).toBeVisible();
  }
  // Empty, the number keeps its placeholder's room.
  await box(page).fill('');
  const placeholder = await box(page).evaluate((input) => {
    const layer = input.nextElementSibling as HTMLElement;
    return { text: layer.textContent, whole: layer.scrollWidth <= layer.clientWidth };
  });
  expect(placeholder).toEqual({ text: 'Number', whole: true });
});

test('Cooking: the ingredient’s pill opens every ingredient under its kind, the one in the box marked; another keeps the amount and the cup', async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2&i=all-purpose-flour');
  await ready(page);
  const pill = page.getByRole('button', { name: 'Ingredient: all-purpose flour' });
  await expect(pill).toHaveAttribute('aria-expanded', 'false');
  // Opening moves the page nowhere: not to the flour's row the cursor rests on, and not to the
  // top, where a browser without scroll anchoring (WebKit, an iPhone) clamps the page while the
  // table is swapped for the list; anchoring is turned off here so Chromium behaves like them.
  await page.addStyleTag({ content: 'html { overflow-anchor: none }' });
  await page.evaluate(() => scrollTo(0, 60));
  await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(60);
  await pill.click();
  await expect(pill).toHaveAttribute('aria-expanded', 'true');
  await page.waitForTimeout(MARGIN_MS);
  expect(await page.evaluate(() => Math.round(scrollY))).toBe(60);
  await page.evaluate(() => scrollTo(0, 0));
  const list = page.getByRole('listbox', { name: 'Matches' });
  expect(await kindHeadings(list)).toEqual(INGREDIENT_KINDS.map((kind) => kind.name));
  // The cursor starts on the one in the box.
  await expect(list.getByRole('option', { selected: true })).toHaveText(/all-purpose flour/);
  await expectNoA11yViolations(page);
  // One taken from deep in the list, the box scrolled off above: the box comes back into view.
  const honey = list.getByRole('option', { name: /^honey/ });
  await honey.evaluate((option) => option.scrollIntoView({ block: 'center' }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
  await honey.click();
  await expect(page.getByRole('button', { name: 'Ingredient: honey' })).toBeVisible();
  await expect(box(page)).toHaveValue('2');
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(row(page, 'gram')).toContainText('≈ 672.00');
  await expect(page).toHaveURL(/[?&]i=honey/);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.querySelector('[data-plane="box"]')!.getBoundingClientRect().top,
      ),
    )
    .toBeGreaterThanOrEqual(0);
});

test('Cooking: from the keys, the pill’s list moves with the arrows, Enter takes, Escape closes it unchanged', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=us-cup&v=2&i=all-purpose-flour');
  await ready(page);
  const list = page.getByRole('listbox', { name: 'Matches' });
  await page.getByRole('button', { name: 'Ingredient: all-purpose flour' }).click();
  // The caret in the box, the cursor on the flour: ↓ to bread flour, Enter takes it.
  await box(page).press('ArrowDown');
  await box(page).press('Enter');
  await expect(page.getByRole('button', { name: 'Ingredient: bread flour' })).toBeVisible();
  await expect(list).toHaveCount(0);
  // Opened again, Escape closes it, nothing changed.
  await page.getByRole('button', { name: 'Ingredient: bread flour' }).click();
  await expect(list).toBeVisible();
  await box(page).press('Escape');
  await expect(list).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ingredient: bread flour' })).toBeVisible();
  await expect(box(page)).toHaveValue('2');
});

test('Cooking chosen with no ingredient lists every ingredient; Enter goes in, Enter takes one, a link keeps it', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/');
  await ready(page);
  await box(page).fill('250');
  await menu(page).click();
  await page
    .getByRole('group', { name: 'Category' })
    .locator('label', { hasText: 'Cooking' })
    .click();
  const list = page.getByRole('listbox', { name: 'Matches' });
  await expect(list.getByRole('option').first()).toHaveText(/all-purpose flour/);
  // Under their kinds' headings, in the kinds' order: Flour first.
  expect(await kindHeadings(list)).toEqual(INGREDIENT_KINDS.map((kind) => kind.name));
  await expectNoA11yViolations(page);
  // Enter goes into the list rather than taking for you; Enter again takes what the cursor is on.
  await box(page).press('Enter');
  await expect(list.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
  await box(page).press('ArrowDown');
  await box(page).press('Enter');
  await expect(page.getByRole('button', { name: 'Remove bread flour' })).toBeVisible();
  await expect(box(page)).toHaveValue('250');
  // No unit yet: every row waits with a dash, the note already there.
  await expect(row(page, 'gram')).toContainText('—');
  await expect(page.getByText('Bread flour: spooned and leveled', { exact: true })).toBeVisible();
  await expectNoA11yViolations(page);
  await page.reload();
  await ready(page);
  await expect(page.getByRole('button', { name: 'Remove bread flour' })).toBeVisible();
  await expect(menu(page)).toHaveText(/Cooking/);
});

test('Copy URL copies the current conversion and confirms with a check', async ({
  page,
  context,
  isMobile,
  browserName,
}) => {
  test.skip(browserName === 'webkit', 'WebKit grants the test runner no clipboard permission');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  // A phone's header hides Copy URL (docs/UX-SPEC.md §1); a tablet's, 768 px, shows it to touch.
  if (isMobile) await page.setViewportSize({ width: 768, height: 1024 });
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
  // At least semibold, as the matched letters are set.
  expect(
    await marker.evaluate((el) => Number(getComputedStyle(el).fontWeight)),
  ).toBeGreaterThanOrEqual(600);
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

test('the toolbar and the box stay at the window’s top as one block while a long table scrolls, the section names under them', async ({
  page,
}) => {
  const boxRect = () =>
    page.evaluate(() => {
      const rect = document.querySelector('[data-plane="box"]')!.getBoundingClientRect();
      return { top: Math.round(rect.top), bottom: Math.round(rect.bottom) };
    });
  // The toolbar's row, the category menu first, sits at the window's top when the head is stuck.
  const leadingTop = () =>
    page.evaluate(() =>
      Math.round(
        document.querySelector('[data-plane="tools"] > :first-child')!.getBoundingClientRect().top,
      ),
    );
  const nameUnderBox = () => nameUnderHead(page, TABLE_NAMES);
  const tableTop = () =>
    page.evaluate(() =>
      Math.round(
        document.querySelector('[role="grid"], [role="listbox"]')!.getBoundingClientRect().top,
      ),
    );

  // Cooking's ingredients, a long list: the box stuck, the kind being read named under it.
  await page.goto('/?a=us-cup&v=2&i=all-purpose-flour');
  await ready(page);
  await page.getByRole('button', { name: 'Ingredient: all-purpose flour' }).click();
  await expect(matches(page)).toBeVisible();
  // Deep in the list, the first row of a long kind (Dairy and eggs, six rows) at the window's
  // top: its name stuck under the head, with the whole kind under it, so the name stays rather
  // than being pushed up by the next kind's, however tall the head (one toolbar row, ADR 0023).
  await page
    .getByRole('option', { name: /^milk/ })
    .evaluate((option) => option.scrollIntoView({ block: 'start' }));
  await expect.poll(leadingTop).toBe(0);
  // The box whole under the toolbar's line, the category menu in reach above it.
  expect((await boxRect()).top).toBeGreaterThan(0);
  await expect(menu(page)).toBeInViewport();
  const list = await nameUnderBox();
  expect(list.first).toBe(list.boxBottom - 1);
  await expect(page.locator('[data-head][data-stuck]')).toHaveCount(1);
  await expectNoA11yViolations(page);
  // A pick from deep in the list: the table's top comes out from under the box, never behind it.
  const honey = page.getByRole('option', { name: /^honey/ });
  await honey.evaluate((option) => option.scrollIntoView({ block: 'center' }));
  await honey.click();
  await expect(page.getByRole('button', { name: 'Ingredient: honey' })).toBeVisible();
  await expect.poll(async () => (await boxRect()).top).toBeGreaterThanOrEqual(0);
  expect(await tableTop()).toBeGreaterThanOrEqual((await nameUnderBox()).boxBottom - 1);

  // Length's table in a window tall enough: its section names the same way; then a window too
  // short for what sticks, a name, and three rows together, where nothing sticks.
  await page.goto('/?a=meter&v=1');
  await ready(page);
  const width = page.viewportSize()!.width;
  await page.setViewportSize({ width, height: 520 });
  // The second metric row: four rows of its section below it keep the name's room under the head
  // (sticky ends with its group; a row near the group's end scrolled to the top pushed the name up
  // once Mixed units made the page long enough to scroll that far, 2026-10-19).
  await row(page, 'micrometer').evaluate((line) => line.scrollIntoView({ block: 'start' }));
  await expect.poll(leadingTop).toBe(0);
  const table = await nameUnderBox();
  expect(table.first).toBe(table.boxBottom - 1);
  await page.setViewportSize({ width, height: 200 });
  await page.evaluate(() => scrollTo(0, 500));
  await expect.poll(async () => (await boxRect()).top).toBeLessThan(0);
  await expect(page.locator('[data-head][data-stuck]')).toHaveCount(0);
});

test('in Edit and in Hidden the section headings stick under the block as the table’s names do', async ({
  page,
}) => {
  // docs/UX-SPEC.md §1 and §3 (Sean, 2026-10-18: one rule wherever a section's name heads a
  // list). Length's Edit, then Data's Hidden: its nine specialty units, hidden by the Standard
  // preset, give the page room to scroll a hidden heading up to the head.
  await page.goto('/?a=meter&v=1');
  await ready(page);
  const width = page.viewportSize()!.width;
  await page.setViewportSize({ width, height: 520 });
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('[data-list="shown"]')).toBeVisible();
  // The second section's heading, scrolled to where it would pass under the head: it sits a pixel
  // under the head's edge instead, the first section's pushed up behind.
  await scrollHeadingUnder(page, '[data-list="shown"] > :nth-child(2) [data-section]');
  await expect(page.locator('[data-head][data-stuck]')).toHaveCount(1);
  await expect
    .poll(async () => {
      const edit = await nameUnderHead(page, '[data-list="shown"] [data-section]');
      return edit.boxBottom - edit.first;
    })
    .toBe(1);
  await expectNoA11yViolations(page);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.goto('/?a=byte&v=1');
  await ready(page);
  await page.getByRole('button', { name: /^Hidden/ }).click();
  await expect(page.locator('[data-list="hidden"]')).toBeVisible();
  await scrollHeadingUnder(page, '[data-list="hidden"] > :first-child [data-hidden-section]');
  await expect(page.locator('[data-head][data-stuck]')).toHaveCount(1);
  await expect
    .poll(async () => {
      const list = await nameUnderHead(page, '[data-list="hidden"] [data-hidden-section]');
      return list.boxBottom - list.first;
    })
    .toBe(1);
  await expectNoA11yViolations(page);
});

test('a side panel opened under a stuck head sticks beside it from md, and below md the head comes to the window’s top with the panel under it; a close leaves the head stuck', async ({
  page,
  isMobile,
}) => {
  // docs/UX-SPEC.md §1, the block (Sean, 2026-10-18: the calculator opened at the box's old place,
  // above the window beside the stuck head, or behind it on a phone).
  await page.goto('/?a=mile&v=1');
  await ready(page);
  const headRect = () =>
    page.locator('[data-head]').evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    });
  const boxTop = () =>
    page.locator('[data-plane="box"]').evaluate((el) => el.getBoundingClientRect().top);
  // A short window, so the page has room to scroll past the head on every project.
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 520 });
  await page.evaluate(() => window.scrollTo(0, 300));
  await expect.poll(async () => Math.round((await headRect()).top)).toBe(0);
  await pressTool(page, 'Calculator');
  await expect(page.getByRole('group', { name: 'Calculator' })).toBeVisible();
  const panel = page.locator('[data-side-cell]');
  if (isMobile) {
    // The head at the window's top, the panel under it, in view.
    const head = await headRect();
    const rect = (await panel.boundingBox())!;
    expect(Math.round(head.top)).toBeLessThanOrEqual(1);
    expect(rect.y).toBeGreaterThanOrEqual(head.bottom - 1);
    expect(rect.y).toBeLessThanOrEqual(head.bottom + 17);
    // And the head stays stuck as the page scrolls on, the panel passing under it like the table.
    await page.evaluate(() => window.scrollBy(0, 100));
    await expect.poll(async () => Math.round((await headRect()).top)).toBe(0);
    const after = (await panel.boundingBox())!;
    expect(Math.round(rect.y - after.y)).toBeGreaterThanOrEqual(90);
    // A switch to another panel places the new one under the head too, and closing it leaves the
    // head stuck where it was (Chrome's scroll anchoring would pull the page to the top).
    await pressTool(page, 'Units');
    await expect(page.getByRole('group', { name: 'Units', exact: true })).toBeVisible();
    const units = (await panel.boundingBox())!;
    expect(Math.round((await headRect()).top)).toBe(0);
    expect(units.y).toBeGreaterThanOrEqual((await headRect()).bottom - 1);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('group', { name: 'Units', exact: true })).toHaveCount(0);
    expect(Math.round((await headRect()).top)).toBe(0);
    // By the button's second press as well as by Escape (docs/UX-SPEC.md §1).
    await pressTool(page, 'Calculator');
    await expect(page.getByRole('group', { name: 'Calculator' })).toBeVisible();
    await pressTool(page, 'Calculator');
    await expect(page.getByRole('group', { name: 'Calculator' })).toHaveCount(0);
    expect(Math.round((await headRect()).top)).toBe(0);
    // The head's canvas reaches past the column, so a card's ring passes behind it, not beside it.
    const bleed = await page
      .locator('[data-head]')
      .evaluate((el) => parseFloat(getComputedStyle(el, '::before').left));
    expect(bleed).toBeLessThanOrEqual(-2);
  } else {
    // Level with the box's top, in view, and still there after more scrolling: it sticks with the
    // head.
    const before = (await panel.boundingBox())!;
    expect(Math.abs(before.y - (await boxTop()))).toBeLessThanOrEqual(1);
    expect(before.y).toBeGreaterThanOrEqual(0);
    const scrolled = await page.evaluate(() => {
      window.scrollBy(0, 100);
      return window.scrollY;
    });
    // The page moved, so the panel's stillness below is the sticky's doing.
    expect(scrolled).toBeGreaterThanOrEqual(400);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrolled);
    const after = (await panel.boundingBox())!;
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
    // Closing it by the button's second press leaves the page where it was and the head stuck:
    // focus returns to the button without a scroll of its own (docs/UX-SPEC.md §1).
    await pressTool(page, 'Calculator');
    await expect(page.getByRole('group', { name: 'Calculator' })).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
    expect(Math.round((await headRect()).top)).toBe(0);
  }
});

test('a height: "5\'11" offers feet, inches, Enter takes it, and the pair row writes the total split in the pair’s own marks, its name beside it (ADR 0026)', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  await ready(page);
  await box(page).fill("5'11");
  // The compound names its pair: the one match, its symbol and its name as every match.
  await expect(matches(page).getByRole('option')).toHaveCount(1);
  await expect(matches(page).getByRole('option').first()).toContainText('feet, inches');
  await expect(matches(page).getByRole('option').first()).toContainText('ft in');
  await box(page).press('Enter');
  await expect(page.getByRole('button', { name: 'Remove feet, inches' })).toBeVisible();
  // The chip is every unit's: the symbol, then the name where the box has the room; the
  // placeholder says Number as for any unit (the hundredth pass).
  const chip = page.getByRole('button', { name: 'Unit: feet, inches' });
  await expect(chip.getByText('ft in', { exact: true }).first()).toBeVisible();
  await expect(box(page)).toHaveValue("5'11");
  await expect(box(page)).toHaveAttribute('placeholder', 'Number');
  // No quiet line: the chip and the table say what was read (the ninety-eighth pass).
  await expect(page.locator('[data-read]')).toHaveCount(0);
  // The pair's row sits under Mixed units, its value in the marks people write, its symbol as
  // every row's, and its name in the names' column, a column of its own to the fit, which gives
  // way before the names do: the single units read as before, their names kept.
  await expect(row(page, 'foot-inch')).toContainText('5′ 11.00″');
  await expect(row(page, 'foot-inch').locator('[data-symbol]')).toHaveText('ft in');
  await expect(row(page, 'foot-inch').locator('[data-name]')).toHaveText('feet, inches');
  await expect(row(page, 'foot-inch').locator('[data-name]')).not.toHaveAttribute(
    'data-column',
    'name',
  );
  await expect(row(page, 'inch').locator('[data-name]')).toBeVisible();
  expect(await sectionIds(page)).toEqual(['us', 'metric', 'other', 'mixed']);
  await expect(page.locator('[data-row]').first()).toHaveAttribute('data-row', 'inch');
  await expect(row(page, 'centimeter')).toContainText('180.34');
  await expect(row(page, 'inch')).toContainText('71.00');
  // The URL carries the compound in the pair's words.
  await expect.poll(() => page.evaluate(() => location.search)).toBe('?a=foot-inch&v=5+ft+11+in');
  // A pair row moved into the box comes as its parts, in the marks, which the box reads back.
  await box(page).fill('180 cm');
  await box(page).press('Enter');
  await expect(row(page, 'foot-inch')).toContainText('5′ 10.87″');
  await unitCell(page, 'foot-inch').click();
  await expect(box(page)).toHaveValue('5′ 10.86614173″');
  // The chip keeps its symbol where the long number takes the name's room: never a blank chip
  // (Sean's iPhone, 2026-10-19).
  await expect(chip.getByText('ft in', { exact: true }).first()).toBeVisible();
  await expect(row(page, 'centimeter')).toContainText('180.00');
  // A duration as a stopwatch writes it: 1h30 is 1:30:00.
  await box(page).fill('1h30');
  await box(page).press('Enter');
  await expect(row(page, 'hour-minute-second')).toContainText('1:30:00');
  await expect(row(page, 'minute')).toContainText('90.00');
  // The pair's symbol, the table's widest (h:m:s), never costs the single rows their names: it
  // takes the spare width before the symbols, and gives way before any name (the hundred-and-first
  // and hundred-and-second passes).
  await expect(row(page, 'minute').locator('[data-name]')).toBeVisible();
  // The pair's name never sizes the names' column, the single units' names do: where it has less
  // room than it needs (a phone), it is cut short with an ellipsis, the symbol saying the rest.
  const pairName = row(page, 'hour-minute-second').locator('[data-name]');
  await expect(pairName).toBeVisible();
  await expect(pairName).toHaveText('hours, minutes, seconds');
  if (isMobile) {
    expect(await pairName.evaluate((cell) => cell.scrollWidth > cell.clientWidth)).toBe(true);
  }
  // At 320 px the names give way; the pair's symbol, which never gives way, stands beside its
  // value as before.
  await windowOf(page, 320, 800);
  await expect(row(page, 'minute').locator('[data-name]')).toBeHidden();
  await expect(row(page, 'hour-minute-second').locator('[data-symbol]')).toBeVisible();
  await expect(row(page, 'hour-minute-second').locator('[data-symbol]')).toHaveText('h:m:s');
});

test('a clock names its units: "5:55" offers the time pair, then the paces, Enter takes the pair, and a part of one digit reads as that many (ADR 0026)', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await box(page).fill('5:55');
  const options = matches(page).getByRole('option');
  await expect(options).toHaveCount(3);
  await expect(options.nth(0)).toContainText('hours, minutes, seconds');
  await expect(options.nth(1)).toContainText('min/km');
  await expect(options.nth(2)).toContainText('min/mi');
  await box(page).press('Enter');
  await expect(page.getByRole('button', { name: 'Remove hours, minutes, seconds' })).toBeVisible();
  await expect(box(page)).toHaveValue('5:55');
  await expect(row(page, 'hour-minute-second')).toContainText('5:55:00');
  await expect(row(page, 'minute')).toContainText('355.00');
  // 5:5 is 5:05, never 5 alone with ":5" left over (Sean, 2026-10-20).
  await box(page).fill('5:5');
  await expect(row(page, 'hour-minute-second')).toContainText('5:05:00');
  await expect(row(page, 'minute')).toContainText('305.00');
});
