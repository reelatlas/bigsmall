import { unitsIn } from '@bigsmall/core';
import { expect, test, type Page } from '@playwright/test';
import {
  box,
  expectNoA11yViolations,
  ready,
  setSettings,
  settingsButton,
  settingsPanel,
  settled,
} from './support';

// Settings (ADR 0017, docs/UX-SPEC.md §1, §3, §7): what shows, in every category, and how results
// look; the table's sections, its Hidden list, and Edit; search leaving hidden units out. Visitors
// are in the US: their own units come first (ADR 0011).

const row = (page: Page, unitId: string) => page.locator(`[data-row="${unitId}"]`);
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

  await settingsButton(page, 'Filter').click();
  await expect(
    settingsPanel(page, 'Filter')
      .locator('label', { hasText: /^Standard$/ })
      .locator('input'),
  ).toBeChecked();
  await settingsButton(page, 'Display').click();
  await expect(
    settingsPanel(page, 'Display').getByRole('switch', { name: 'Copy buttons' }),
  ).toHaveAttribute('aria-checked', 'false');
  await expectNoA11yViolations(page);
});

test('Filter and Display open beside the table, one side panel at a time with the calculator; Escape closes, a press outside does not', async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  const filter = settingsPanel(page, 'Filter');
  const display = settingsPanel(page, 'Display');
  const calculator = page.getByRole('group', { name: 'Calculator' });
  // Opening moves focus in, onto its first choice, and its edge turns the accent.
  await settingsButton(page, 'Filter').click();
  await expect(filter.locator('label', { hasText: /^Standard$/ }).locator('input')).toBeFocused();
  const edge = () => filter.evaluate((panel) => getComputedStyle(panel).borderTopColor);
  // The theme's accent as a computed color, for the edge to ease to.
  const accent = await filter.evaluate((panel) => {
    const probe = document.createElement('span');
    probe.style.color = getComputedStyle(panel).getPropertyValue('--accent');
    panel.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect.poll(edge).toBe(accent);
  await page.keyboard.press('Escape');
  await expect(filter).toHaveCount(0);
  await expect(settingsButton(page, 'Filter')).toBeFocused();

  // A side panel stays open as the page is used, its edge quiet once focus leaves it.
  await settingsButton(page, 'Filter').click();
  await box(page).click();
  await expect(filter).toBeVisible();
  await expect.poll(edge).not.toBe(accent);

  // One side panel at a time: each opens in the place of the one before.
  await settingsButton(page, 'Display').click();
  await expect(filter).toHaveCount(0);
  await expect(display).toBeVisible();
  await page.getByRole('button', { name: 'Calculator', exact: true }).click();
  await expect(display).toHaveCount(0);
  await expect(calculator).toBeVisible();
  await settingsButton(page, 'Filter').click();
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

  // Unhide units brings it back, and keeps the settings.
  await setSettings(page, 'Unhide units');
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
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('button', { name: 'Keyboard shortcuts' })).toBeFocused();
});

