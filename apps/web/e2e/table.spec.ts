import { expect, test, type Page } from '@playwright/test';
import { ANNOUNCE_MS } from '../src/lib/timing';
import { chooseLayout, MARGIN_MS, ready } from './support';

// The table layout, the default (ADR 0009, docs/UX-SPEC.md §1): one box, and its value in every
// unit of its category. The layout switch and the two-box layout's flows are covered here and in
// converter.spec.ts.

const box = (page: Page) => page.getByRole('combobox', { name: 'Value' });
const row = (page: Page, unitId: string) =>
  page.locator(`li[data-row="${unitId}"]:not([data-headline])`);
const headline = (page: Page) => page.locator('li[data-headline]');
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

  const table = page.getByRole('region', { name: 'Volume' });
  await expect(table).toBeVisible();
  await expect(table.locator('li[data-row]')).toHaveCount(VOLUME_UNITS);
  await expect(headline(page)).toHaveCount(0);
  await expect(row(page, 'liter')).toContainText('0.25');
  // Six significant digits, so rows compare at a glance.
  await expect(row(page, 'us-cup')).toContainText('1.05669');
  const own = row(page, 'milliliter').getByRole('button').first();
  await expect(own).toHaveAttribute('aria-disabled', 'true');
  await expect(own).toContainText('in the box');
});

test('a row moves into the box with its value; the headline stays; undo takes it back', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&b=us-cup&v=250&s=a');
  await ready(page);
  await expect(headline(page)).toContainText('cups');
  await expect(headline(page)).toContainText('1.05669');

  await row(page, 'liter').getByRole('button').first().click();
  await expect(box(page)).toHaveValue('0.25');
  await expect(page.getByRole('button', { name: 'Remove liters' })).toBeVisible();
  await expect(headline(page)).toContainText('1.05669');
  await expect(row(page, 'liter').getByRole('button').first()).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(row(page, 'milliliter')).toContainText('250');
  await expect(page).toHaveURL(/a=liter&b=us-cup&v=0.25&s=a/);

  await page.keyboard.press('Control+z');
  await expect(box(page)).toHaveValue('250');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
});

test('the headline moves into the box, and the box’s old unit takes its place', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&b=us-cup&v=250&s=a');
  await ready(page);

  await headline(page).getByRole('button').first().click();
  await expect(box(page)).toHaveValue('1.056688209');
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(headline(page)).toContainText('milliliters');
  await expect(headline(page)).toContainText('250');
  // Focus stays on the headline, now the box's old unit, as it would on a swap button.
  await expect(headline(page).getByRole('button').first()).toBeFocused();
});

test('keyboard: the rows are one Tab stop, the arrows move, Enter moves a unit in, Ctrl+C copies', async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?a=milliliter&b=us-cup&v=250&s=a');
  await ready(page);
  const buttons = page.locator('li[data-row] > button:first-child');

  await box(page).focus();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
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
  await page.keyboard.press('Control+c');
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^1\.0566882/);

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
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

test('the live region names the headline, or how many units the value is shown in', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&b=us-cup&v=250&s=a');
  await ready(page);
  const live = page.locator('[aria-live="polite"]');
  await expect(live).toHaveText('250 milliliters is 1.05669 cups', {
    timeout: ANNOUNCE_MS + MARGIN_MS * 5,
  });

  await page.goto('/?a=milliliter&v=250&s=a');
  await ready(page);
  await expect(live).toHaveText(`250 milliliters in ${VOLUME_UNITS} units of volume`, {
    timeout: ANNOUNCE_MS + MARGIN_MS * 5,
  });
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
  await expect(headline(page)).toContainText('cups');
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
  await expect(headline(page)).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
