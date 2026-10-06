import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** The island is server-rendered; typing before React hydrates would be lost, so tests wait for the ready mark. */
async function ready(page: Page) {
  await page.locator('section[data-hydrated]').waitFor();
}

function boxes(page: Page) {
  return {
    first: page.getByRole('combobox', { name: 'First value' }),
    second: page.getByRole('combobox', { name: 'Second value' }),
    back: page.getByRole('button', { name: /Back/ }),
    label: page.locator('[data-category-label]'),
  };
}

test('typing a number and unit highlights the match; Enter locks it and scopes the other box', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const { first, second, label } = boxes(page);

  await first.fill('5 ml');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(page.getByRole('option', { name: /^mL milliliters/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await first.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await expect(first).toHaveValue('5');
  await expect(label).toHaveText('Volume');

  await second.click();
  await expect(page.getByRole('option', { name: /^cup cups$/ })).toBeVisible();
  await expect(page.getByRole('option', { name: /Fahrenheit/ })).toHaveCount(0);

  await page.getByRole('option', { name: /^cup cups$/ }).click();
  await expect(second).toHaveValue('0.02113376419');
  await expect(page).toHaveURL(/a=milliliter&b=us-cup&v=5&s=a/);
});

test('typing in the second box makes it the source', async ({ page }) => {
  await page.goto('/?a=milliliter&b=us-cup&v=5&s=a');
  await ready(page);
  const { first, second } = boxes(page);
  await expect(second).toHaveValue('0.02113376419');

  await second.fill('2');
  await expect(first).toHaveValue('473.176473');
  await expect(page).toHaveURL(/v=2&s=b/);
});

test('an ambiguous symbol shows both meanings instead of guessing', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.fill('oz');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(page.getByRole('option', { name: /ounces Weight/ })).toBeVisible();
  await expect(page.getByRole('option', { name: /fluid ounces Volume/ })).toBeVisible();
});

test('keyboard: arrows and Enter pick a category, then a unit', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first, back, label } = boxes(page);

  await first.click();
  await expect(page.getByRole('option', { name: /^Length$/ })).toBeVisible();
  await expect(back).toHaveCount(0);
  await first.press('ArrowDown');
  await first.press('Enter');
  await expect(page.getByRole('option', { name: /^ft feet$/ })).toBeVisible();
  await expect(back).toBeVisible();
  await expect(label).toHaveText('Length');

  for (let i = 0; i < 6; i += 1) await first.press('ArrowDown');
  await first.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove feet' })).toBeVisible();
});

test('Enter commits the box and closes the list, like clicking out', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.fill('20 c');
  await expect(page.getByRole('listbox')).toBeVisible();
  await first.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove Celsius' })).toBeVisible();
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(first).toBeFocused();
});

test('leaving the field commits an exact match too', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.fill('3 gb');
  await first.press('Tab');
  await expect(page.getByRole('button', { name: 'Remove gigabytes' })).toBeVisible();
  await expect(first).toHaveValue('3');
});

test('the list grows out of the field over the page instead of pushing the other box down', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const { first, second } = boxes(page);

  const before = await second.boundingBox();
  await first.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  const after = await second.boundingBox();
  expect(after?.y).toBe(before?.y);
});

test('the swap control exchanges sides and keeps the typed value exact', async ({ page }) => {
  await page.goto('/?a=mile&b=kilometer&v=1&s=a');
  await ready(page);
  const { first, second } = boxes(page);
  await expect(second).toHaveValue('1.609344');

  await page.getByRole('button', { name: 'Swap sides' }).click();
  await expect(first).toHaveValue('1.609344');
  await expect(second).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Remove kilometers' })).toBeVisible();
});

test('a query with no match in the scoped category widens to every category', async ({ page }) => {
  await page.goto('/?a=milliliter&v=5&s=a');
  await ready(page);
  const { first, second } = boxes(page);

  await second.fill('fahr');
  await page.getByRole('option', { name: /Fahrenheit Temperature/ }).click();

  await expect(page.getByRole('status')).toHaveText('Switched to Temperature');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Remove Fahrenheit' })).toBeVisible();
  await expect(first).toHaveValue('5');
});

test('both boxes can be copied', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only in CI');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?a=mile&b=kilometer&v=2&s=a');
  await ready(page);

  await page.getByRole('button', { name: 'Copy second value' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('3.218688');

  await page.getByRole('button', { name: 'Copy first value' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('2');
});

test('the converter has no WCAG violations with the list open', async ({ page }) => {
  await page.goto('/?a=milliliter&v=5&s=a');
  await ready(page);
  const { second } = boxes(page);
  await second.click();
  await expect(page.getByRole('listbox')).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
});

test('Back and Escape go up to the categories from any unit list', async ({ page }) => {
  await page.goto('/?a=milliliter&v=250&s=a');
  await ready(page);
  const { first, back, label } = boxes(page);

  await page.getByRole('button', { name: 'Change unit: milliliters' }).click();
  await expect(page.getByRole('option', { name: /^L liters$/ })).toBeVisible();
  await expect(back).toBeVisible();
  await expect(label).toHaveText('Volume');
  await back.click();
  await expect(page.getByRole('option', { name: /^Length$/ })).toBeVisible();
  await expect(back).toHaveCount(0);

  await page.getByRole('option', { name: /^Weight$/ }).click();
  await expect(page.getByRole('option', { name: /^kg kilograms$/ })).toBeVisible();
  await expect(label).toHaveText('Weight');
  await first.press('Escape');
  await expect(page.getByRole('option', { name: /^Weight$/ })).toBeVisible();
  await expect(label).toHaveText('Volume');
  await first.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
});

test('with the list closed, Escape clears the unit first when it was the last thing entered', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const { first, label } = boxes(page);

  await first.fill('250 ml');
  await first.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();

  await first.press('Escape');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(page.getByRole('option', { name: /^L liters$/ })).toBeVisible();
  await expect(label).toHaveText('Volume');

  await first.press('Escape');
  await expect(page.getByRole('option', { name: /^Length$/ })).toBeVisible();
  await first.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(label).toHaveText('');
  await expect(first).toHaveValue('250');

  await first.press('Escape');
  await expect(first).toHaveValue('');
});

test('with the list closed, Escape clears the text first when typing was the last thing done', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.fill('250 ml');
  await first.press('Enter');
  await first.pressSequentially('0');
  await expect(first).toHaveValue('2500');
  await expect(page.getByRole('listbox')).toBeVisible();

  await first.press('Escape');
  await expect(page.getByRole('option', { name: /^Length$/ })).toBeVisible();
  await first.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);

  await first.press('Escape');
  await expect(first).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();

  await first.press('Escape');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
});

test('undo drops the unit but keeps the number; redo restores it', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.fill('250 ml');
  await first.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();

  await first.press('Control+z');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toHaveCount(0);
  await expect(first).toHaveValue('250');

  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await expect(first).toHaveValue('250');
});

test('the category label follows the locked unit and clears with it', async ({ page }) => {
  await page.goto('/?a=mile&b=kilometer&v=1&s=a');
  await ready(page);
  const { label } = boxes(page);

  await expect(label).toHaveText('Length');
  await page.getByRole('button', { name: 'Remove miles' }).click();
  await expect(label).toHaveText('Length');
  // Removing a unit refocuses the field, which opens its list inside the remaining category; Escape goes
  // up to the categories, then closes, so the list does not cover the other box on phones.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.getByRole('button', { name: 'Remove kilometers' }).click();
  await expect(label).toHaveText('');
});
