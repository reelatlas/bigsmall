import { expect, test, type Locator, type Page } from '@playwright/test';
import { THEMES } from '../src/lib/themes';
import { ANNOUNCE_MS } from '../src/lib/timing';
import { applyTheme, chooseLayout, MARGIN_MS, ready } from './support';

// The table layout, the default (ADR 0009, ADR 0012, docs/UX-SPEC.md §1, §8, §9): one box, a
// category menu over it, and in the table's place the categories to start from, the category's
// units with their values, or the units a typed query matches. The caret stays in the field while
// a cursor moves through the table. The layout switch and the two-box layout's flows are covered
// here and in converter.spec.ts. Visitors are in the US: their own units come first (ADR 0011).

const box = (page: Page) => page.getByRole('combobox', { name: 'Value', exact: true });
const menu = (page: Page) => page.getByRole('button', { name: /^(Choose a category|Category)/ });
const row = (page: Page, unitId: string) => page.locator(`[data-row="${unitId}"]`);
/** A row's unit cell: what a click takes and the cursor lands on. */
const unitCell = (page: Page, unitId: string) => row(page, unitId).getByRole('gridcell').first();
const rowOrder = (page: Page) =>
  page.locator('[data-row]').evaluateAll((rows) => rows.map((each) => each.dataset['row']));
const tiles = (page: Page) => page.getByRole('listbox', { name: 'Categories' });
const matches = (page: Page) => page.getByRole('listbox', { name: 'Matching units' });
const VOLUME_UNITS = 9;

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
  await expect(page.getByRole('combobox', { name: 'Second value' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Swap sides' })).toHaveCount(0);
  await expect(menu(page)).toHaveText(/Choose a category/);
  await expect(box(page)).toHaveAttribute('placeholder', 'Number or unit');
  await expect(tiles(page).getByRole('option')).toHaveCount(8);

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
  await expect(page.locator('[data-row]')).toHaveCount(VOLUME_UNITS);
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

  // A number, then Enter, goes into the categories; Enter opens one at its first unit.
  await page.keyboard.type('250');
  await box(page).press('Enter');
  await expectCursor(page, 'Length');
  await box(page).press('ArrowRight');
  await box(page).press('ArrowRight');
  await box(page).press('Enter');
  // Nothing is highlighted for you: the caret waits in the field until ↓ moves into the units.
  await expectCursor(page, null);
  await expect(page.locator('[data-row]')).toHaveCount(VOLUME_UNITS);
  await box(page).press('ArrowDown');
  await expectCursor(page, 'teaspoons');
  await box(page).press('ArrowDown');
  await box(page).press('ArrowDown');
  await box(page).press('ArrowDown');
  await expectCursor(page, 'cups');
  await box(page).press('Enter');
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(box(page)).toHaveValue('250');
});

test('a number and a unit list every unit of the category, the box’s own marked', async ({
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
  await expect(table.locator('[data-row]')).toHaveCount(VOLUME_UNITS);
  await expect(row(page, 'liter')).toContainText('0.25');
  // Six significant digits, so rows compare at a glance.
  await expect(row(page, 'us-cup')).toContainText('1.05669');
  await expect(unitCell(page, 'milliliter')).toContainText('in the box');
});

test('a typed unit lists matches from every category, grouped, without values', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await box(page).fill('250 p');
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
  await expect(page.getByRole('button', { name: 'Remove pounds' })).toBeVisible();
  await expect(box(page)).toHaveValue('250');
  await expect(page.getByRole('region', { name: 'Weight' })).toBeVisible();

  // Inside a category, its own matches come first; a click takes any match.
  await box(page).press('End');
  await page.keyboard.type(' p');
  await expect(groups.first()).toHaveAccessibleName('Weight');
  await matches(page)
    .getByRole('option', { name: /^pt pints/ })
    .click();
  await expect(page.getByRole('button', { name: 'Remove pints' })).toBeVisible();
  await expect(box(page)).toHaveValue('250');
  await expect(page.getByRole('region', { name: 'Volume' })).toBeVisible();
});

test('a typed category name opens the category, its units with no unit chosen', async ({
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
});

test('the category menu: the arrows move without choosing, Enter chooses, Escape closes', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=milliliter&v=250&s=a');
  await ready(page);
  await menu(page).click();
  const radios = page.getByRole('group', { name: 'Category' }).getByRole('radio');
  await expect(radios).toHaveCount(8);
  await expect(page.getByRole('radio', { name: 'Volume' })).toBeFocused();
  // Moving through the choices changes nothing until one is chosen.
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: 'Temperature' })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu(page)).toBeFocused();
  await expect(menu(page)).toHaveText(/Volume/);
  await expect(radios).toBeHidden();

  // Enter chooses: the number stays, the unit goes, and the cursor waits on the first unit.
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
});

