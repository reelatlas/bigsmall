import { expect, test, type Page } from '@playwright/test';
import { ANNOUNCE_MS } from '../src/lib/timing';
import { chooseLayout, MARGIN_MS, ready } from './support';

// The table layout, the default (ADR 0009, docs/UX-SPEC.md §1): one box, and its value in every
// unit of its category. The layout switch and the two-box layout's flows are covered here and in
// converter.spec.ts.

const box = (page: Page) => page.getByRole('combobox', { name: 'Value' });
const row = (page: Page, unitId: string) => page.locator(`li[data-row="${unitId}"]`);
const rowOrder = (page: Page) =>
  page.locator('li[data-row]').evaluateAll((rows) => rows.map((li) => li.dataset['row']));
const label = (page: Page) => page.locator('[data-category-label]');
const VOLUME_UNITS = 9;

test('a number and a unit list every unit of the category, the box’s own marked', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await expect(page.getByRole('combobox', { name: 'Second value' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Swap sides' })).toHaveCount(0);
  await expect(
    page.getByText('Type a number and a unit to see it in every unit of its kind.', {
      exact: false,
    }),
  ).toBeVisible();

  await box(page).fill('250 ml');
  await box(page).press('Enter');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  // Enter leaves the caret in the box: there is no second box to move on to.
  await expect(box(page)).toBeFocused();

  // The category label names the table from over the box, where it sits with two boxes.
  await expect(label(page)).toHaveText('Volume');
  const placed = (await label(page).boundingBox())!;
  expect(placed.y + placed.height).toBeLessThan((await box(page).boundingBox())!.y);

  const table = page.getByRole('region', { name: 'Volume' });
  await expect(table).toBeVisible();
  await expect(table.locator('li[data-row]')).toHaveCount(VOLUME_UNITS);
  await expect(row(page, 'liter')).toContainText('0.25');
  // Six significant digits, so rows compare at a glance.
  await expect(row(page, 'us-cup')).toContainText('1.05669');
  const own = row(page, 'milliliter').getByRole('button').first();
  await expect(own).toHaveAttribute('aria-disabled', 'true');
  await expect(own).toContainText('in the box');
});

test('the list keeps the rows in view: closed on focus and while typing a number, open on request', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&v=250&s=a');
  await ready(page);
  const list = page.getByRole('listbox');

  await box(page).click();
  await expect(box(page)).toBeFocused();
  await expect(list).toHaveCount(0);
  // A number, a half-typed one (a sign, an exponent on its way), or a sum: still closed.
  for (const text of ['300', '-', '-3', '1e', '1e-', '1e-3', '6*3']) {
    await box(page).fill(text);
    await expect(list, text).toHaveCount(0);
  }
  await expect(row(page, 'liter')).toContainText('0.018');

  // Letters reach a unit: the list opens on the best match, and closes again with them gone.
  await box(page).fill('300 cu');
  await expect(page.getByRole('option', { name: /^cups cup$/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await box(page).fill('300');
  await expect(list).toHaveCount(0);

  // Enter opens it and closes it, as in a box with two; so do the arrow keys and the chip.
  await box(page).press('Enter');
  await expect(list).toBeVisible();
  await box(page).press('Enter');
  await expect(list).toHaveCount(0);
  await box(page).press('ArrowDown');
  await expect(list).toBeVisible();
  await box(page).press('Escape');
  await box(page).press('Escape');
  await expect(list).toHaveCount(0);
  await page.getByRole('button', { name: 'Change unit: milliliters' }).click();
  await expect(list).toBeVisible();
});

test('a row moves into the box with its value; undo takes it back', async ({ page }) => {
  await page.goto('/?a=milliliter&b=us-cup&v=250&s=a');
  await ready(page);

  await row(page, 'liter').getByRole('button').first().click();
  await expect(box(page)).toHaveValue('0.25');
  await expect(page.getByRole('button', { name: 'Remove liters' })).toBeVisible();
  await expect(row(page, 'liter').getByRole('button').first()).toHaveAttribute(
    'aria-disabled',
    'true',
  );
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
  await expect(page.locator('li[data-row]')).toHaveCount(alone.length);
  expect(await rowOrder(page)).toEqual(alone);

  // Moving it into the box gives the second box the box's old unit, as swap does.
  await row(page, 'us-cup').getByRole('button').first().click();
  await expect(box(page)).toHaveValue('1.056688209');
  await page.getByTitle('Two boxes').click();
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Second value' })).not.toHaveValue('');
});

test('keyboard: the rows are one Tab stop, the arrows move, Enter moves a unit in, Ctrl+C copies', async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?a=milliliter&v=250&s=a');
  await ready(page);
  const buttons = page.locator('li[data-row] > button:first-child');

  // Focus leaves the list closed in the table layout, so Tab goes straight on to the rows.
  await box(page).focus();
  await page.keyboard.press('Tab');
  await expect(buttons.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await expect(buttons.last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(buttons.first()).toBeFocused();
  // One stop: Tab leaves the table rather than walking its rows.
  await page.keyboard.press('Tab');
  await expect(page.locator('li[data-row] button:focus')).toHaveCount(0);

  await page.keyboard.press('Shift+Tab');
  await expect(buttons.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(row(page, 'liter').getByRole('button').first()).toBeFocused();
  await page.keyboard.press('Control+c');
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('0.25');

  await page.keyboard.press('Enter');
  await expect(box(page)).toHaveValue('0.25');
});

test('a value with no answer says so once; a row too large for a double says so', async ({
  page,
}) => {
  await page.goto('/?a=kilometer&v=1&s=a');
  await ready(page);
  await box(page).fill('1e400');
  await expect(page.getByRole('region', { name: 'Length' })).toContainText('Too large to convert');
  await expect(page.locator('li[data-row]')).toHaveCount(0);

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
    field: (await box(page).boundingBox())!,
  };
  expect(narrow.calculator.y).toBeGreaterThan(narrow.field.y + narrow.field.height);
  expect(narrow.table.y).toBeGreaterThan(narrow.calculator.y + narrow.calculator.height);
  expect(Math.abs(narrow.calculator.x - (await label(page).boundingBox())!.x)).toBeLessThan(1);
});

test('in the wider box the chip keeps its name beside a long number; two boxes give it up first', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?a=milliliter&v=1&s=a');
  await ready(page);
  const name = page
    .getByRole('button', { name: 'Change unit: milliliters' })
    .getByText('milliliters', { exact: true });
  const fontSize = (field: ReturnType<typeof box>) =>
    field.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const largest = await fontSize(box(page));

  await box(page).fill('1234567890123');
  await expect(name).toBeVisible();
  await expect.poll(() => fontSize(box(page))).toBe(largest);

  // Each of two boxes is narrower: the name gives way first, so the number keeps its size.
  await page.getByTitle('Two boxes').click();
  await expect(name).toBeHidden();
  const first = page.getByRole('combobox', { name: 'First value' });
  await expect(first).toHaveValue('1234567890123');
  await expect.poll(() => fontSize(first)).toBe(largest);
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
  await expect(page.locator('li[data-row]')).toHaveCount(0);

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
  // Without the island's code the page stays as the server rendered it, styled by the layout
  // the inline script applied.
  await page.route('**/features/converter/Converter.tsx**', (route) => route.abort());
  const second = page.getByRole('combobox', { name: 'Second value' });

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-layout', 'table');
  await expect(page.getByRole('combobox', { name: 'First value' })).toBeVisible();
  await expect(second).toBeHidden();

  await chooseLayout(page, 'boxes');
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-layout', 'boxes');
  await expect(second).toBeVisible();
  await expect(page.getByRole('button', { name: 'Swap sides' })).toBeVisible();
});

test('at 320 px the rows fit without scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/?a=kilometer-per-hour&b=mile-per-hour&v=100&s=a');
  await ready(page);
  await expect(row(page, 'mile-per-hour')).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
