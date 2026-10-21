import { categories, ingredients, units } from '@bigsmall/core';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { THEMES } from '../src/lib/themes';
import { aboutPanel, aboutTab, aboutTabs, applyTheme } from './support';

/**
 * The brands' charts under Shoe size (ADR 0028), lines of their own: counted from the file core is
 * given (ADR 0029), read as the package exports it.
 */
const chartsFile = JSON.parse(
  readFileSync(
    createRequire(import.meta.url).resolve('@bigsmall/core/data/shoe-brands.json'),
    'utf8',
  ),
) as { charts: Record<string, unknown[]> };
const CHARTS = Object.values(chartsFile.charts).reduce((count, charts) => count + charts.length, 0);

// Every formula on the About page (docs/UX-SPEC.md §1, "About"): folded by category, Show all and
// Hide all, and Copy all as plain text. Under its tab since 2026-10-18.

/**
 * What the two tests of the stuck names measure: a locator's top, a line scrolled to the window's
 * top, where a name sticks (stuck at the window's top, the bar ends at its own height, and the
 * names stick a pixel under it, so no hairline of the page shows between the two), and Length's
 * and Weight's names.
 */
function stuckNames(section: Locator) {
  const hide = section.getByRole('button', { name: 'Hide all' });
  return {
    top: (locator: Locator) =>
      locator.evaluate((element) => Math.round(element.getBoundingClientRect().top)),
    toTop: (text: string) =>
      section
        .getByText(text, { exact: true })
        .evaluate((line) => line.scrollIntoView({ block: 'start' })),
    under: hide.evaluate((button) =>
      Math.round(button.parentElement!.getBoundingClientRect().height - 1),
    ),
    length: section.locator('summary').first(),
    weight: section.locator('summary').filter({ hasText: /^\s*Weight/ }),
  };
}

/** The About page with Every formula open: its hash opens the tab once the tabs hydrate. */
async function openFormulas(page: Page) {
  await page.goto('/about/#formulas');
  await expect(aboutTab(page, 'Every formula')).toHaveAttribute('aria-selected', 'true');
  return aboutPanel(page, 'Every formula');
}