test('keyboard: the arrows loop through the menu, the field, and every row, from the unit in the box', async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?a=us-cup&v=250&s=a');
  await ready(page);
  await box(page).click();
  // Resting on cups, the arrows go on from its row.
  await box(page).press('ArrowDown');
  await expectCursor(page, 'pints');
  await box(page).press('ArrowUp');
  await box(page).press('ArrowUp');
  await expectCursor(page, 'fluid ounces');
  // Ctrl+C copies the row the cursor is on, at full precision.
  await box(page).press('Control+c');
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1);
  expect(Number(await page.evaluate(() => navigator.clipboard.readText()))).toBeCloseTo(2000, 9);

  // Past the last row the loop reaches the menu; up from it is the last row, down the field.
  for (
    let step = 0;
    step < VOLUME_UNITS && !(await menu(page).evaluate((el) => el === document.activeElement));
    step += 1
  ) {
    await page.keyboard.press('ArrowDown');
  }
  await expect(menu(page)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(box(page)).toBeFocused();
  await expectCursor(page, 'liters');
  // Enter takes it, its value to the box's 10 digits; the cursor rests on it.
  await box(page).press('Enter');
  await expect(box(page)).toHaveValue(/^59\.147059/);
  await expect(page.getByRole('button', { name: 'Remove liters' })).toBeVisible();
  await expectCursor(page, null);
  await menu(page).focus();
  await page.keyboard.press('ArrowDown');
  await expect(box(page)).toBeFocused();
  await expectCursor(page, null);
});

test('Escape steps back: off the table, the typed unit, the number, the unit and category, the page', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=milliliter&v=250&s=a');
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
  await expect(page.locator('[data-row]')).toHaveCount(VOLUME_UNITS);

  await box(page).press('Escape');
  await expect(box(page)).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();

  await box(page).press('Escape');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(menu(page)).toHaveText(/Choose a category/);
  await expect(tiles(page)).toBeVisible();

  await box(page).press('Escape');
  await expect(box(page)).not.toBeFocused();

  // Each step can be undone.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
});

test('typing anywhere lands in the field, after what is there', async ({ page, isMobile }) => {
  test.skip(isMobile, 'typing from anywhere needs a keyboard');
  await page.goto('/?a=milliliter&v=554&s=a');
  await ready(page);
  await menu(page).focus();
  await page.keyboard.type('6');
  await expect(box(page)).toBeFocused();
  await expect(box(page)).toHaveValue('5546');

  await row(page, 'liter').getByRole('button', { name: /^Copy/ }).focus();
  await page.keyboard.type('7');
  await expect(box(page)).toHaveValue('55467');

  // With nothing focused on the page, too; Backspace takes the last character back.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
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
  await page.goto('/?a=milliliter&v=250&s=a');
  await ready(page);
  await page.getByRole('button', { name: 'Remove milliliters' }).click();
  await expect(box(page)).toBeFocused();
  await expect(box(page)).toHaveValue('250');
  await expect(menu(page)).toHaveText(/Volume/);
  await expect(page.locator('[data-row]')).toHaveCount(VOLUME_UNITS);
  await expect(row(page, 'liter')).toContainText('—');

  await page.goto('/?a=milliliter&s=a');
  await ready(page);
  await box(page).click();
  await box(page).press('Backspace');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(page.locator('[data-row]')).toHaveCount(VOLUME_UNITS);
});

test('a row reads the value on the left, then symbol and name on the right, each in its column', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/?a=milliliter&v=250&s=a');
  await ready(page);
  await expect(unitCell(page, 'liter')).toHaveAccessibleName(/^0\.25 L liters/);
  const cells = await page
    .locator('[data-row] > [role="gridcell"]:first-child')
    .evaluateAll((units) =>
      units.map((unit) => {
        const [value, symbol, name] = [...unit.children].map((cell) =>
          cell.getBoundingClientRect(),
        );
        return { valueRight: value!.right, symbolRight: symbol!.right, nameLeft: name!.left };
      }),
    );
  const same = (pick: (cell: (typeof cells)[number]) => number) =>
    new Set(cells.map((cell) => Math.round(pick(cell)))).size;
  expect(same((cell) => cell.valueRight)).toBe(1);
  expect(same((cell) => cell.symbolRight)).toBe(1);
  expect(same((cell) => cell.nameLeft)).toBe(1);
  // The names sit on the right: past the middle of the row on a wide table.
  const card = (await page.getByRole('region', { name: 'Volume' }).boundingBox())!;
  expect(cells[0]!.nameLeft).toBeGreaterThan(card.x + card.width / 2);
});

