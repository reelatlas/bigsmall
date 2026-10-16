import { unitsIn } from '@bigsmall/core';
import { expect, test, type Page } from '@playwright/test';
import {
  applyTheme,
  box,
  calculatorButton,
  calculatorPanel,
  expectNoA11yViolations,
  hiddenToggle,
  ready,
  recordAnimations,
  row,
  setSettings,
  settingsButton,
  settingsPanel,
  settled,
  startedAnimations,
  unitCell,
  themeTime,
} from './support';
import { THEMES } from '../src/lib/themes';

// Settings (ADR 0018, docs/UX-SPEC.md §1, §3, §7): what shows, in every category, and how results
// look; the table's sections, its Hidden list, and Edit; search leaving hidden units out. Visitors
// are in the US: their own units come first (ADR 0011).

const table = (page: Page) => page.getByRole('region', { name: 'Volume' });
const SPECIALIST = unitsIn('volume').filter((unit) => unit.tier !== 'basic').length;

test('a fresh visit shows symbols and names, two places, and the specialist units hidden', async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await expect(row(page, 'liter')).toContainText('0.47');
  // Symbol and name since 2026-10-15 (Sean); symbols alone until then.
  await expect(row(page, 'liter').locator('[data-name]')).toBeVisible();
  await expect(row(page, 'cubic-meter')).toHaveCount(0);
  await expect(hiddenToggle(page)).toContainText(String(SPECIALIST));

  await settingsButton(page, 'Units').click();
  await expect(
    settingsPanel(page, 'Units')
      .locator('label', { hasText: /^Standard$/ })
      .locator('input'),
  ).toBeChecked();
  await settingsButton(page, 'Display').click();
  await expect(
    settingsPanel(page, 'Display')
      .locator('label', { hasText: /^Symbol and name$/ })
      .locator('input'),
  ).toBeChecked();
  await expectNoA11yViolations(page);

  // Symbol only: the names leave the rows and the chip, kept for screen readers.
  await setSettings(page, 'Symbol only');
  await expect(row(page, 'liter').locator('[data-name]')).toHaveCount(0);
  await expect(unitCell(page, 'liter')).toHaveAccessibleName(/liters/);
  await expect(
    page.getByRole('button', { name: 'Unit: cups' }).getByText('cups', { exact: true }),
  ).toBeHidden();
});

test('Alt+V and Alt+B open and close Units and Display from anywhere, focus coming back where it was', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'keys need a keyboard');
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  const units = settingsPanel(page, 'Units');
  const display = settingsPanel(page, 'Display');
  await expect(settingsButton(page, 'Units')).toHaveAttribute('aria-keyshortcuts', 'Alt+V');
  await expect(settingsButton(page, 'Units')).toHaveAttribute('title', 'Units (Alt+V)');
  await expect(settingsButton(page, 'Display')).toHaveAttribute('title', 'Display (Alt+B)');
  await box(page).click();
  await page.keyboard.press('Alt+v');
  await expect(units).toBeVisible();
  await expect(units.locator('label', { hasText: /^Standard$/ }).locator('input')).toBeFocused();
  // One over the other: Display replaces Units, focus going into it.
  await page.keyboard.press('Alt+b');
  await expect(units).toHaveCount(0);
  await expect(display).toBeVisible();
  await expect(display.locator('input:checked').first()).toBeFocused();
  // Its key from inside closes it, focus back in the box, where the first key was pressed.
  await page.keyboard.press('Alt+b');
  await expect(display).toHaveCount(0);
  await expect(box(page)).toBeFocused();
  // From outside, it closes and focus stays put; the calculator's key opens over a panel too.
  await page.keyboard.press('Alt+v');
  await box(page).click();
  await page.keyboard.press('Alt+v');
  await expect(units).toHaveCount(0);
  await expect(box(page)).toBeFocused();
  await page.keyboard.press('Alt+v');
  await page.keyboard.press('Alt+c');
  await expect(units).toHaveCount(0);
  await expect(calculatorPanel(page)).toBeVisible();
});

