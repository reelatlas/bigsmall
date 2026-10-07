import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';
import { LAYOUT_STORAGE_KEY, type Layout } from '../src/lib/layout';
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
 * Saves a layout before the page loads, as the switch would have (ADR 0009): the table is the
 * default, so tests of the two-box flows call this with 'boxes' first.
 */
export async function chooseLayout(page: Page, layout: Layout) {
  await page.addInitScript(
    ([key, value]) => {
      try {
        localStorage.setItem(key!, value!);
      } catch {
        // Storage blocked: the page falls back to the default layout.
      }
    },
    [LAYOUT_STORAGE_KEY, layout],
  );
}

/** Theme tokens transition; axe must see the settled colors, not a frame in between. */
export async function settled(page: Page) {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
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

/** The converter's two boxes and the parts of their lists that tests reach for. */
export function boxes(page: Page) {
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

/** Press ArrowDown until `option` is the highlighted row, so tests do not hard-code list order. */
export async function arrowTo(field: Locator, option: Locator) {
  for (let step = 0; step < 25; step += 1) {
    if ((await option.getAttribute('aria-selected')) === 'true') return;
    await field.press('ArrowDown');
  }
  await expect(option).toHaveAttribute('aria-selected', 'true');
}
