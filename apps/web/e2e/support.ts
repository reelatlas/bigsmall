import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { cssTime } from '../src/lib/css-time';
import type { ThemeMeta } from '../src/lib/themes';

/** How long past a delay a test waits for its effect, so a slow machine still sees it land. */
export const MARGIN_MS = 200;

/** The rules axe checks: WCAG 2.0, 2.1, and 2.2 at levels A and AA. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

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

/** An animation a script started, as recordAnimations keeps it. */
interface Started {
  target: Element;
  /** What its keyframes move, as they name it: "transform", "backgroundColor". */
  properties: string[];
  duration: number;
}

/**
 * Keeps every animation a script starts from here on (`Element.animate`, as the glide and the
 * flash start theirs): its target, what it moves, and its length, so a test reads them however
 * long ago they ran. Reading `document.getAnimations()` after a step misses one a slow machine
 * already finished (the full tidy, 2026-10-15). Called again, it starts the record afresh.
 */
export async function recordAnimations(page: Page) {
  await page.evaluate(() => {
    const store = window as unknown as { started?: Started[] };
    if (store.started) {
      store.started.length = 0;
      return;
    }
    const started: Started[] = [];
    store.started = started;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, ...args: Parameters<typeof animate>) {
      const animation = animate.apply(this, args);
      const effect = animation.effect;
      const frames = effect instanceof KeyframeEffect ? effect.getKeyframes() : [];
      started.push({
        target: this,
        properties: [...new Set(frames.flatMap((frame) => Object.keys(frame)))],
        duration: Number(effect?.getTiming().duration ?? 0),
      });
      return animation;
    };
  });
}

/**
 * The lengths of the animations recorded since recordAnimations on what matches `selector`, those
 * that move `property` when it is given; none ran, [].
 */
export async function startedAnimations(page: Page, selector: string, property?: string) {
  return page.evaluate(
    ([selector, property]) =>
      ((window as unknown as { started?: Started[] }).started ?? [])
        .filter(
          (each) =>
            each.target.matches(selector) && (!property || each.properties.includes(property)),
        )
        .map((each) => each.duration),
    [selector, property] as const,
  );
}

/** A theme's length in ms, read as the page reads it (the built site writes 400ms as .4s). */
export async function themeTime(page: Page, name: string) {
  return cssTime(
    await page.evaluate(
      (n) => getComputedStyle(document.documentElement).getPropertyValue(n),
      name,
    ),
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

/** The header's keyboard shortcuts button, which opens the shortcuts map. */
export const shortcutsButton = (page: Page) =>
  page.getByRole('button', { name: 'Keyboard shortcuts' });

/** The toolbar's calculator button, and the calculator it opens. */
export const calculatorButton = (page: Page) =>
  page.getByRole('button', { name: 'Calculator', exact: true });
export const calculatorPanel = (page: Page) => page.getByRole('group', { name: 'Calculator' });

/** The table's Hidden button, at its foot, with its count. */
export const hiddenToggle = (page: Page) => page.getByRole('button', { name: /^Hidden/ });

/** Takes focus off the page: nothing focused, as after a click on empty space. */
export const blur = (page: Page) =>
  page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

/** A unit's row in the table, by its unit id. */
export const row = (page: Page, unitId: string) => page.locator(`[data-row="${unitId}"]`);

/** A row's unit cell: what a click or a tap takes, and the cursor lands on. */
export const unitCell = (page: Page, unitId: string) =>
  row(page, unitId).getByRole('gridcell').first();

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
  'Other',
  'Custom',
  'Show custom hidden units',
  'Reset order',
]);

/**
 * Opens Units or Display, whichever holds each choice, picks it by its label ("All",
 * "Symbol and name", "No limit") or presses a button ("Show custom hidden units"), then closes the
 * panel with its close button.
 */
export async function setSettings(page: Page, ...choices: string[]) {
  for (const choice of choices) {
    const name = UNITS_CHOICES.has(choice) ? 'Units' : 'Display';
    const panel = settingsPanel(page, name);
    if (!(await panel.count())) await settingsButton(page, name).click();
    const button = panel.getByRole('button', { name: new RegExp(`^${choice}`) });
    if (await button.count()) await button.click();
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
 * The table as it was before Settings (ADR 0018): every unit, names, and six significant digits,
 * for tests whose subject is something else.
 */
export async function showEverything(page: Page) {
  await setSettings(page, 'All', 'Symbol and name', 'No limit');
}