test('Units and Display open beside the table, one side panel at a time with the calculator; Escape closes, a press outside does not', async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  const units = settingsPanel(page, 'Units');
  const display = settingsPanel(page, 'Display');
  const calculator = calculatorPanel(page);
  // Opening moves focus in, onto its first choice, and its edge turns the accent.
  await settingsButton(page, 'Units').click();
  await expect(units.locator('label', { hasText: /^Standard$/ }).locator('input')).toBeFocused();
  const edge = () => units.evaluate((panel) => getComputedStyle(panel).borderTopColor);
  // The theme's accent as a computed color, for the edge to ease to.
  const accent = await units.evaluate((panel) => {
    const probe = document.createElement('span');
    probe.style.color = getComputedStyle(panel).getPropertyValue('--accent');
    panel.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect.poll(edge).toBe(accent);
  await page.keyboard.press('Escape');
  await expect(units).toHaveCount(0);
  await expect(settingsButton(page, 'Units')).toBeFocused();

  // A side panel stays open as the page is used, its edge quiet once focus leaves it.
  await settingsButton(page, 'Units').click();
  await box(page).click();
  await expect(units).toBeVisible();
  await expect.poll(edge).not.toBe(accent);

  // One side panel at a time: each opens in the place of the one before.
  await settingsButton(page, 'Display').click();
  await expect(units).toHaveCount(0);
  await expect(display).toBeVisible();
  await calculatorButton(page).click();
  await expect(display).toHaveCount(0);
  await expect(calculator).toBeVisible();
  await settingsButton(page, 'Units').click();
  await expect(calculator).toHaveCount(0);
  await expectNoA11yViolations(page);

  // A reset done shows its check and says so, and the panel stays open to show what changed.
  await setSettings(page, 'Fractions');
  await settingsButton(page, 'Display').click();
  await display.getByRole('button', { name: 'Reset display' }).click();
  await expect(display).toBeVisible();
  await expect(display.getByRole('status')).toHaveText('Display reset');
  await expect(display.locator('label', { hasText: /^Decimals$/ }).locator('input')).toBeChecked();
});

test('the Hidden list brings a unit back into its section; Edit sends one to Hidden, which stays below it, Done in its place, and Done folds Hidden', async ({
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
  // A press lands while units glide, but Playwright waits for a still target, then scrolls it into
  // view a different way on each retry, moving the page this test measures.
  await settled(page);

  // Edit reads Done in its place, focus staying on it, and nothing over the list moves: the
  // hidden units stay in Hidden below, never listed among the rows.
  const top = async () =>
    (await table(page).locator('[role="rowgroup"], [role="group"]').first().boundingBox())!.y;
  const before = await top();
  await table(page).getByRole('button', { name: 'Edit', exact: true }).click();
  const done = table(page).getByRole('button', { name: 'Done' });
  await expect(done).toBeFocused();
  expect(await top()).toBe(before);
  await expect(page.getByRole('group', { name: 'Hidden, Specialty' })).toBeVisible();
  await expect(
    table(page)
      .getByRole('group', { name: 'Specialty', exact: true })
      .getByLabel(/cubic feet/),
  ).toHaveCount(0);
  await expectNoA11yViolations(page);
  // Over the long list the foot stays at the screen's bottom edge, Done in reach.
  await page.evaluate(() => window.scrollTo(0, 0));
  const foot = (await done.boundingBox())!;
  expect(foot.y + foot.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  // Unchecked, a row leaves for Hidden at once, as a unit checked there leaves for its row.
  await table(page)
    .getByRole('group', { name: 'US (customary)', exact: true })
    .getByLabel(/teaspoons/)
    .click();
  await expect(
    page.getByRole('group', { name: 'Hidden, US (customary)' }).getByLabel(/teaspoons/),
  ).toBeVisible();
  await done.click();
  await expect(table(page).getByRole('button', { name: 'Edit', exact: true })).toBeFocused();
  await expect(row(page, 'us-teaspoon')).toHaveCount(0);
  // Done closes Hidden, whoever just chose what to hide.
  await expect(hiddenToggle(page)).toHaveAttribute('aria-expanded', 'false');

  // Show custom hidden units brings it back, and keeps the settings.
  await setSettings(page, 'Show custom hidden units');
  await expect(row(page, 'us-teaspoon')).toBeVisible();
});

test('Edit lists units as Hidden does and takes the keys: the arrows move, Enter moves a unit and focus stays, Escape or typing ends it', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  const edit = table(page).getByRole('button', { name: 'Edit', exact: true });
  await edit.focus();
  await page.keyboard.press('Enter');
  const done = table(page).getByRole('button', { name: 'Done' });
  await expect(done).toBeFocused();
  // No values in Edit: each unit is a checkbox, its symbol, and its name, as in Hidden.
  await expect(table(page).locator('[data-row]')).toHaveCount(0);
  await expect(table(page).locator('[data-whole]')).toHaveCount(0);
  const line = (name: RegExp) =>
    table(page).getByRole('group', { name: 'US (customary)', exact: true }).getByLabel(name);
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await expect(line(/teaspoons/)).toBeFocused();
  // Enter hides it, and focus stays where it was, on the line that took its place.
  await page.keyboard.press('Enter');
  await expect(line(/teaspoons/)).toHaveCount(0);
  await expect(line(/tablespoons/)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(line(/fluid ounces/)).toBeFocused();
  await expect(hiddenToggle(page)).toContainText(String(SPECIALIST + 2));
  // Escape ends Edit, focus on the button that reads Edit again.
  await page.keyboard.press('Escape');
  await expect(edit).toBeFocused();
  await expect(table(page).locator('[data-row]').first()).toBeVisible();
  // Typing ends it too, landing in the box.
  await page.keyboard.press('Enter');
  await expect(done).toBeFocused();
  await page.keyboard.press('5');
  await expect(box(page)).toHaveValue('25');
  await expect(edit).toBeVisible();
});

test('the arrows carry on from the rows onto the foot and into Hidden, and ↑ comes back to the last row', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await box(page).click();
  const inBox = () => box(page).evaluate((input) => input === document.activeElement);
  for (let step = 0; step < 40 && (await inBox()); step += 1) await box(page).press('ArrowDown');
  // Past the last row, the foot: Hidden, the cursor resting; Edit beside it, by ← and →.
  await expect(hiddenToggle(page)).toBeFocused();
  await expect(box(page)).not.toHaveAttribute('aria-activedescendant');
  const edit = table(page).getByRole('button', { name: 'Edit', exact: true });
  await page.keyboard.press('ArrowRight');
  await expect(edit).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(hiddenToggle(page)).toBeFocused();
  // ↑ goes back to the box, the cursor on the last row.
  await page.keyboard.press('ArrowUp');
  await expect(box(page)).toBeFocused();
  await expect(page.locator('[data-row]').last()).toHaveAttribute('aria-selected', 'true');
  // Open, Hidden's lines carry on under it, and past the last the arrows go on to the header.
  await box(page).press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(hiddenToggle(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(hiddenToggle(page)).toBeFocused();
  const specialty = page.getByRole('group', { name: 'Hidden, Specialty' });
  await page.keyboard.press('ArrowDown');
  await expect(specialty.getByRole('checkbox').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(specialty.getByRole('checkbox').nth(1)).toBeFocused();
  // Escape folds Hidden first, focus back on its button; the next goes back to the box.
  await page.keyboard.press('Escape');
  await expect(hiddenToggle(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(hiddenToggle(page)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(box(page)).toBeFocused();
  // Open again, its last line is the page's bottom: down from it does nothing (Sean, 2026-10-15).
  await hiddenToggle(page).focus();
  await page.keyboard.press('Enter');
  await expect(hiddenToggle(page)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('End');
  await page.evaluate(() => document.activeElement?.setAttribute('data-last-line', ''));
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-last-line]')).toBeFocused();
});

test('under the matches, Show them carries on from the last match, and lists the hidden ones under its line', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await box(page).fill('2 cu');
  const show = page.getByRole('button', { name: 'Show them' });
  await expect(show).toBeVisible();
  const inBox = () => box(page).evaluate((input) => input === document.activeElement);
  for (let step = 0; step < 40 && (await inBox()); step += 1) await box(page).press('ArrowDown');
  await expect(show).toBeFocused();
  await page.keyboard.press('Enter');
  const hide = page.getByRole('button', { name: 'Hide them' });
  await expect(hide).toBeFocused();
  // They list under the line, as Hidden lists its units under the table's foot, not among the
  // matches over it (Sean, 2026-10-15).
  const matches = page.getByRole('listbox', { name: 'Matching units' }).getByRole('option');
  const hidden = page
    .getByRole('listbox', { name: /hidden units? also match/ })
    .getByRole('option');
  await expect(hidden).not.toHaveCount(0);
  const line = (await hide.boundingBox())!;
  expect((await hidden.first().boundingBox())!.y).toBeGreaterThanOrEqual(line.y + line.height);
  // ↓ goes on into them, the cursor back in the box; ↑ from the first comes back to the button.
  await page.keyboard.press('ArrowDown');
  await expect(box(page)).toBeFocused();
  await expect(hidden.first()).toHaveAttribute('aria-selected', 'true');
  await box(page).press('ArrowUp');
  await expect(hide).toBeFocused();
  // ↑ from the button comes back to the box, the cursor on the last match over the line.
  await page.keyboard.press('ArrowUp');
  await expect(box(page)).toBeFocused();
  await expect(matches.last()).toHaveAttribute('aria-selected', 'true');
  // On through the hidden ones to the last, the page's bottom: down from it does nothing (Sean,
  // 2026-10-15).
  await box(page).press('ArrowDown');
  await expect(hide).toBeFocused();
  const count = await hidden.count();
  await page.keyboard.press('ArrowDown');
  for (let step = 1; step < count; step += 1) await box(page).press('ArrowDown');
  await expect(hidden.last()).toHaveAttribute('aria-selected', 'true');
  await box(page).press('ArrowDown');
  await expect(box(page)).toBeFocused();
  await expect(hidden.last()).toHaveAttribute('aria-selected', 'true');
});

test('with a system unchecked none of its units shows: its switch is final, and its checkbox shows a dash while units are chosen on their own', async ({
  page,
}) => {
  await page.goto('/?a=foot&v=6.3');
  await ready(page);
  // A specialist unit shown on its own, from Hidden.
  await hiddenToggle(page).click();
  await page
    .getByRole('group', { name: 'Hidden, Specialty' })
    .getByLabel(/nanometers/)
    .click();
  await expect(row(page, 'nanometer')).toBeVisible();
  await settingsButton(page, 'Units').click();
  const units = settingsPanel(page, 'Units');
  const specialty = units.getByRole('checkbox', { name: 'Specialty' });
  await expect
    .poll(() => specialty.evaluate((input) => (input as HTMLInputElement).indeterminate))
    .toBe(true);
  // No preset is lit while a unit departs from it.
  await expect(units.getByRole('radio', { name: 'Standard' })).not.toBeChecked();
  // A press on the dash shows every specialist unit; the next hides every one, the unit shown on
  // its own too; changed by hand, the set stays the visitor's own, Custom lit.
  await specialty.click();
  await expect(specialty).toBeChecked();
  await specialty.click();
  await expect(specialty).not.toBeChecked();
  await expect(row(page, 'nanometer')).toHaveCount(0);
  await expect(page.locator('[data-section="specialist"]')).toHaveCount(0);
  await expect(units.getByRole('radio', { name: /^Custom/ })).toBeChecked();
});

test("Custom lights for a set of the visitor's own; a preset keeps it aside, and Custom brings it back", async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await settingsButton(page, 'Units').click();
  const units = settingsPanel(page, 'Units');
  const custom = units.getByRole('radio', { name: /^Custom/ });
  const pick = (name: RegExp) => units.locator('label').filter({ hasText: name }).click();
  // A fresh visit lights Standard; Custom is in reach all the same, and picked, it makes what
  // shows the visitor's own, nothing changing.
  await expect(units.getByRole('radio', { name: 'Standard' })).toBeChecked();
  await expect(custom).toBeEnabled();
  await pick(/^Custom/);
  await expect(custom).toBeChecked();
  await expect(row(page, 'us-teaspoon')).toBeVisible();
  await pick(/^Standard$/);
  // A unit hidden in Edit makes one, and Custom lights.
  await table(page).getByRole('button', { name: 'Edit', exact: true }).click();
  await table(page)
    .getByRole('group', { name: 'US (customary)', exact: true })
    .getByLabel(/teaspoons/)
    .click();
  await table(page).getByRole('button', { name: 'Done' }).click();
  await expect(custom).toBeChecked();
  // Standard sets exactly its set, teaspoons back; Custom brings the visitor's set back.
  await pick(/^Standard$/);
  await expect(row(page, 'us-teaspoon')).toBeVisible();
  await expect(custom).toBeEnabled();
  await expect(custom).not.toBeChecked();
  await pick(/^Custom/);
  await expect(custom).toBeChecked();
  await expect(row(page, 'us-teaspoon')).toHaveCount(0);
  await expectNoA11yViolations(page);
});

test("the systems reorder in Units, by a handle's Move menu or a drag, and the table's sections follow; Reset order brings a fresh visit's back", async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await settingsButton(page, 'Units').click();
  const units = settingsPanel(page, 'Units');
  const sections = () =>
    table(page)
      .locator('[data-section]')
      .evaluateAll((all) => all.map((each) => each.getAttribute('data-section')));
  await expect.poll(sections).toEqual(['us', 'metric', 'uk']);
  // A press on a handle, with no drag, opens Move up and Move down.
  await units.getByRole('button', { name: 'Move Metric' }).click();
  await units.getByRole('button', { name: 'Move up' }).click();
  await expect.poll(sections).toEqual(['metric', 'us', 'uk']);
  await expect(units.getByRole('status').filter({ hasText: 'Metric, 1 of 5' })).toHaveCount(1);
  await expect(units.getByRole('button', { name: 'Move up' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expectNoA11yViolations(page);
  // Dragged by its handle, UK goes first, the pointer's place deciding.
  const handle = (await units.getByRole('button', { name: 'Move UK (imperial)' }).boundingBox())!;
  const top = (await units.locator('[data-system="metric"]').boundingBox())!;
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2, top.y + 4, { steps: 10 });
  await page.mouse.up();
  await expect.poll(sections).toEqual(['uk', 'metric', 'us']);
  // The drag's own click opens no menu.
  await expect(units.getByRole('group', { name: /^Move/ })).toHaveCount(0);
  await units.getByRole('button', { name: 'Reset order' }).click();
  await expect.poll(sections).toEqual(['us', 'metric', 'uk']);
  // Its check stays while the pointer rests on it; moved away, it dims, nothing left to reset.
  await page.mouse.move(0, 0);
  await expect(units.getByRole('button', { name: 'Reset order' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
});

test("Alt and an arrow move a system's row; Escape closes its Move menu, the panel staying open", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await settingsButton(page, 'Units').click();
  const units = settingsPanel(page, 'Units');
  const sections = () =>
    table(page)
      .locator('[data-section]')
      .evaluateAll((all) => all.map((each) => each.getAttribute('data-section')));
  const uk = units.getByRole('checkbox', { name: 'UK (imperial)' });
  await uk.focus();
  await page.keyboard.press('Alt+ArrowUp');
  await expect.poll(sections).toEqual(['us', 'uk', 'metric']);
  await expect(uk).toBeFocused();
  await expect(units.getByRole('status').filter({ hasText: 'UK (imperial), 2 of 5' })).toHaveCount(
    1,
  );
  // → reaches the row's handle; Enter opens its menu, Escape closes it.
  await page.keyboard.press('ArrowRight');
  const handle = units.getByRole('button', { name: 'Move UK (imperial)' });
  await expect(handle).toBeFocused();
  await page.keyboard.press('Enter');
  const up = units.getByRole('button', { name: 'Move up' });
  const down = units.getByRole('button', { name: 'Move down' });
  await expect(up).toBeFocused();
  // The menu keeps the keys: Tab and the arrows go between its two moves and never out.
  await page.keyboard.press('Tab');
  await expect(down).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(up).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(down).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(down).toBeFocused();
  // A move keeps focus on the move pressed, the menu open, however far the row goes.
  await page.keyboard.press('Enter');
  await expect.poll(sections).toEqual(['us', 'metric', 'uk']);
  await expect(down).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect.poll(sections).toEqual(['uk', 'us', 'metric']);
  await expect(up).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(handle).toBeFocused();
  await expect(units).toBeVisible();
  // Alt and an arrow down a row keeps focus on it at every step.
  await page.keyboard.press('ArrowLeft');
  await expect(uk).toBeFocused();
  await page.keyboard.press('Alt+ArrowDown');
  await page.keyboard.press('Alt+ArrowDown');
  await expect.poll(sections).toEqual(['us', 'metric', 'uk']);
  await expect(uk).toBeFocused();
  // Without Alt, the arrows walk the rows as ever.
  await page.keyboard.press('ArrowUp');
  await expect(units.getByRole('checkbox', { name: 'Metric' })).toBeFocused();
});

test('a click anywhere in a side panel brings the keys to it, as a click in the calculator does', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await settingsButton(page, 'Units').click();
  const units = settingsPanel(page, 'Units');
  await box(page).click();
  await expect(box(page)).toBeFocused();
  // On the panel's title, no control: focus comes in, and the arrows answer there.
  await units.getByRole('heading', { name: 'Units' }).click();
  await expect(units.getByRole('radio', { name: 'Standard' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(units.getByRole('checkbox', { name: 'US (customary)' })).toBeFocused();
  // On a control's label, focus goes to its control.
  await box(page).click();
  await units.getByText('Metric', { exact: true }).click();
  await expect(units.getByRole('checkbox', { name: 'Metric' })).toBeFocused();
});

test('settings are remembered in this browser: what shows, Custom, the order, and how values look', async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await settingsButton(page, 'Units').click();
  const units = settingsPanel(page, 'Units');
  await units.getByRole('checkbox', { name: 'UK (imperial)' }).click();
  await units.getByRole('button', { name: 'Move Metric' }).click();
  await units.getByRole('button', { name: 'Move up' }).click();
  await setSettings(page, 'Fractions');
  await expect(row(page, 'us-teaspoon')).toContainText('96');
  await page.reload();
  await ready(page);
  await expect(row(page, 'imperial-gallon')).toHaveCount(0);
  await expect(row(page, 'liter')).toContainText('1/2');
  await expect
    .poll(() =>
      table(page)
        .locator('[data-section]')
        .evaluateAll((all) => all.map((each) => each.getAttribute('data-section'))),
    )
    .toEqual(['metric', 'us']);
  await settingsButton(page, 'Units').click();
  await expect(settingsPanel(page, 'Units').getByRole('radio', { name: /^Custom/ })).toBeChecked();
});

test('search leaves hidden units out and offers them; taking one unhides it', async ({ page }) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await box(page).fill('2 cubic');
  await expect(page.getByText('Only hidden units match')).toBeVisible();
  await page.getByRole('button', { name: 'Show them' }).click();
  const hidden = page.getByRole('listbox', { name: 'Only hidden units match' });
  await expect(hidden.getByRole('option')).not.toHaveCount(0);
  await expectNoA11yViolations(page);
  await hidden.getByRole('option', { name: /cubic inches/ }).click();
  await expect(page.getByRole('button', { name: 'Remove cubic inches' })).toBeVisible();
  // Out of Hidden for good: clearing the box leaves it in the table.
  await page.getByRole('button', { name: 'Remove cubic inches' }).click();
  await expect(row(page, 'cubic-inch')).toBeVisible();
});

test("Display's figures are set in the numeric face: Round to's as the fraction sizes'", async ({
  page,
}) => {
  await page.goto('/?a=foot&v=6.3');
  await ready(page);
  await settingsButton(page, 'Display').click();
  const panel = settingsPanel(page, 'Display');
  await panel
    .locator('label')
    .filter({ hasText: /^Both$/ })
    .click();
  // Hardhat sets figures in a face of their own (monospace), so the faces differ there.
  await applyTheme(page, { id: 'hardhat', name: 'Hardhat' });
  const face = (text: string) =>
    panel
      .getByText(text, { exact: true })
      .evaluate((element) => getComputedStyle(element).fontFamily);
  const figures = await face('1/2');
  expect(await face('No limit')).not.toBe(figures);
  for (const places of ['0.1', '0.01', '0.001']) expect(await face(places), places).toBe(figures);
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
  await expect(row(page, 'foot')).toContainText(/6\.30\s*≈ 6 1\/4/);
  await expectNoA11yViolations(page);
});

test("where Both's fraction has no room beside the decimal, it sits under it, lined up on the point, and the row keeps its height", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 844 });
  await page.goto('/?a=pound&v=2.3');
  await ready(page);
  await setSettings(page, 'Both');
  const ounce = row(page, 'ounce');
  const under = ounce.locator('[data-instead="second"]').first();
  await expect(under).toBeVisible();
  await expect(ounce.locator('[data-column="second"]')).toBeHidden();
  await expect(ounce.getByRole('gridcell').first()).toHaveAccessibleName(/≈ 36 3\/4/);
  const value = (await ounce.locator('[data-whole]').boundingBox())!;
  const fraction = (await under.boundingBox())!;
  // "≈ 36" ends where "36" does, at the decimal point, on the line under it.
  expect(Math.round(fraction.x + fraction.width)).toBe(Math.round(value.x + value.width));
  expect(fraction.y).toBeGreaterThanOrEqual(value.y + value.height - 1);
  expect(Math.round((await ounce.boundingBox())!.height)).toBe(44);
  await expectNoA11yViolations(page);
  // In every theme, whose figures differ in width (monospace, serif), the rule holds where the
  // fraction falls: beside the decimal and whole, or under it on the point; the row keeps its height.
  const beside = ounce.locator('[data-column="second"]');
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    await expect
      .poll(async () => (await under.isVisible()) !== (await beside.isVisible()), theme.id)
      .toBe(true);
    if (await under.isVisible()) {
      const whole = (await ounce.locator('[data-whole]').boundingBox())!;
      const stacked = (await under.boundingBox())!;
      expect(Math.round(stacked.x + stacked.width), theme.id).toBe(
        Math.round(whole.x + whole.width),
      );
      expect(stacked.y, theme.id).toBeGreaterThanOrEqual(whole.y + whole.height - 1);
    } else {
      expect(await beside.evaluate((cell) => cell.scrollWidth <= cell.clientWidth), theme.id).toBe(
        true,
      );
    }
    expect(Math.round((await ounce.boundingBox())!.height), theme.id).toBe(44);
  }
  await applyTheme(page, THEMES[0]!);
  // With the room, it goes back beside the decimal.
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(ounce.locator('[data-column="second"]')).toBeVisible();
  await expect(under).toBeHidden();
});

test('Units and Display follow the calculator in the toolbar; a panel keeps its arrows, and typing lands in the box', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await calculatorButton(page).focus();
  await page.keyboard.press('ArrowRight');
  await expect(settingsButton(page, 'Units')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(settingsButton(page, 'Display')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  const units = settingsPanel(page, 'Units');
  const choice = (label: string) =>
    units
      .locator('label', { hasText: new RegExp(`^${label.replace(/[()]/g, '\\$&')}$`) })
      .locator('input');
  await expect(choice('Standard')).toBeFocused();
  // ← and → move a strip's choice; ↑ and ↓ move between rows, never out of the panel. The systems
  // come in the table's order, the visitor's own first.
  await page.keyboard.press('ArrowRight');
  await expect(choice('Your region')).toBeChecked();
  await page.keyboard.press('ArrowDown');
  await expect(choice('US (customary)')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(choice('Metric')).toBeFocused();
  // Enter works a checkbox as Space does.
  await page.keyboard.press('Enter');
  await expect(choice('Metric')).toBeChecked();
  for (let step = 0; step < 6; step += 1) await page.keyboard.press('ArrowUp');
  await expect(units.getByRole('button', { name: 'Close units' })).toBeFocused();
  // A digit lands in the box, after what is there; the panel stays open.
  await page.keyboard.press('7');
  await expect(box(page)).toBeFocused();
  await expect(box(page)).toHaveValue('27');
  await expect(units).toBeVisible();
});

test('a unit moving between shown and hidden glides to its place and flashes as it lands', async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  const slow = await themeTime(page, '--motion-slow');
  const fade = await themeTime(page, '--highlight-fade');
  // How long the animation of `property` on `selector` ran, 0 if none did: the theme's length in
  // full. Recorded as each starts, so a slow machine that finishes it first still shows it.
  const animated = async (selector: string, property: string) =>
    Math.max(0, ...(await startedAnimations(page, selector, property)));
  await hiddenToggle(page).click();
  await recordAnimations(page);
  await page
    .getByRole('group', { name: 'Hidden, Specialty' })
    .getByLabel(/cubic inches/)
    .click();
  await expect(row(page, 'cubic-inch')).toBeVisible();
  // It slides up from its line in Hidden, and flashes where it lands.
  expect(await animated('[data-row="cubic-inch"]', 'transform')).toBe(slow);
  expect(await animated('[data-row="cubic-inch"] > [role="gridcell"]', 'backgroundColor')).toBe(
    fade,
  );
  // The page takes clicks while it moves: a second unit checked straight after the first shows.
  await page
    .getByRole('group', { name: 'Hidden, Specialty' })
    .getByLabel(/cubic feet/)
    .click();
  await expect(row(page, 'cubic-foot')).toBeVisible();

  // Edit sends one to Hidden: Hidden flashes as it takes it.
  await table(page).getByRole('button', { name: 'Edit', exact: true }).click();
  await recordAnimations(page);
  await table(page)
    .getByRole('group', { name: 'US (customary)', exact: true })
    .getByLabel(/teaspoons/)
    .click();
  expect(await animated('[data-table-foot] button[aria-expanded]', 'backgroundColor')).toBe(fade);
  // With Hidden folded, the unit that left fades out where it was, rather than vanishing: a copy
  // laid over the page where it stood.
  await hiddenToggle(page).click();
  await expect(hiddenToggle(page)).toHaveAttribute('aria-expanded', 'false');
  await recordAnimations(page);
  await table(page)
    .getByRole('group', { name: 'US (customary)', exact: true })
    .getByLabel(/tablespoons/)
    .click();
  await expect
    .poll(() => startedAnimations(page, '[data-unit="us-tablespoon"][style*="absolute"]'))
    .not.toEqual([]);
});

test('a glide moves only what moved on the page, however the page scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await hiddenToggle(page).click();
  const cubicInches = page
    .getByRole('group', { name: 'Hidden, Specialty' })
    .getByLabel(/cubic inches/);
  await cubicInches.scrollIntoViewIfNeeded();
  await recordAnimations(page);
  await cubicInches.click();
  await expect(row(page, 'cubic-inch')).toBeVisible();
  // The one that arrived glided; the rows above it did not move on the page, so none of them did.
  await expect
    .poll(() => startedAnimations(page, '[data-row="cubic-inch"]', 'transform'))
    .not.toEqual([]);
  expect(
    await startedAnimations(
      page,
      '[data-row="us-teaspoon"], [data-row="milliliter"], [data-row="imperial-gallon"]',
    ),
  ).toEqual([]);
});

test('with reduced motion a unit moves at once, and still flashes, a change of color only', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await hiddenToggle(page).click();
  await recordAnimations(page);
  await page
    .getByRole('group', { name: 'Hidden, Specialty' })
    .getByLabel(/cubic inches/)
    .click();
  await expect(row(page, 'cubic-inch')).toBeVisible();
  // It flashed where it landed, for the theme's length, and nothing moved (a move of no length
  // is none).
  const cells = '[data-row="cubic-inch"] > [role="gridcell"]';
  await expect.poll(() => startedAnimations(page, cells)).not.toEqual([]);
  const fade = await themeTime(page, '--highlight-fade');
  expect(new Set(await startedAnimations(page, cells))).toEqual(new Set([fade]));
  const moves = await startedAnimations(page, '*', 'transform');
  expect(moves.filter((length) => length > 0)).toEqual([]);
});