test('a row moves into the box with its value; undo takes it back', async ({ page }) => {
  await page.goto('/?a=milliliter&b=us-cup&v=250&s=a');
  await ready(page);

  await unitCell(page, 'liter').click();
  await expect(box(page)).toHaveValue('0.25');
  await expect(page.getByRole('button', { name: 'Remove liters' })).toBeVisible();
  await expect(unitCell(page, 'liter')).toContainText('in the box');
  await expect(row(page, 'milliliter')).toContainText('250');
  await expect(row(page, 'us-cup')).toContainText('1.05669');
  await expect(page).toHaveURL(/a=liter&b=us-cup&v=0.25&s=a/);

  await page.keyboard.press('Control+z');
  await expect(box(page)).toHaveValue('250');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
});

test('the second box’s unit is a row like any other, kept for a switch back to two boxes', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&v=250&s=a');
  await ready(page);
  const alone = await rowOrder(page);

  await page.goto('/?a=milliliter&b=us-cup&v=250&s=a');
  await ready(page);
  await expect(page.locator('[data-row]')).toHaveCount(alone.length);
  expect(await rowOrder(page)).toEqual(alone);

  // Moving it into the box gives the second box the box's old unit, as swap does.
  await unitCell(page, 'us-cup').click();
  await expect(box(page)).toHaveValue('1.056688209');
  await page.getByTitle('Two boxes').click();
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Second value' })).not.toHaveValue('');
});

test('a value with no answer says so once; a row too large for a double says so', async ({
  page,
}) => {
  await page.goto('/?a=kilometer&v=1&s=a');
  await ready(page);
  await box(page).fill('1e400');
  await expect(page.getByRole('region', { name: 'Length' })).toContainText('Too large to convert');
  await expect(page.locator('[data-row]')).toHaveCount(0);

  await box(page).fill('1e306');
  const millimeters = row(page, 'millimeter');
  await expect(millimeters).toContainText('Too large');
  await expect(millimeters.getByRole('button', { name: /^Copy/ })).toHaveCount(0);
  await expect(row(page, 'kilometer')).toContainText('1E306');
});

test('the live region says how many units the value is shown in', async ({ page }) => {
  // The same with a second box's unit kept from two boxes: the table names none in particular.
  await page.goto('/?a=milliliter&b=us-cup&v=250&s=a');
  await ready(page);
  await expect(page.locator('[aria-live="polite"]')).toHaveText(
    `250 milliliters in ${VOLUME_UNITS} units of volume`,
    { timeout: ANNOUNCE_MS + MARGIN_MS * 5 },
  );
});

test('the calculator sends its number into the one box with "Use"', async ({ page }) => {
  await page.goto('/?a=milliliter&v=250&s=a');
  await ready(page);
  await page.getByRole('button', { name: 'Calculator' }).click();
  await page.keyboard.type('12*3');
  await page.getByRole('button', { name: /^Use mL$/ }).click();
  await expect(box(page)).toHaveValue('36');
  await expect(page.getByRole('status')).toHaveText('Sent to the value');
  await expect(row(page, 'liter')).toContainText('0.036');
});

test('the calculator takes a column beside the box and table from md, and sits between them below it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  // Three units, so the calculator is far taller than the box and the table together.
  await page.goto('/?a=celsius&v=20&s=a');
  await ready(page);
  const table = page.getByRole('region', { name: 'Temperature' });
  const calculator = page.getByRole('group', { name: 'Calculator' });
  const gapUnderBox = async () => {
    const field = (await box(page).boundingBox())!;
    return (await table.boundingBox())!.y - (field.y + field.height);
  };
  const closed = await gapUnderBox();

  await page.getByRole('button', { name: 'Calculator' }).click();
  const wide = {
    calculator: (await calculator.boundingBox())!,
    table: (await table.boundingBox())!,
    field: (await box(page).boundingBox())!,
    converter: (await page.getByRole('region', { name: 'Unit converter' }).boundingBox())!,
  };
  expect(wide.calculator.x).toBeGreaterThan(wide.table.x + wide.table.width);
  expect(Math.abs(wide.calculator.y - wide.field.y)).toBeLessThan(4);
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
  expect(narrow.calculator.y).toBeGreaterThan((await box(page).boundingBox())!.y);
  expect(narrow.table.y).toBeGreaterThan(narrow.calculator.y + narrow.calculator.height);
  // Flush left, under the menu's edge.
  expect(Math.abs(narrow.calculator.x - narrow.menu.x)).toBeLessThan(4);
});

