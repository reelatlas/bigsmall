import { unitsIn } from '@bigsmall/core';
import { expect, test, type Page } from '@playwright/test';
import { box, expectNoA11yViolations, ready, setSettings, settingsButton } from './support';

// Settings (ADR 0017, docs/UX-SPEC.md §1, §3, §7): what shows, in every category, and how results
// look; the table's sections, its Hidden list, and Edit; search leaving hidden units out. Visitors
// are in the US: their own units come first (ADR 0011).

const row = (page: Page, unitId: string) => page.locator(`[data-row="${unitId}"]`);
const panel = (page: Page) => page.getByRole('dialog', { name: 'Settings' });
const table = (page: Page) => page.getByRole('region', { name: 'Volume' });
const hiddenToggle = (page: Page) => page.getByRole('button', { name: /^Hidden/ });
const SPECIALIST = unitsIn('volume').filter((unit) => unit.tier !== 'basic').length;

test('a fresh visit shows symbols, two places, no copy buttons, and the specialist units hidden', async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await expect(row(page, 'liter')).toContainText('0.47');
  await expect(row(page, 'liter').locator('[data-name]')).toHaveCount(0);
  // The name stays for screen readers.
  await expect(row(page, 'liter').getByRole('gridcell')).toHaveAccessibleName(/liters/);
  await expect(table(page).getByRole('button', { name: /^Copy/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Copy value' })).toHaveCount(0);
  await expect(row(page, 'cubic-meter')).toHaveCount(0);
  await expect(hiddenToggle(page)).toContainText(String(SPECIALIST));
  // The chip shows its symbol alone too.
  await expect(
    page.getByRole('button', { name: 'Change unit: cups' }).getByText('cups', { exact: true }),
  ).toBeHidden();

  await settingsButton(page).click();
  await expect(
    panel(page)
      .locator('label', { hasText: /^Standard$/ })
      .locator('input'),
  ).toBeChecked();
  await expect(panel(page).getByRole('switch', { name: 'Copy buttons' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
  await expectNoA11yViolations(page);
});

test('Settings closes on Escape, a press outside, or focus moving out, and stays open through its resets', async ({
  page,
  isMobile,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await settingsButton(page).click();
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await expect(settingsButton(page)).toBeFocused();

  await settingsButton(page).click();
  await page.mouse.click(5, 5);
  await expect(panel(page)).toHaveCount(0);

  // A reset done shows its check, says so, and leaves the panel open to show what changed.
  await setSettings(page, 'Fractions');
  await settingsButton(page).click();
  await panel(page).getByRole('button', { name: 'Reset settings' }).click();
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).getByRole('status')).toHaveText('Settings reset');
  await expect(
    panel(page)
      .locator('label', { hasText: /^Decimals$/ })
      .locator('input'),
  ).toBeChecked();

  if (!isMobile) {
    // Tab past the panel's last control moves focus out, which closes it.
    await panel(page).getByRole('button', { name: 'Unhide units' }).focus();
    await page.keyboard.press('Tab');
    await expect(panel(page)).toHaveCount(0);
  }
});

test('the Hidden list brings a unit back into its section; Edit hides one, Done in its place, and Done folds Hidden', async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await hiddenToggle(page).click();
  await expect(page.getByRole('group', { name: 'Hidden, Specialty' })).toBeVisible();
  await expectNoA11yViolations(page);
  // Checked, it leaves the list for its section, so a click, not a check that waits on it.
  await page
    .getByRole('group', { name: 'Hidden, Specialty' })
    .getByLabel(/cubic inches/)
    .click();
  await expect(row(page, 'cubic-inch')).toBeVisible();
  await expect(hiddenToggle(page)).toContainText(String(SPECIALIST - 1));

  // Edit reads Done in its place, focus staying on it, and nothing over the list moves.
  const top = async () =>
    (await table(page).locator('[role="rowgroup"], [role="group"]').first().boundingBox())!.y;
  const before = await top();
  await table(page).getByRole('button', { name: 'Edit', exact: true }).click();
  const done = table(page).getByRole('button', { name: 'Done' });
  await expect(done).toBeFocused();
  await expect(table(page).getByText('Choose the units to show')).toBeVisible();
  expect(await top()).toBe(before);
  await expectNoA11yViolations(page);
  // Over the long list the foot stays at the screen's bottom edge, Done in reach.
  await page.evaluate(() => window.scrollTo(0, 0));
  const foot = (await done.boundingBox())!;
  expect(foot.y + foot.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await table(page)
    .getByLabel(/teaspoons/)
    .uncheck();
  await done.click();
  await expect(table(page).getByRole('button', { name: 'Edit', exact: true })).toBeFocused();
  await expect(row(page, 'us-teaspoon')).toHaveCount(0);
  // Done closes Hidden, whoever just chose what to hide.
  await expect(hiddenToggle(page)).toHaveAttribute('aria-expanded', 'false');

  // Unhide units brings it back, and keeps the settings.
  await setSettings(page, 'Unhide units');
  await expect(row(page, 'us-teaspoon')).toBeVisible();
});

test('search leaves hidden units out and offers them; taking one unhides it', async ({ page }) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await box(page).fill('2 cubic');
  await expect(page.getByText('Only hidden units match')).toBeVisible();
  await page.getByRole('button', { name: 'Show them' }).click();
  const hidden = page.getByRole('group', { name: 'Hidden' });
  await expect(hidden.getByRole('option')).not.toHaveCount(0);
  await expectNoA11yViolations(page);
  await hidden.getByRole('option', { name: /cubic inches/ }).click();
  await expect(page.getByRole('button', { name: 'Remove cubic inches' })).toBeVisible();
  // Out of Hidden for good: clearing the box leaves it in the table.
  await page.getByRole('button', { name: 'Remove cubic inches' }).click();
  await expect(row(page, 'cubic-inch')).toBeVisible();
});

test('fractions, both, and rounding write the values and never move the columns', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/?a=foot&v=6.3');
  await ready(page);
  const edges = () =>
    row(page, 'inch')
      .getByRole('gridcell')
      .first()
      .evaluate((cell) =>
        [...cell.children].map((child) => Math.round(child.getBoundingClientRect().right)),
      );

  await setSettings(page, 'Fractions');
  await expect(row(page, 'foot')).toContainText('6 1/4');
  const fractionEdges = await edges();
  await setSettings(page, 'Up');
  await expect(row(page, 'foot')).toContainText('6 3/8');
  expect(await edges()).toEqual(fractionEdges);
  await setSettings(page, 'Down');
  await expect(row(page, 'foot')).toContainText('6 1/4');
  expect(await edges()).toEqual(fractionEdges);

  // Both: the decimal first, its fraction after it.
  await setSettings(page, 'Nearest', 'Both');
  await expect(row(page, 'foot')).toContainText(/6\.3\s*≈ 6 1\/4/);
  await expectNoA11yViolations(page);
});

test('Settings is a stop in the toolbar after the calculator, and its choices take the arrows', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await page.getByRole('button', { name: 'Calculator', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(settingsButton(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toBeVisible();
  // A segmented control is a group of radios: the arrows move the choice.
  const standard = panel(page)
    .locator('label', { hasText: /^Standard$/ })
    .locator('input');
  await standard.focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    panel(page)
      .locator('label', { hasText: /^Your region$/ })
      .locator('input'),
  ).toBeChecked();
  await expect(panel(page)).toBeVisible();
  await expect(row(page, 'milliliter')).toHaveCount(0);
});
