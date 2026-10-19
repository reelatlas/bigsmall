import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';
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

/** Waits for an Astro island to hydrate: Astro drops its `ssr` mark then (docs/LEARNINGS.md). */
export async function islandReady(island: Locator) {
  await expect(island).not.toHaveAttribute('ssr');
}

/**
 * Waits for every island that hydrates on load (`client:load`), what a page shows once scripted,
 * before a read of its colors (docs/LEARNINGS.md, "A color read right after a change catches the
 * transition's first frame"). An island that hydrates as it comes into view is left to the test
 * that scrolls to it.
 */
export async function islandsReady(page: Page) {
  await expect(page.locator('astro-island[client="load"][ssr]')).toHaveCount(0);
}

/**
 * Sets the window so the page's content is as wide as a `width` px window's with no classic
 * scrollbar. The page keeps the scrollbar's room always (`scrollbar-gutter: stable`, global.css),
 * 15 px where scrollbars are classic (CI's Linux, Windows, this headless Chromium too) and none
 * where they overlay (phones, macOS); the design's widths are a phone's, the content's. After the
 * page has loaded, since the room is the page's own style (docs/LEARNINGS.md, 2026-10-18).
 */
export async function windowOf(page: Page, width: number, height: number) {
  const gutter = await page.evaluate(
    () => document.documentElement.clientWidth - document.body.clientWidth,
  );
  await page.setViewportSize({ width: width + gutter, height });
}

/** How far the page runs past the window sideways: 0 where it fits, the scrollbar's room aside. */
export async function sidewaysOverflow(page: Page) {
  return page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  );
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

/** A theme token's color as painted (`--accent` as rgb), which a computed color is compared to. */
export async function tokenColor(page: Page, name: string) {
  return page.evaluate((token) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${token})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);
}

/** Runs axe on the page as it is and fails on any violation. */
export async function expectNoA11yViolations(page: Page) {
  await settled(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
}

/** The page's own header, under `main` (a dev server started by hand draws headers of its own). */
export const pageHeader = (page: Page) => page.locator('main > header');

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

/**
 * The converter's box, the field named "Value" (exactly, so no other name containing it matches).
 */
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

/** A row's copy cell, laid over its end, shown on the active row alone. */
export const copyCell = (page: Page, unitId: string) =>
  row(page, unitId).locator('[data-copy-cell]');

/** The table's sections' ids in the order shown, from their `data-section` marks. */
export async function sectionIds(page: Page) {
  return page
    .locator('[data-section]')
    .evaluateAll((all) => all.map((each) => each.getAttribute('data-section')));
}

/**
 * A settings panel's button, Units or Display, in the converter's toolbar (not the dev toolbar's).
 */
export const settingsButton = (page: Page, name: 'Units' | 'Display') =>
  page.getByRole('toolbar', { name: 'Tools' }).getByRole('button', { name, exact: true });

/**
 * Presses a tool of the converter's toolbar by its name, wherever the row has put it: its button
 * on the row, or, where a pointer's row had no room for it, its item in More (ADR 0023).
 */
export async function pressTool(page: Page, name: string) {
  const bar = page.getByRole('toolbar', { name: 'Tools' });
  const button = bar.getByRole('button', { name, exact: true });
  if (await button.count()) {
    await button.click();
    return;
  }
  await bar.getByRole('button', { name: 'More tools' }).click();
  await page.getByRole('menuitem', { name, exact: true }).click();
}

/**
 * Presses a checkbox or radio by its row. The native input is drawn by its label (Checkbox,
 * SegmentedControl) and sits clipped out of sight, so a click on it lands on nothing; the label,
 * a 44 px row, is the target a visitor presses.
 */
export const pressControl = (control: Locator) =>
  control.locator('xpath=ancestor::label[1]').click();

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
    if (!(await panel.count())) await pressTool(page, name);
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

/** The About page's row of tabs, Feedback and Every formula (docs/UX-SPEC.md §1, "About"). */
export const aboutTabs = (page: Page) => page.getByRole('tablist', { name: 'About' });

/** One of the About page's tabs, by its name, exactly. */
export const aboutTab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true });

/** An About tab's panel, by the tab's name, exactly. */
export const aboutPanel = (page: Page, name: string) =>
  page.getByRole('tabpanel', { name, exact: true });

/** Waits for the sketchbook to play: its grid carries `data-playing` once its island runs. */
export async function sketchbookReady(page: Page) {
  await page.locator('[data-playing]').waitFor();
}

/**
 * Where each run of text in an element sits: the y of its baseline, one per run, the visually
 * hidden ones left out. A zero-size inline-block rests on the baseline of the line it is in (CSS 2
 * §10.8), so each run is wrapped for a moment with one after it and the probe's top read; a run
 * that is a flex item of its own keeps its layout wrapped, since a span as a flex item is laid out
 * as the anonymous item was. Text beside text aligns on the baseline (docs/LEARNINGS.md,
 * 2026-10-10): a word and its count in another face share one when the spread is under half a
 * pixel; centred beside each other instead, a monospace digit's sits about a pixel higher.
 */
async function baselines(locator: Locator): Promise<number[]> {
  return locator.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const runs: Text[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node as Text;
      if (!text.textContent?.trim() || text.parentElement?.closest('.sr-only')) continue;
      runs.push(text);
    }
    return runs.map((text) => {
      const wrap = document.createElement('span');
      const probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;width:0;height:0';
      text.replaceWith(wrap);
      wrap.append(text, probe);
      const top = probe.getBoundingClientRect().top;
      wrap.replaceWith(text);
      return top;
    });
  });
}

/** The spread of a few baselines: zero when they are one. */
const spread = (tops: number[]) => Math.max(...tops) - Math.min(...tops);

/**
 * How far a count sits off its word's baseline, read with the count shrunk to 8 px: on one baseline
 * (`LABEL_WITH_COUNT`) a smaller digit still sits on the line, so the spread stays at zero; centred
 * beside the word instead, it rises with its line box. Read at the count's own size, fonts whose
 * metrics happen to agree at one zoom can hide a centring, as Hardhat's did on 2026-10-19.
 */
export async function countOffBaseline(locator: Locator): Promise<number> {
  const counts = locator.locator('.font-numeric');
  const size = (value: string) =>
    counts.evaluateAll((spans, size) => {
      for (const span of spans) (span as HTMLElement).style.fontSize = size;
    }, value);
  await size('8px');
  const tops = await baselines(locator);
  await size('');
  return spread(tops);
}