test('the chip gives up its name before the number shrinks, sooner in one of two boxes', async ({
  page,
}) => {
  // Numbers are set in the system's font, so how many digits fit differs by machine: the test
  // types every length from 1 to 20 digits and checks the rule, not a count.
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?a=milliliter&v=1&s=a');
  await ready(page);
  const name = page
    .getByRole('button', { name: 'Change unit: milliliters' })
    .getByText('milliliters', { exact: true });
  const fontSize = (field: Locator) =>
    field.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const sweep = async (field: Locator) => {
    await field.fill('1');
    const largest = await fontSize(field);
    const seen: { digits: number; named: boolean; full: boolean }[] = [];
    for (let digits = 1; digits <= 20; digits += 1) {
      await field.fill('12345678901234567890'.slice(0, digits));
      seen.push({
        digits,
        named: await name.isVisible(),
        full: (await fontSize(field)) === largest,
      });
    }
    return seen;
  };
  const firstUnnamed = (seen: Awaited<ReturnType<typeof sweep>>) =>
    seen.find((step) => !step.named)?.digits ?? Infinity;

  const table = await sweep(box(page));
  await page.getByTitle('Two boxes').click();
  const two = await sweep(page.getByRole('combobox', { name: 'First value' }));

  for (const step of [...table, ...two]) {
    expect(step.named && !step.full, `${step.digits} digits: name kept, number shrunk`).toBe(false);
  }
  // The wide box keeps the name past the six characters it once gave up at.
  expect(table.some((step) => step.digits > 6 && step.named)).toBe(true);
  // One of two boxes gives it up sooner, and the number then keeps its size for a while.
  expect(firstUnnamed(two)).toBeLessThan(firstUnnamed(table));
  expect(two.some((step) => !step.named && step.full)).toBe(true);
});

test('the switch changes layout, keeps the conversion, and remembers the choice', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&b=us-cup&v=250&s=a');
  await ready(page);
  // The radios are drawn as icons; a pointer clicks their labels, named by their titles.
  await expect(page.getByRole('radio', { name: 'Table' })).toBeChecked();

  await page.getByTitle('Two boxes').click();
  await expect(page.locator('html')).toHaveAttribute('data-layout', 'boxes');
  await expect(page.getByRole('combobox', { name: 'Second value' })).toHaveValue('1.056688209');
  await expect(page.getByRole('button', { name: 'Swap sides' })).toBeVisible();
  await expect(page.locator('[data-row]')).toHaveCount(0);

  await page.reload();
  await ready(page);
  await expect(page.getByRole('radio', { name: 'Two boxes' })).toBeChecked();
  await expect(page.getByRole('combobox', { name: 'Second value' })).toBeVisible();

  await page.getByTitle('Table').click();
  await expect(row(page, 'us-cup')).toContainText('1.05669');
  await expect(page.getByRole('combobox', { name: 'Second value' })).toHaveCount(0);
});

test('a saved layout shows before the island hydrates, so neither flashes the other', async ({
  page,
}) => {
  // Without the island's code the page stays as the server rendered it, both layouts' empty
  // state, styled by the layout the inline script applied.
  await page.route('**/features/converter/Converter.tsx**', (route) => route.abort());
  const second = page.getByRole('combobox', { name: 'Second value' });

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-layout', 'table');
  await expect(box(page)).toBeVisible();
  await expect(menu(page)).toBeVisible();
  await expect(tiles(page)).toBeVisible();
  await expect(second).toBeHidden();

  await chooseLayout(page, 'boxes');
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-layout', 'boxes');
  await expect(second).toBeVisible();
  await expect(page.getByRole('button', { name: 'Swap sides' })).toBeVisible();
  await expect(box(page)).toBeHidden();
  await expect(menu(page)).toBeHidden();
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
  await page.goto('/?a=kilometer-per-hour&b=mile-per-hour&v=100&s=a');
  await ready(page);
  await expect(row(page, 'mile-per-hour')).toBeVisible();
  expect(await overflow()).toBe(0);
  await page.goto('/');
  await ready(page);
  await expect(tiles(page)).toBeVisible();
  expect(await overflow()).toBe(0);
});
