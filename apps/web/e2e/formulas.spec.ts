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
