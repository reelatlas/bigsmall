import { expect, test, type Locator, type Page } from '@playwright/test';
import { COPIED_MS, TYPING_CHUNK_MS } from '../src/lib/timing';
import { expectNoA11yViolations, ready } from './support';

/** Press ArrowDown until `option` is the highlighted row, so tests do not hard-code list order. */
async function arrowTo(field: Locator, option: Locator) {
  for (let step = 0; step < 25; step += 1) {
    if ((await option.getAttribute('aria-selected')) === 'true') return;
    await field.press('ArrowDown');
  }
  await expect(option).toHaveAttribute('aria-selected', 'true');
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

  // Down from nothing skips the Back row and goes to the first unit.
  await first.press('ArrowDown');
  await expect(page.getByRole('option', { name: /^meters m$/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await arrowTo(first, page.getByRole('option', { name: /^feet ft$/ }));
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
  // Back lands on the category it came from, so Enter would go straight back in.
  await expect(page.getByRole('option', { name: /^Volume$/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  // Down from the last row wraps to Back too. The category is picked with the keyboard so the
  // mouse pointer is not left over the list, where hovering would move the highlight.
  await arrowTo(first, page.getByRole('option', { name: /^Volume$/ }));
  await first.press('Enter');
  await expect(back).toBeVisible();
  await first.press('ArrowUp');
  await first.press('ArrowDown');
  await expect(back).toHaveAttribute('aria-selected', 'true');
});

test('Enter commits the box and closes the list, keeping focus', async ({ page }) => {
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

test('Tab and clicking away never commit; back in the box, Enter takes the match', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const { first, second } = boxes(page);
  const chips = page.getByRole('button', { name: /^Remove/ });

  // Even an exact match stays as typed when Tab moves on.
  await first.fill('3 gb');
  await first.press('Tab');
  await expect(second).toBeFocused();
  await expect(chips).toHaveCount(0);
  await expect(first).toHaveValue('3 gb');

  await second.fill('kilom');
  await page.getByRole('heading', { level: 1 }).click();
  await expect(chips).toHaveCount(0);
  await expect(second).toHaveValue('kilom');

  await first.focus();
  await expect(page.getByRole('option', { name: /^gigabytes/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await first.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove gigabytes' })).toBeVisible();
  await expect(first).toHaveValue('3');
});

test('picking a category from a typed word drops the word, in either box', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { second, back, scope } = boxes(page);

  await second.fill('vol');
  await expect(page.getByRole('option', { name: /^Volume$/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await second.press('Enter');
  await expect(back).toBeVisible();
  await expect(scope).toHaveText('Volume');
  await expect(second).toHaveValue('');
  await expect(page.getByRole('option', { name: /^milliliters mL$/ })).toBeVisible();
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

test('both boxes can be copied, and the copy confirms with a check', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?a=mile&b=kilometer&v=2&s=a');
  await ready(page);
  const copySecond = page.getByRole('button', { name: 'Copy second value' });
  const copyFirst = page.getByRole('button', { name: 'Copy first value' });
  const checks = page.locator('[data-copied]');

  await copySecond.click();
  await expect(copySecond.locator('[data-copied]')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('3.218688');

  // The check moves to whichever box was copied last.
  await copyFirst.click();
  await expect(copyFirst.locator('[data-copied]')).toBeVisible();
  await expect(checks).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('2');

  // It stays while the mouse rests on the button and reverts once the mouse leaves.
  await page.waitForTimeout(COPIED_MS + 200);
  await expect(checks).toHaveCount(1);
  await page.mouse.move(0, 0);
  await expect(checks).toHaveCount(0);
});

test('copy link copies the current conversion and confirms with a check', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?a=mile&b=kilometer&v=2&s=a');
  await ready(page);
  const { first } = boxes(page);
  const copyLink = page.getByRole('button', { name: 'Copy link' });

  // Typed just before the click, so the address bar may not have caught up; the link has.
  await first.fill('3');
  await copyLink.click();
  await expect(copyLink.locator('[data-copied]')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Link copied' })).toHaveCount(1);
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(link).search).toBe('?a=mile&b=kilometer&v=3&s=a');
});

test('the converter has no WCAG violations with the list open', async ({ page }) => {
  await page.goto('/?a=milliliter&v=5&s=a');
  await ready(page);
  const { second } = boxes(page);
  await second.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await expectNoA11yViolations(page);
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
  await expect(page.getByRole('option', { name: /^Volume$/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  // Browsing another category names it on the Back row; the label keeps the locked category.
  await page.getByRole('option', { name: /^Weight$/ }).click();
  await expect(page.getByRole('option', { name: /^kilograms kg$/ })).toBeVisible();
  await expect(scope).toHaveText('Weight');
  await expect(labelA).toHaveText('Volume');
  await first.press('Escape');
  await expect(page.getByRole('option', { name: /^Weight$/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
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
  await page.waitForTimeout(TYPING_CHUNK_MS + 200);
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

test('the hint has a line of its own, and the toolbar sits under it, over the boxes', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const hint = page.getByText(
    'Type a number, unit, or both. Once each box has a unit, typing in one updates the other.',
  );
  const hintBox = (await hint.boundingBox())!;
  const toolbar = (await page.getByRole('button', { name: 'Undo' }).boundingBox())!;
  const fieldBox = (await boxes(page).first.boundingBox())!;
  expect(hintBox.y + hintBox.height).toBeLessThanOrEqual(toolbar.y);
  expect(toolbar.y + toolbar.height).toBeLessThanOrEqual(fieldBox.y);
});

test('Backspace on an empty box removes its unit and lists that category', async ({ page }) => {
  await page.goto('/?a=milliliter&v=5&s=a');
  await ready(page);
  const { first, scope } = boxes(page);

  await first.click();
  await first.press('End');
  await first.press('Backspace');
  await expect(first).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await first.press('Backspace');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(scope).toHaveText('Volume');
});

test('Ctrl+Y and Ctrl+Shift+Z both redo', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.fill('250 ml');
  await first.press('Enter');
  await first.press('Control+z');
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await first.press('Control+y');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await first.press('Control+z');
  await first.press('Control+Shift+z');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
});

test('a query that matches nothing says so and offers the categories', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const { first } = boxes(page);

  await first.fill('xyzzy');
  await expect(page.getByText('No unit matches “xyzzy”. Try ml, feet, or °F.')).toBeVisible();
  await expect(page.getByRole('option', { name: /^Length$/ })).toBeVisible();
});

test('the chip collapses to its symbol while an out-of-range message needs the room', async ({
  page,
}) => {
  // A short result ("1,000") leaves the chip at full width until the message needs the room.
  await page.goto('/?a=kilometer&b=meter&v=1&s=a');
  await ready(page);
  const { first } = boxes(page);
  const chip = page.getByRole('button', { name: 'Change unit: meters' });

  // The name, then the symbol, the way a list row reads.
  await expect(chip).toHaveText('metersm');
  await first.fill('1e308');
  await expect(page.getByText('Too large to convert')).toBeVisible();
  await expect(chip).toHaveText('m');
});

test('the calculator holds the keyboard, cycles Enter targets with Tab, and steps back with Escape', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&b=liter&v=1&s=a');
  await ready(page);
  const { first, second } = boxes(page);
  const toggle = page.getByRole('button', { name: 'Calculator' });
  const calculator = page.getByRole('group', { name: 'Calculator' });
  const key = (name: string) => calculator.getByRole('button', { name, exact: true });
  const entry = calculator.locator('[data-entry]');
  const useIn = (ordinal: string) =>
    calculator.getByRole('button', { name: new RegExp(`^Use in ${ordinal}`) });
  const close = calculator.getByRole('button', { name: 'Close calculator' });

  // Opening puts focus on =, so typing and Enter reach the calculator at once.
  await toggle.click();
  await expect(key('equals')).toBeFocused();
  await expect(useIn('1st')).toHaveAttribute('aria-disabled', 'true');
  await expectNoA11yViolations(page);
  await page.keyboard.type('12*3');
  await expect(entry).toHaveText('12×3 = 36');
  await expect(first).toHaveValue('1');
  await page.keyboard.press('Enter');
  await expect(entry).toHaveText('36');

  // Tab cycles =, Use in 1st, Use in 2nd, Close; Enter presses whichever has focus.
  await page.keyboard.press('Tab');
  await expect(useIn('1st')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(useIn('2nd')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(key('equals')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(useIn('2nd')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(second).toHaveValue('36');
  await expect(first).toHaveValue('36,000');
  await expect(
    page.getByRole('status').filter({ hasText: 'Sent to the second value' }),
  ).toHaveCount(1);

  // One history: undo takes back the send, then the =, and redo puts both back.
  await page.keyboard.press('Control+z');
  await expect(second).toHaveValue('0.001');
  await page.keyboard.press('Control+z');
  await expect(entry).toHaveText('12×3 = 36');
  await page.keyboard.press('Control+y');
  await page.keyboard.press('Control+y');
  await expect(entry).toHaveText('36');
  await expect(second).toHaveValue('36');

  // Escape takes back one burst of typing at a time, then closes once the display is empty.
  await page.keyboard.type('12345');
  await page.waitForTimeout(TYPING_CHUNK_MS + 150);
  await page.keyboard.type('678');
  await page.waitForTimeout(TYPING_CHUNK_MS + 150);
  await page.keyboard.type('9');
  await page.keyboard.press('Backspace');
  await page.keyboard.type('+1');
  await expect(entry).toHaveText('12345678+1 = 12,345,679');
  await page.keyboard.press('Escape');
  await expect(entry).toHaveText('12345678');
  await page.keyboard.press('Escape');
  await expect(entry).toHaveText('12345');
  await page.keyboard.press('Escape');
  await expect(entry).toHaveText('0');
  await page.keyboard.press('Escape');
  await expect(calculator).toHaveCount(0);
  await expect(toggle).toBeFocused();

  // A click elsewhere leaves it open; a key click brings the keyboard back to it.
  await toggle.click();
  await page.keyboard.type('4e2');
  await expect(entry).toHaveText('4E2');
  await page.getByRole('heading', { level: 1 }).click();
  await expect(calculator).toBeVisible();
  await key('5').click();
  await page.keyboard.type('6');
  await expect(entry).toHaveText('4E256');

  // Close keeps the entry for next time.
  await close.click();
  await expect(calculator).toHaveCount(0);
  await toggle.click();
  await expect(entry).toHaveText('4E256');
});

test('Enter on typed arithmetic gives its value and keeps the unit', async ({ page }) => {
  await page.goto('/?a=milliliter&b=liter&v=1&s=a');
  await ready(page);
  const { first, second } = boxes(page);

  await first.fill('2 × 3');
  await expect(second).toHaveValue('0.006');
  await first.press('Enter');
  await expect(first).toHaveValue('6');
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();

  await first.fill('5/0');
  await expect(second).toHaveAccessibleDescription(/Can’t divide by zero/);
});

test.describe('in a German locale', () => {
  test.use({ locale: 'de-DE' });

  test('the URL keeps the number the user meant', async ({ page }) => {
    await page.goto('/?a=kilometer&b=meter');
    await ready(page);
    const { first, second } = boxes(page);

    await first.fill('1.000');
    await expect(second).toHaveValue('1.000.000');
    await expect(page).toHaveURL(/v=1000&s=a/);
  });
});
