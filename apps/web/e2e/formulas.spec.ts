import { categories, ingredients, units } from '@bigsmall/core';
import { expect, test } from '@playwright/test';

// Every formula on the About page (docs/UX-SPEC.md §1, "About"): folded by category, Show all and
// Hide all, and Copy all as plain text.

test('the About page lists every formula, folded; Show all opens them, Hide all closes them', async ({
  page,
}) => {
  await page.goto('/about/');
  const section = page.getByRole('region', { name: 'Every formula' });
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

test('the About page heads the sketchbook and the formulas, and counts what the list holds', async ({
  page,
}) => {
  await page.goto('/about/');
  await expect(page.getByRole('heading', { name: 'The sketchbook', level: 2 })).toBeVisible();
  const section = page.getByRole('region', { name: 'Every formula' });
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
  await page.goto('/about/');
  const section = page.getByRole('region', { name: 'Every formula' });
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
  await page.goto('/about/');
  const section = page.getByRole('region', { name: 'Every formula' });
  const left = (svg: ReturnType<typeof section.locator>) =>
    svg.evaluate((icon) => icon.getBoundingClientRect().left);
  const chevron = await left(section.getByRole('button', { name: 'Show all' }).locator('svg'));
  const category = await left(section.locator('summary').first().locator('svg'));
  expect(Math.abs(chevron - category)).toBeLessThanOrEqual(1);
  // The heading and its lines stay centered over the column.
  await expect(section.getByRole('heading', { name: 'Every formula' })).toHaveCSS(
    'text-align',
    'center',
  );
});

test('an open category’s name stays under the bar while its units scroll past, then the next one’s', async ({
  page,
}) => {
  await page.goto('/about/');
  const section = page.getByRole('region', { name: 'Every formula' });
  await section.getByRole('button', { name: 'Show all' }).click();
  const hide = section.getByRole('button', { name: 'Hide all' });
  const top = (locator: ReturnType<typeof section.locator>) =>
    locator.evaluate((element) => Math.round(element.getBoundingClientRect().top));
  const toTop = (text: string) =>
    section
      .getByText(text, { exact: true })
      .evaluate((line) => line.scrollIntoView({ block: 'start' }));
  // Stuck at the window's top, the bar ends at its own height.
  const under = await hide.evaluate((button) => button.parentElement!.offsetHeight);
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
  await page.goto('/about/');
  const section = page.getByRole('region', { name: 'Every formula' });
  await section.getByRole('button', { name: 'Show all' }).click();
  const hide = section.getByRole('button', { name: 'Hide all' });
  const top = (locator: ReturnType<typeof section.locator>) =>
    locator.evaluate((element) => Math.round(element.getBoundingClientRect().top));
  // Stuck at the window's top, the bar ends at its own height.
  const under = await hide.evaluate((button) => button.parentElement!.offsetHeight);
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

test('Copy all puts every formula on the clipboard as plain text', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/about/');
  const section = page.getByRole('region', { name: 'Every formula' });
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
