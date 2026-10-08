import { expect, test, type Page } from '@playwright/test';
import { box, menu, ready } from './support';

// A touch screen (docs/UX-SPEC.md §8, "On a touch screen", ADR 0015): the on-screen keyboard
// comes up only from a tap in the box. A tap anywhere else never moves focus into it, a tap in the
// table puts the keyboard away, and Done on the keyboard finishes and puts it away. A click or a
// key keeps the desktop's flow, the caret back in the box (table.spec.ts, keyboard.spec.ts).

test.skip(({ isMobile }) => !isMobile, 'taps need a touch screen');

const unitCell = (page: Page, unitId: string) =>
  page.locator(`[data-row="${unitId}"]`).getByRole('gridcell').first();

test('a tile, a row, and a choice in the category menu, tapped, never bring the keyboard up', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await page
    .getByRole('listbox', { name: 'Categories' })
    .getByRole('option', { name: /^Volume/ })
    .tap();
  await expect(page.getByRole('region', { name: 'Volume' })).toBeVisible();
  await expect(box(page)).not.toBeFocused();

  await unitCell(page, 'milliliter').tap();
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  await expect(box(page)).not.toBeFocused();

  // The menu closes onto its own button, as the theme menu does.
  await menu(page).tap();
  await page
    .locator('label')
    .filter({ hasText: /^Length/ })
    .tap();
  await expect(menu(page)).toHaveText(/Length/);
  await expect(menu(page)).toBeFocused();
  await expect(box(page)).not.toBeFocused();
});

test('a tap in the box brings the keyboard up; a tap on a row, or Done, puts it away', async ({
  page,
}) => {
  await page.goto('/?a=milliliter');
  await ready(page);
  await box(page).tap();
  await expect(box(page)).toBeFocused();
  await page.keyboard.type('250');

  // A row tapped: its value moves into the box, and the keyboard goes away.
  await unitCell(page, 'liter').tap();
  await expect(box(page)).toHaveValue('0.25');
  await expect(page.getByRole('button', { name: 'Remove liters' })).toBeVisible();
  await expect(box(page)).not.toBeFocused();

  // Done, the keyboard's Enter: the sum worked out, and the keyboard away.
  await box(page).tap();
  await expect(box(page)).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.type('+1');
  await page.keyboard.press('Enter');
  await expect(box(page)).toHaveValue('1.25');
  await expect(box(page)).not.toBeFocused();

  // The chip's name is part of the box: a tap on it brings the keyboard up too.
  await page.getByRole('button', { name: 'Change unit: liters' }).tap();
  await expect(box(page)).toBeFocused();
});

test('the chip’s ×, clear all, and the calculator, tapped, leave the keyboard down', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  await page.getByRole('button', { name: 'Remove milliliters' }).tap();
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
  await expect(box(page)).not.toBeFocused();

  const calculatorIcon = page.getByRole('button', { name: 'Calculator', exact: true });
  await calculatorIcon.tap();
  const calculator = page.getByRole('group', { name: 'Calculator' });
  await expect(calculator.getByRole('button', { name: 'equals', exact: true })).toBeFocused();
  await calculator.getByRole('button', { name: '7', exact: true }).tap();
  await calculator.getByRole('button', { name: /^Use/ }).tap();
  await expect(box(page)).toHaveValue('7');
  await expect(box(page)).not.toBeFocused();
  await calculator.getByRole('button', { name: 'Close calculator' }).tap();
  await expect(calculatorIcon).toBeFocused();

  await page.getByRole('button', { name: 'Clear all' }).tap();
  await expect(box(page)).toHaveValue('');
  await expect(box(page)).not.toBeFocused();
});
