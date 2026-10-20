import { expect, test } from '@playwright/test';
import {
  box,
  calculatorButton,
  calculatorPanel,
  copyCell,
  menu,
  ready,
  row,
  unitCell,
} from './support';

// A touch screen (docs/UX-SPEC.md §8, "On a touch screen", ADR 0015): the on-screen keyboard
// comes up only from a tap in the box. A tap anywhere else never moves focus into it, a tap in the
// table puts the keyboard away, and Done on the keyboard finishes and puts it away. A click or a
// key keeps the desktop's flow, the caret back in the box (table.spec.ts, keyboard.spec.ts).

test.skip(({ isMobile }) => !isMobile, 'taps need a touch screen');

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
  await page.getByRole('button', { name: 'Unit: liters' }).tap();
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

  const calculatorIcon = calculatorButton(page);
  await calculatorIcon.tap();
  const calculator = calculatorPanel(page);
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

test('the box’s ×, tapped, clears the number and leaves the keyboard as it was', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  // Down: it stays down.
  await page.getByRole('button', { name: 'Clear number' }).tap();
  await expect(box(page)).toHaveValue('');
  await expect(box(page)).not.toBeFocused();
  await expect(page.getByRole('button', { name: 'Remove milliliters' })).toBeVisible();
  // Up: it stays up, to type the next number.
  await box(page).tap();
  await page.keyboard.type('5');
  await page.getByRole('button', { name: 'Clear number' }).tap();
  await expect(box(page)).toHaveValue('');
  await expect(box(page)).toBeFocused();
});

test('with a unit in the box the number pad comes up, but not where values go below zero', async ({
  page,
}) => {
  const mode = async (path: string) => {
    await page.goto(path);
    await ready(page);
    return box(page).getAttribute('inputmode');
  };
  // No unit yet: letters type one ("2 cups").
  expect(await mode('/')).toBe('text');
  expect(await mode('/?a=milliliter')).toBe('decimal');
  expect(await mode('/?a=celsius&v=-40')).toBe('text');
  expect(await mode('/?a=degree')).toBe('text');
  // The chip's × takes the unit out, and the letters come back.
  await page.goto('/?a=milliliter&v=250');
  await ready(page);
  await page.getByRole('button', { name: 'Remove milliliters' }).tap();
  await expect(box(page)).toHaveAttribute('inputmode', 'text');
});

test('a second tap on a row copies what it shows, the check flashing; a tap at a row’s end takes that row', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName === 'webkit', 'WebKit grants the test runner no clipboard permission');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?a=us-cup&v=2');
  await ready(page);
  // A tap takes the row into the box, the keyboard staying down; a second tap within the window
  // copies it as the row shows it, the check flashing over its end (Sean, 2026-10-19).
  await unitCell(page, 'liter').tap();
  await expect(page.getByRole('button', { name: 'Remove liters' })).toBeVisible();
  await unitCell(page, 'liter').tap();
  await expect(copyCell(page, 'liter').locator('[data-copied]')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('0.47');
  await expect(box(page)).not.toBeFocused();
  // No button sits in a row: a tap at a row's end takes that row.
  const pint = row(page, 'us-pint');
  const size = (await pint.boundingBox())!;
  await pint.tap({ position: { x: size.width - 12, y: size.height / 2 } });
  await expect(page.getByRole('button', { name: 'Remove pints' })).toBeVisible();
});