test('the About page lists every formula, folded; Show all opens them, Hide all closes them', async ({
  page,
}) => {
  const section = await openFormulas(page);
  const groups = section.locator('details');
  await expect(groups).toHaveCount(categories.length);
  // Every unit, under Cooking every ingredient by the cup, and under Shoe size every brand's chart.
  await expect(section.locator('li[data-plain]')).toHaveCount(
    units.length + ingredients.length + CHARTS,
  );
  await expect(section.locator('details[open]')).toHaveCount(0);
  const toggle = section.getByRole('button', { name: 'Show all' });
  await toggle.click();
  await expect(section.locator('details[open]')).toHaveCount(categories.length);
  await expect(section.getByRole('button', { name: 'Hide all' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(section.getByText('1 mi = 1609.344 m', { exact: true })).toBeVisible();
  // One category closed on its own: the button offers Show all again.
  await section.locator('summary').first().click();
  await expect(section.getByRole('button', { name: 'Show all' })).toBeVisible();
  await section.getByRole('button', { name: 'Show all' }).click();
  await section.getByRole('button', { name: 'Hide all' }).click();
  await expect(section.locator('details[open]')).toHaveCount(0);
});

test('the About page heads the sketchbook, titles the formulas by their tab, and counts what the list holds', async ({
  page,
}) => {
  const section = await openFormulas(page);
  await expect(page.getByRole('heading', { name: 'The sketchbook', level: 2 })).toBeVisible();
  // The tab is the title: no heading doubles it (Sean, 2026-10-18).
  await expect(page.getByRole('heading', { name: 'Every formula' })).toHaveCount(0);
  await expect(section).toContainText(
    `${units.length} units · ${categories.length} categories · 16 digits in each factor`,
  );
  // A category's count runs straight into its base unit, no comma (Sean, 2026-10-16).
  await expect(section.locator('summary').first()).toContainText(
    /^\s*Length\s*\d+ units in meters$/,
  );
});

test('the bar with Hide all stays at the window’s top while the open list scrolls past', async ({
  page,
}) => {
  const section = await openFormulas(page);
  await section.getByRole('button', { name: 'Show all' }).click();
  const hide = section.getByRole('button', { name: 'Hide all' });
  await expect(hide).toBeVisible();
  // Deep in the list, the bar is still at the top of the window.
  await section.getByText('1 lb = 0.45359237 kg', { exact: true }).scrollIntoViewIfNeeded();
  await page.evaluate(() => scrollBy(0, innerHeight));
  const top = await hide.evaluate((button) => button.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(0);
  expect(top).toBeLessThan(16);
  await hide.click();
  await expect(section.locator('details[open]')).toHaveCount(0);
});

test('the tools sit on the list’s left edge, Show all’s chevron over the categories’ own', async ({
  page,
}) => {
  const section = await openFormulas(page);
  const left = (locator: Locator) =>
    locator.evaluate((element) => element.getBoundingClientRect().left);
  // In every theme, whose fonts set the lines' own widths.
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    const chevron = await left(section.getByRole('button', { name: 'Show all' }).locator('svg'));
    const category = await left(section.locator('summary').first().locator('svg'));
    expect(Math.abs(chevron - category), theme.id).toBeLessThanOrEqual(1);
    // Its lines sit on the column's left edge with the tabs (centered under a heading until
    // 2026-10-18).
    const lead = await left(section.getByText('Each conversion in its category'));
    const tabs = await left(aboutTabs(page));
    expect(Math.abs(lead - tabs), theme.id).toBeLessThanOrEqual(1);
  }
});

test('an open category’s name stays under the bar while its units scroll past, then the next one’s', async ({
  page,
}) => {
  const section = await openFormulas(page);
  await section.getByRole('button', { name: 'Show all' }).click();
  const { top, toTop, length, weight } = stuckNames(section);
  const under = await stuckNames(section).under;

  // Deep in Length's units, Length's name sits right under the bar.
  await toTop('1 mi = 1609.344 m');
  await expect.poll(() => top(length)).toBe(under);
  // Deep in Weight's, Weight's name has taken its place, and Length's has gone up with its list.
  await toTop('1 lb = 0.45359237 kg');
  await expect.poll(() => top(weight)).toBe(under);
  expect(await top(length)).toBeLessThan(under);
});

test('a category closed from under the bar stays there, and so does the one being read on Hide all', async ({
  page,
}) => {
  const section = await openFormulas(page);
  await section.getByRole('button', { name: 'Show all' }).click();
  const { top, length, weight } = stuckNames(section);
  const under = await stuckNames(section).under;

  // Closing Length from where its name sticks leaves it there, rather than the page jumping on.
  await section
    .getByText('1 mi = 1609.344 m', { exact: true })
    .evaluate((line) => line.scrollIntoView({ block: 'start' }));
  await expect.poll(() => top(length)).toBe(under);
  await length.click();
  await expect(section.locator('details').first()).not.toHaveAttribute('open');
  expect(await top(length)).toBe(under);

  // Hide all from deep in Weight's units leaves Weight's name where it was.
  await section
    .getByText('1 lb = 0.45359237 kg', { exact: true })
    .evaluate((line) => line.scrollIntoView({ block: 'start' }));
  await expect.poll(() => top(weight)).toBe(under);
  await section.getByRole('button', { name: 'Show all' }).click();
  await section.getByRole('button', { name: 'Hide all' }).click();
  await expect(section.locator('details[open]')).toHaveCount(0);
  // As far as the page, now short, can scroll: right under the bar, or the page at its end.
  const atEnd = await page.evaluate(
    () => scrollY + innerHeight >= document.documentElement.scrollHeight - 1,
  );
  if (!atEnd) expect(await top(weight)).toBe(under);
  else expect(await top(weight)).toBeGreaterThanOrEqual(under);
});

test('Copy all puts every formula on the clipboard as plain text', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName === 'webkit', 'WebKit grants the test runner no clipboard permission');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const section = await openFormulas(page);
  await section.getByRole('button', { name: 'Copy all as text' }).click();
  await expect(section.getByRole('button', { name: 'Copied' })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('bigsmall: every conversion factor and formula');
  expect(copied).toContain('## Length (base unit: meter, m)');
  expect(copied).toContain('- mile (mi): 1 mi = 1609.344 m, exact. Source:');
  expect(copied.split('\n').filter((line) => line.startsWith('- '))).toHaveLength(
    units.length + ingredients.length + CHARTS,
  );
});

test('a formula’s tag is trimmed to its cap height, so the word sits centered in it', async ({
  page,
}) => {
  // docs/DESIGN-SYSTEM.md, "Small labels" (Sean, 2026-10-18: the word sat higher than centered,
  // the font's ascent over its cap counted in the line box). The tag's face is the theme's, so
  // the trim is read in every theme.
  const section = await openFormulas(page);
  await section.getByRole('button', { name: 'Show all' }).click();
  const tag = section.getByText('exact', { exact: true }).first();
  await expect(tag).toBeVisible();
  const trims = await page.evaluate(() => CSS.supports('text-box-trim', 'trim-both'));
  test.skip(!trims, 'this browser has no text-box-trim yet: the tag keeps its line box');
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    const box = await tag.evaluate((el) => {
      const style = getComputedStyle(el);
      const ink = document.createElement('canvas').getContext('2d')!;
      ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      return {
        trim: style.getPropertyValue('text-box-trim'),
        edge: style.getPropertyValue('text-box-edge'),
        height: el.getBoundingClientRect().height,
        cap: ink.measureText('H').actualBoundingBoxAscent,
        padding: parseFloat(style.paddingTop) + parseFloat(style.paddingBottom),
      };
    });
    expect(box.trim, theme.id).toBe('trim-both');
    expect(box.edge, theme.id).toBe('cap alphabetic');
    expect(box.padding, theme.id).toBeGreaterThan(0);
    // The box is the cap height and the padding, none of the font's ascent or descent.
    expect(Math.abs(box.height - (box.cap + box.padding)), theme.id).toBeLessThanOrEqual(1);
  }
});
