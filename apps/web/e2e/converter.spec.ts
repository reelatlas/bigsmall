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
  };
}

test('typing a number and unit locks the unit and scopes the other box', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first, second } = boxes(page);

  await first.fill('5 ml');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await expect(first).toHaveValue('5');

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
  const { first } = boxes(page);

  await first.click();
  await expect(page.getByRole('option', { name: /^Length$/ })).toBeVisible();
  await first.press('ArrowDown');
  await first.press('Enter');
  await expect(page.getByRole('option', { name: /^ft feet$/ })).toBeVisible();

  for (let i = 0; i < 6; i += 1) await first.press('ArrowDown');
  await first.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove feet' })).toBeVisible();
});

test('a space or Enter locks an exact match that could still be extended', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.fill('20 c');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await first.press(' ');
  await expect(page.getByRole('button', { name: 'Remove Celsius' })).toBeVisible();
  await expect(first).toHaveValue('20');
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

test('picking a unit from another category clears the first box and says so', async ({ page }) => {
  await page.goto('/?a=milliliter&v=5&s=a');
  await ready(page);
  const { first, second } = boxes(page);

  await second.fill('f');
  await page.getByRole('button', { name: 'Search all categories' }).click();
  await page.getByRole('option', { name: /Fahrenheit Temperature/ }).click();

  await expect(page.getByRole('status')).toHaveText('Switched to Temperature');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Remove Fahrenheit' })).toBeVisible();
  await expect(first).toHaveValue('5');
});

test('the result can be copied', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only in CI');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?a=mile&b=kilometer&v=2&s=a');
  await ready(page);

  await page.getByRole('button', { name: 'Copy result' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toBe('3.218688');
});

test('the converter has no WCAG violations with the panel open', async ({ page }) => {
  await page.goto('/?a=milliliter&v=5&s=a');
  await ready(page);
  const { second } = boxes(page);
  await second.click();
  await expect(page.getByRole('listbox')).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
});

test('Escape walks back one step at a time: unit, panel, text', async ({ page }) => {
  await page.goto('/?a=milliliter&v=250&s=a');
  await ready(page);
  const { first } = boxes(page);

  await first.click();
  await first.press('Escape');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(page.getByRole('option', { name: /^L liters$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();

  await first.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(first).toHaveValue('250');

  await first.press('Escape');
  await expect(first).toHaveValue('');
});

test('a Back control sits at the top of an expanded category and Escape does the same', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.click();
  await page.getByRole('option', { name: /^Length$/ }).click();
  await expect(page.getByRole('option', { name: /^m meters$/ })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('option', { name: /^Length$/ })).toBeVisible();

  await page.getByRole('option', { name: /^Weight$/ }).click();
  await expect(page.getByRole('option', { name: /^kg kilograms$/ })).toBeVisible();
  await first.press('Escape');
  await expect(page.getByRole('option', { name: /^Weight$/ })).toBeVisible();
});

test('undo drops the unit but keeps the number; redo restores it', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.fill('250 ml');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();

  await first.press('Control+z');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toHaveCount(0);
  await expect(first).toHaveValue('250');

  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await expect(first).toHaveValue('250');
});

test('clicking the chip opens the unit list for that category', async ({ page }) => {
  await page.goto('/?a=milliliter&v=250&s=a');
  await ready(page);
  const { first } = boxes(page);

  await page.getByRole('button', { name: 'Change unit: milliliters' }).click();
  await page.getByRole('option', { name: /^L liters$/ }).click();
  await expect(page.getByRole('button', { name: 'Remove liters' })).toBeVisible();
  await expect(first).toHaveValue('250');
});
