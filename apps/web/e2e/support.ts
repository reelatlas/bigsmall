import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import type { ThemeMeta } from '../src/lib/themes';

/** How long past a delay a test waits for its effect, so a slow machine still sees it land. */
export const MARGIN_MS = 200;

/** The rules axe checks: WCAG 2.0, 2.1, and 2.2 at levels A and AA. */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * The converter island is server-rendered; keystrokes typed before it hydrates are lost, so
 * every test waits for the island's ready mark after navigating and before typing.
 */
export async function ready(page: Page) {
  await page.locator('section[data-hydrated]').waitFor();
}

/**
 * Theme tokens transition; axe must see the settled colors, not a frame in between. A transition
 * cancelled on the way (a list redrawn under it) has settled too: its promise rejects, so it is
 * waited on without failing.
 */
export async function settled(page: Page) {
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))),
  );
}

/** Runs axe on the page as it is and fails on any violation. */
export async function expectNoA11yViolations(page: Page) {
  await settled(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
}

/** The header's theme menu trigger, whatever theme it names. */
export const themeToggle = (page: Page) => page.getByRole('button', { name: /^Theme/ });

/** Picks a theme the way a mouse user does: open the menu, click the option's label. */
export async function pickTheme(page: Page, name: string) {
  await themeToggle(page).click();
  await page
    .locator('label')
    .filter({ hasText: new RegExp(`^${name}$`) })
    .click();
}

/**
 * Applies a theme at once, as the theme menu does (the page theme and the name its trigger
 * shows), for tests that loop through every theme and are not testing the menu itself.
 */
export async function applyTheme(page: Page, theme: Pick<ThemeMeta, 'id' | 'name'>) {
  await page.evaluate(({ id, name }) => {
    document.documentElement.dataset['theme'] = id;
    for (const shown of document.querySelectorAll('[data-theme-name]')) shown.textContent = name;
  }, theme);
}

/** The converter's box, the field named "Value" (exactly, so no other name containing it matches). */
export const box = (page: Page) => page.getByRole('combobox', { name: 'Value', exact: true });

/** The converter's category menu trigger, before a category is chosen or after. */
export const menu = (page: Page) => page.getByRole('button', { name: /^Category/ });

/** A settings panel's button, Units or Display, in the converter's toolbar (not the dev toolbar's). */
export const settingsButton = (page: Page, name: 'Units' | 'Display') =>
  page.getByRole('toolbar', { name: 'Tools' }).getByRole('button', { name, exact: true });

/** A settings side panel, by its title. */
export const settingsPanel = (page: Page, name: 'Units' | 'Display') =>
  page.getByRole('group', { name, exact: true });

/** The choices Units holds; the rest are Display's. */
const UNITS_CHOICES = new Set([
  'All',
  'Standard',
  'Your region',
  'Metric',
  'US (customary)',
  'UK (imperial)',
  'Specialty',
  'Show units hidden one by one',
]);

/**
 * Opens Units or Display, whichever holds each choice, picks it by its label ("All",
 * "Symbol and name", "No limit"), turns a switch over by its name ("Copy buttons"), or presses a
 * button ("Show units hidden one by one"), then closes the panel with its close button.
 */
export async function setSettings(page: Page, ...choices: string[]) {
  for (const choice of choices) {
    const name = UNITS_CHOICES.has(choice) ? 'Units' : 'Display';
    const panel = settingsPanel(page, name);
    if (!(await panel.count())) await settingsButton(page, name).click();
    const toggle = panel.getByRole('switch', { name: choice });
    const button = panel.getByRole('button', { name: new RegExp(`^${choice}`) });
    if (await toggle.count()) await toggle.click();
    else if (await button.count()) await button.click();
    else
      await panel
        .locator('label')
        .filter({ hasText: new RegExp(`^${choice}$`) })
        .click();
  }
  for (const name of ['Units', 'Display'] as const) {
    const panel = settingsPanel(page, name);
    if (await panel.count()) await panel.getByRole('button', { name: /^Close/ }).click();
    await expect(panel).toHaveCount(0);
  }
}

/**
 * The table as it was before Settings (ADR 0017): every unit, names, copy buttons, and six
 * significant digits, for tests whose subject is something else.
 */
export async function showEverything(page: Page) {
  await setSettings(page, 'All', 'Symbol and name', 'Copy buttons', 'No limit');
}
