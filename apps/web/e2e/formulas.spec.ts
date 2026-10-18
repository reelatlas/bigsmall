import { categories, ingredients, units } from '@bigsmall/core';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { THEMES } from '../src/lib/themes';
import { aboutPanel, aboutTab, aboutTabs, applyTheme } from './support';

// Every formula on the About page (docs/UX-SPEC.md §1, "About"): folded by category, Show all and
// Hide all, and Copy all as plain text. Under its tab since 2026-10-18.

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
  // Every unit, and under Cooking every ingredient by the cup.
  await expect(section.locator('li[data-plain]')).toHaveCount(units.length + ingredients.length);
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
  const hide = section.getByRole('button', { name: 'Hide all' });
  const top = (locator: ReturnType<typeof section.locator>) =>
    locator.evaluate((element) => Math.round(element.getBoundingClientRect().top));
  const toTop = (text: string) =>
    section
      .getByText(text, { exact: true })
      .evaluate((line) => line.scrollIntoView({ block: 'start' }));
  // Stuck at the window's top, the bar ends at its own height; the names stick a pixel under it,
  // so no hairline of the page shows between the two.
  const under = await hide.evaluate((button) =>
    Math.round(button.parentElement!.getBoundingClientRect().height - 1),
  );
  const length = section.locator('summary').first();
  const weight = section.locator('summary').filter({ hasText: /^\s*Weight/ });

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
  const hide = section.getByRole('button', { name: 'Hide all' });
  const top = (locator: ReturnType<typeof section.locator>) =>
    locator.evaluate((element) => Math.round(element.getBoundingClientRect().top));
  // Stuck at the window's top, the bar ends at its own height; the names stick a pixel under it,
  // so no hairline of the page shows between the two.
  const under = await hide.evaluate((button) =>
    Math.round(button.parentElement!.getBoundingClientRect().height - 1),
  );
  const length = section.locator('summary').first();
  const weight = section.locator('summary').filter({ hasText: /^\s*Weight/ });

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
    units.length + ingredients.length,
  );
});

test('a formula’s tag is trimmed to its x-height, so the word’s body sits centered in a 16 px pill', async ({
  page,
}) => {
  // docs/DESIGN-SYSTEM.md, "Small labels" (Sean, 2026-10-18: the word sat higher than centered;
  // a trim to the cap height left it there, the cap standing over the x-height).
  const section = await openFormulas(page);
  await section.getByRole('button', { name: 'Show all' }).click();
  const tag = section.getByText('exact', { exact: true }).first();
  await expect(tag).toBeVisible();
  const trims = await page.evaluate(() => CSS.supports('text-box-trim', 'trim-both'));
  test.skip(!trims, 'this browser has no text-box-trim yet: the tag keeps its line box');
  const box = await tag.evaluate((el) => {
    const style = getComputedStyle(el);
    const root = getComputedStyle(document.documentElement);
    const ink = document.createElement('canvas').getContext('2d')!;
    ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    return {
      trim: style.getPropertyValue('text-box-trim'),
      edge: style.getPropertyValue('text-box-edge'),
      height: el.getBoundingClientRect().height,
      x: ink.measureText('x').actualBoundingBoxAscent,
      padTop: parseFloat(style.paddingTop),
      padBottom: parseFloat(style.paddingBottom),
      step: parseFloat(root.getPropertyValue('--spacing')) * parseFloat(root.fontSize),
    };
  });
  expect(box.trim).toBe('trim-both');
  expect(box.edge).toBe('ex alphabetic');
  // The box is the x-height and an even padding, none of the font's ascent or descent, and the
  // pill stands four spacing steps tall.
  expect(Math.abs(box.padTop - box.padBottom)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(box.height - (box.x + box.padTop + box.padBottom))).toBeLessThanOrEqual(1);
  expect(Math.abs(box.height - box.step * 4)).toBeLessThanOrEqual(1);
});