test('under the matches, Show them carries on from the last match, and ↑ comes back to it', async ({
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
  // ↑ comes back to the box, the cursor on the last match, now a hidden one.
  await page.keyboard.press('ArrowUp');
  await expect(box(page)).toBeFocused();
  await expect(
    page.getByRole('group', { name: 'Hidden' }).getByRole('option').last(),
  ).toHaveAttribute('aria-selected', 'true');
  await box(page).press('ArrowDown');
  await expect(hide).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('button', { name: 'Keyboard shortcuts' })).toBeFocused();
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

test('Filter and Display follow the calculator in the toolbar; a panel keeps its arrows, and typing lands in the box', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await page.getByRole('button', { name: 'Calculator', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(settingsButton(page, 'Filter')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(settingsButton(page, 'Display')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  const filter = settingsPanel(page, 'Filter');
  const choice = (label: string) =>
    filter
      .locator('label', { hasText: new RegExp(`^${label.replace(/[()]/g, '\\$&')}$`) })
      .locator('input');
  await expect(choice('Standard')).toBeFocused();
  // ← and → move a strip's choice; ↑ and ↓ move between rows, never out of the panel.
  await page.keyboard.press('ArrowRight');
  await expect(choice('Your region')).toBeChecked();
  await page.keyboard.press('ArrowDown');
  await expect(choice('Metric')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(choice('US (customary)')).toBeFocused();
  // Enter works a checkbox as Space does.
  await page.keyboard.press('Enter');
  await expect(choice('US (customary)')).not.toBeChecked();
  for (let step = 0; step < 6; step += 1) await page.keyboard.press('ArrowUp');
  await expect(filter.getByRole('button', { name: 'Close filter' })).toBeFocused();
  // A digit lands in the box, after what is there; the panel stays open.
  await page.keyboard.press('7');
  await expect(box(page)).toBeFocused();
  await expect(box(page)).toHaveValue('27');
  await expect(filter).toBeVisible();
});

test('a unit moving between shown and hidden glides to its place and flashes as it lands', async ({
  page,
}) => {
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  // How long the animation of `property` on `selector` runs, 0 if there is none: the theme's
  // length in full, which the built site writes in seconds (400ms as .4s).
  const animated = (selector: string, property: string) =>
    page.evaluate(
      ([selector, property]) =>
        Math.max(
          0,
          ...document
            .getAnimations()
            .filter(
              (animation) =>
                animation.effect instanceof KeyframeEffect &&
                animation.effect.target instanceof Element &&
                animation.effect.target.matches(selector!) &&
                animation.effect.getKeyframes().some((frame) => property! in frame),
            )
            .map((animation) => Number(animation.effect!.getTiming().duration)),
        ),
      [selector, property],
    );
  await hiddenToggle(page).click();
  await page
    .getByRole('group', { name: 'Hidden, Specialty' })
    .getByLabel(/cubic inches/)
    .click();
  await expect(row(page, 'cubic-inch')).toBeVisible();
  // It slides up from its line in Hidden, and flashes where it lands.
  expect(await animated('[data-row="cubic-inch"]', 'transform')).toBe(400);
  expect(await animated('[data-row="cubic-inch"] > [role="gridcell"]', 'backgroundColor')).toBe(
    1200,
  );
  // The page takes clicks while it moves: a second unit checked straight after the first shows.
  await page
    .getByRole('group', { name: 'Hidden, Specialty' })
    .getByLabel(/cubic feet/)
    .click();
  await expect(row(page, 'cubic-foot')).toBeVisible();

  // Edit sends one to Hidden: Hidden flashes as it takes it.
  await table(page).getByRole('button', { name: 'Edit', exact: true }).click();
  await table(page)
    .getByRole('group', { name: 'US (customary)', exact: true })
    .getByLabel(/teaspoons/)
    .click();
  expect(await animated('[data-table-foot] button[aria-expanded]', 'backgroundColor')).toBe(1200);
  // With Hidden folded, the unit that left fades out where it was, rather than vanishing.
  await hiddenToggle(page).click();
  await expect(hiddenToggle(page)).toHaveAttribute('aria-expanded', 'false');
  await table(page)
    .getByRole('group', { name: 'US (customary)', exact: true })
    .getByLabel(/tablespoons/)
    .click();
  expect(
    await page.evaluate(() =>
      [...document.body.children].some(
        (child) =>
          child instanceof HTMLElement &&
          child.dataset.unit === 'us-tablespoon' &&
          child.style.position === 'absolute' &&
          child.getAnimations().length > 0,
      ),
    ),
  ).toBe(true);
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
  await cubicInches.click();
  await expect(row(page, 'cubic-inch')).toBeVisible();
  // The rows above the one that arrived did not move on the page, so none of them slides.
  const moved = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect instanceof KeyframeEffect &&
            animation.effect.target instanceof HTMLElement &&
            ['us-teaspoon', 'milliliter', 'imperial-gallon'].includes(
              animation.effect.target.dataset.row ?? '',
            ),
        ).length,
  );
  expect(moved).toBe(0);
});

test('with reduced motion a unit moves at once, and still flashes, a change of color only', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  await hiddenToggle(page).click();
  await page
    .getByRole('group', { name: 'Hidden, Specialty' })
    .getByLabel(/cubic inches/)
    .click();
  await expect(row(page, 'cubic-inch')).toBeVisible();
  expect(
    await page.evaluate(() =>
      document
        .getAnimations()
        .every(
          (animation) =>
            !(animation.effect instanceof KeyframeEffect) ||
            animation.effect.getKeyframes().every((frame) => !('transform' in frame)),
        ),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      document
        .getAnimations()
        .some(
          (animation) =>
            animation.effect instanceof KeyframeEffect &&
            animation.effect.target instanceof Element &&
            animation.effect.target.matches('[data-row="cubic-inch"] > [role="gridcell"]'),
        ),
    ),
  ).toBe(true);
});
