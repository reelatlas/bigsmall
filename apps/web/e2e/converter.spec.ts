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
    back: page.getByRole('option', { name: 'Back to categories' }),
    /** The category label under each box; only the box the conversion is anchored on shows it. */
    labelA: page.locator('[data-category-label="a"]'),
    labelB: page.locator('[data-category-label="b"]'),
    /** The category an open list is inside, shown on its Back row. */
    scope: page.locator('[data-scope-name]'),
  };
}

test('typing a number and unit highlights the match; Enter locks it and scopes the other box', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const { first, second, labelA, labelB } = boxes(page);

  await first.fill('5 ml');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(page.getByRole('option', { name: /^milliliters Volume mL$/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await first.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await expect(first).toHaveValue('5');
  await expect(labelA).toHaveText('Volume');
  await expect(labelB).toHaveText('');

  await second.click();
  await expect(page.getByRole('option', { name: /^cups cup$/ })).toBeVisible();
  await expect(page.getByRole('option', { name: /Fahrenheit/ })).toHaveCount(0);

  await page.getByRole('option', { name: /^cups cup$/ }).click();
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
  const { first, back, labelA, scope } = boxes(page);

  await first.click();
  await expect(page.getByRole('option', { name: /^Length$/ })).toBeVisible();
  await expect(back).toHaveCount(0);
  await first.press('ArrowDown');
  await first.press('Enter');
  await expect(page.getByRole('option', { name: /^feet ft$/ })).toBeVisible();
  await expect(back).toBeVisible();
  await expect(scope).toHaveText('Length');
  await expect(labelA).toHaveText('');

  // Down from nothing skips the Back row: six presses land on feet, the sixth unit.
  for (let i = 0; i < 6; i += 1) await first.press('ArrowDown');
  await first.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove feet' })).toBeVisible();
  await expect(labelA).toHaveText('Length');
});

test('the arrow keys reach the Back row, and Enter on it goes back', async ({ page }) => {
  await page.goto('/?a=milliliter&v=250&s=a');
  await ready(page);
  const { first, back } = boxes(page);

  await first.click();
  await expect(back).toBeVisible();
  await first.press('ArrowDown');
  await expect(page.getByRole('option', { name: /^milliliters mL$/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await first.press('ArrowUp');
  await expect(back).toHaveAttribute('aria-selected', 'true');
  await expect(first).toHaveAttribute('aria-activedescendant', (await back.getAttribute('id'))!);
  await first.press('Enter');
  await expect(page.getByRole('option', { name: /^Length$/ })).toBeVisible();
  await expect(back).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();

  // Down from the last row wraps to Back too. The category is picked with the keyboard so the
  // mouse pointer is not left over the list, where hovering would move the highlight.
  for (let i = 0; i < 3; i += 1) await first.press('ArrowDown');
  await expect(page.getByRole('option', { name: /^Volume$/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await first.press('Enter');
  await expect(back).toBeVisible();
  await first.press('ArrowUp');
  await first.press('ArrowDown');
  await expect(back).toHaveAttribute('aria-selected', 'true');
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

test('Tab goes from the first box straight to the second, then to swap', async ({ page }) => {
  await page.goto('/?a=milliliter&b=us-cup&v=250&s=a');
  await ready(page);
  const { first, second } = boxes(page);

  await first.click();
  await first.press('Tab');
  await expect(second).toBeFocused();
  await second.press('Tab');
  await expect(page.getByRole('button', { name: 'Swap sides' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(second).toBeFocused();
  await second.press('Shift+Tab');
  await expect(first).toBeFocused();
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

  // The label moves to the box that switched the category and simply names the new one.
  await expect(boxes(page).labelB).toHaveText('Temperature');
  await expect(boxes(page).labelA).toHaveText('');
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
  const { first, back, labelA, scope } = boxes(page);

  await page.getByRole('button', { name: 'Change unit: milliliters' }).click();
  await expect(page.getByRole('option', { name: /^liters L$/ })).toBeVisible();
  await expect(back).toBeVisible();
  await expect(scope).toHaveText('Volume');
  await back.click();
  await expect(page.getByRole('option', { name: /^Length$/ })).toBeVisible();
  await expect(back).toHaveCount(0);

  // Browsing another category names it on the Back row; the label keeps the locked category.
  await page.getByRole('option', { name: /^Weight$/ }).click();
  await expect(page.getByRole('option', { name: /^kilograms kg$/ })).toBeVisible();
  await expect(scope).toHaveText('Weight');
  await expect(labelA).toHaveText('Volume');
  await first.press('Escape');
  await expect(page.getByRole('option', { name: /^Weight$/ })).toBeVisible();
  await first.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
});

test('with the list closed, Escape clears the unit first when it was the last thing entered', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const { first, labelA, scope } = boxes(page);

  await first.fill('250 ml');
  await first.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();

  await first.press('Escape');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(page.getByRole('option', { name: /^liters L$/ })).toBeVisible();
  await expect(scope).toHaveText('Volume');
  await expect(labelA).toHaveText('');

  await first.press('Escape');
  await expect(page.getByRole('option', { name: /^Length$/ })).toBeVisible();
  await first.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(first).toHaveValue('250');

  await first.press('Escape');
  await expect(first).toHaveValue('');
});

test('with the list closed, Escape takes back the typing done after the lock, then the unit', async ({
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

  // The "0" was its own chunk of typing, so one Escape takes back just that.
  await first.press('Escape');
  await expect(first).toHaveValue('250');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();

  await first.press('Escape');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(page.getByRole('listbox')).toBeVisible();
  await first.press('Escape');
  await first.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await first.press('Escape');
  await expect(first).toHaveValue('');
});

test('typing in bursts makes separate steps for Escape and for undo', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.pressSequentially('25');
  await page.waitForTimeout(900);
  await first.pressSequentially('0');
  await expect(first).toHaveValue('250');
  await first.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);

  await first.press('Escape');
  await expect(first).toHaveValue('25');
  await first.press('Escape');
  await expect(first).toHaveValue('');

  await first.press('Control+z');
  await expect(first).toHaveValue('25');
  await first.press('Control+z');
  await expect(first).toHaveValue('250');
  await first.press('Control+z');
  await expect(first).toHaveValue('25');
});

test('a space splits the number from the unit text, so Escape keeps the number', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.pressSequentially('5 ml');
  await expect(page.getByRole('option', { name: /^milliliters Volume mL$/ })).toBeVisible();
  await first.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await first.press('Escape');
  await expect(first).toHaveValue('5');
});

test('a long number steps down in size and stays on one line; a result shows its exponent in bold', async ({
  page,
}) => {
  await page.goto('/?a=kilometer&b=millimeter&v=1&s=a');
  await ready(page);
  const { first, second } = boxes(page);
  const fontSize = (box: typeof first) =>
    box.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

  const short = await fontSize(first);
  await first.fill('123456789012345678');
  await expect(second).toHaveValue('1.23456789E23');
  expect(await fontSize(first)).toBeLessThan(short);
  const fits = await first.evaluate((el) => el.scrollWidth <= el.clientWidth);
  expect(fits).toBe(true);

  await expect(page.locator('[data-marker]')).toHaveText('E');
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

test('the category label sits under the box that drives the conversion', async ({ page }) => {
  await page.goto('/?a=milliliter&b=us-cup&v=5&s=a');
  await ready(page);
  const { first, second, labelA, labelB } = boxes(page);

  await expect(labelA).toHaveText('Volume');
  await expect(labelB).toHaveText('');
  const box = await first.boundingBox();
  const label = await labelA.boundingBox();
  expect(label!.y).toBeGreaterThan(box!.y + box!.height - 1);

  await second.fill('2');
  await expect(labelB).toHaveText('Volume');
  await expect(labelA).toHaveText('');

  // In both boxes the label starts where the value starts, right under what was typed.
  const textLeft = await labelB.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect().left;
  });
  const valueLeft = (await second.boundingBox())!.x;
  expect(Math.abs(textLeft - valueLeft)).toBeLessThan(2);
});

test('before any number, the box that got its unit first keeps the label', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first, second, labelA, labelB } = boxes(page);

  await second.fill('ml');
  await second.press('Enter');
  await expect(labelB).toHaveText('Volume');
  await first.fill('cup');
  await first.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove cups' })).toBeVisible();
  await expect(labelB).toHaveText('Volume');
  await expect(labelA).toHaveText('');
});

test('the category label follows the locked unit and clears with it', async ({ page }) => {
  await page.goto('/?a=mile&b=kilometer&v=1&s=a');
  await ready(page);
  const { labelA, labelB } = boxes(page);

  await expect(labelA).toHaveText('Length');
  // The first box keeps its number but loses its unit, so the category now comes from the second.
  await page.getByRole('button', { name: 'Remove miles' }).click();
  await expect(labelB).toHaveText('Length');
  await expect(labelA).toHaveText('');
  // Removing a unit refocuses the field, which opens its list inside the remaining category; Escape goes
  // up to the categories, then closes, so the list does not cover the other box on phones.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.getByRole('button', { name: 'Remove kilometers' }).click();
  await expect(labelA).toHaveText('');
  await expect(labelB).toHaveText('');
});

test('a value too large or too small to convert says so instead of showing 0', async ({ page }) => {
  await page.goto('/?a=kilometer&b=millimeter&v=1&s=a');
  await ready(page);
  const { first, second } = boxes(page);

  await first.fill('1e308');
  const message = page.getByText('Too large to convert');
  await expect(message).toBeVisible();
  // It shrinks like a long number instead of being cut off, on phones too.
  expect(await message.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(second).toHaveValue('');
  await expect(second).toHaveAttribute('placeholder', '');
  await expect(page.getByRole('button', { name: 'Copy second value' })).toHaveCount(0);

  await first.fill('1e400');
  await expect(page.getByText('Too large to convert')).toBeVisible();

  await page.goto('/?a=millimeter&b=kilometer&v=1&s=a');
  await ready(page);
  await first.fill('1e-320');
  await expect(page.getByText('Too small to convert')).toBeVisible();
  await first.fill('2');
  await expect(page.getByText(/Too (large|small) to convert/)).toHaveCount(0);
  await expect(second).toHaveValue('0.000002');
});

test('placeholders show examples, then units from the category the other box chose', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const { first, second } = boxes(page);

  await expect(first).toHaveAttribute('placeholder', '5 ml, feet, °F…');
  await expect(second).toHaveAttribute('placeholder', '2 kg, inches, speed…');
  await first.fill('5 ml');
  await first.press('Enter');
  await expect(second).toHaveAttribute('placeholder', 'L, tsp, tbsp…');
});

test('the letters a query matches are set heavier in the list', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.fill('me');
  const meters = page.getByRole('option', { name: /^meters Length m$/ });
  await expect(meters.locator('[data-match]')).toHaveText('me');
  const kilometers = page.getByRole('option', { name: /^kilometers Length km$/ });
  await expect(kilometers.locator('[data-match]')).toHaveText('me');
  const weight = await meters
    .locator('[data-match]')
    .evaluate((el) => Number(getComputedStyle(el).fontWeight));
  expect(weight).toBeGreaterThanOrEqual(600);
});

test('clear all empties both boxes, and undo brings them back', async ({ page }) => {
  await page.goto('/?a=mile&b=kilometer&v=1&s=a');
  await ready(page);
  const { first, second } = boxes(page);
  const clear = page.getByRole('button', { name: 'Clear all' });

  await clear.click();
  await expect(first).toHaveValue('');
  await expect(second).toHaveValue('');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(first).toBeFocused();
  await expect(clear).toBeDisabled();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('button', { name: 'Remove miles' })).toBeVisible();
  await expect(first).toHaveValue('1');
  await expect(second).toHaveValue('1.609344');
});

test('the hint sits above the boxes', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const hint = page.getByText(
    'Type a number, unit, or both. Once each box has a unit, typing in one updates the other.',
  );
  const hintBox = await hint.boundingBox();
  const fieldBox = await boxes(page).first.boundingBox();
  expect(hintBox!.y + hintBox!.height).toBeLessThanOrEqual(fieldBox!.y);
});
