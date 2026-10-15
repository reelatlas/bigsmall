import { expect, test } from '@playwright/test';
import { TYPING_CHUNK_MS } from '../src/lib/timing';
import {
  blur,
  box,
  calculatorButton,
  calculatorPanel,
  expectNoA11yViolations,
  MARGIN_MS,
  ready,
  row,
} from './support';

// The calculator scratch pad (docs/UX-SPEC.md §8, "The calculator"): its keys, its Tab cycle,
// Escape, "Use" into the box, and one history with the box. Where it opens is in table.spec.ts.

test('the calculator holds the keyboard, cycles Enter targets with Tab, and steps back with Escape', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&v=1');
  await ready(page);
  const toggle = calculatorButton(page);
  const calculator = calculatorPanel(page);
  const key = (name: string) => calculator.getByRole('button', { name, exact: true });
  const entry = calculator.locator('[data-entry]');
  const use = calculator.getByRole('button', { name: /^Use/ });
  const close = calculator.getByRole('button', { name: 'Close calculator' });

  // Opening puts focus on =, so typing and Enter reach the calculator at once.
  await toggle.click();
  await expect(key('equals')).toBeFocused();
  await expect(use).toHaveAttribute('aria-disabled', 'true');
  await expectNoA11yViolations(page);
  await page.keyboard.type('12*3');
  await expect(entry).toHaveText('12×3 = 36');
  await expect(box(page)).toHaveValue('1');
  await page.keyboard.press('Enter');
  await expect(entry).toHaveText('36');

  // Tab cycles =, Use, Close; Enter presses whichever has focus.
  await page.keyboard.press('Tab');
  await expect(use).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(key('equals')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(use).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(box(page)).toHaveValue('36');
  // Two places, as a fresh visit writes values.
  await expect(row(page, 'liter')).toContainText('0.04');
  // After a send, focus is back on =, so Enter cannot send the same number again.
  await expect(key('equals')).toBeFocused();
  await expect(page.getByRole('status').filter({ hasText: 'Sent to the value' })).toHaveCount(1);

  // One history: undo takes back the send, then the =, and redo puts both back.
  await page.keyboard.press('Control+z');
  await expect(box(page)).toHaveValue('1');
  await page.keyboard.press('Control+z');
  await expect(entry).toHaveText('12×3 = 36');
  await page.keyboard.press('Control+y');
  await page.keyboard.press('Control+y');
  await expect(entry).toHaveText('36');
  await expect(box(page)).toHaveValue('36');

  // Escape takes back one burst of typing at a time, then closes once the display is empty.
  await page.keyboard.type('12345');
  await page.waitForTimeout(TYPING_CHUNK_MS + MARGIN_MS);
  await page.keyboard.type('678');
  await page.waitForTimeout(TYPING_CHUNK_MS + MARGIN_MS);
  await page.keyboard.type('9');
  await page.keyboard.press('Backspace');
  await page.keyboard.type('+1');
  await expect(entry).toHaveText('12345678+1 = 12,345,679');
  await page.keyboard.press('Escape');
  await expect(entry).toHaveText('12345678');
  await page.keyboard.press('Escape');
  await expect(entry).toHaveText('12345');
  await page.keyboard.press('Escape');
  await expect(entry).toHaveText('0');
  await page.keyboard.press('Escape');
  await expect(calculator).toHaveCount(0);
  await expect(toggle).toBeFocused();

  // A click elsewhere leaves it open; a key click brings the keyboard back to it.
  await toggle.click();
  await page.keyboard.type('4e2');
  await expect(entry).toHaveText('4E2');
  await page.getByRole('heading', { level: 1 }).click();
  await expect(calculator).toBeVisible();
  await key('5').click();
  await page.keyboard.type('6');
  await expect(entry).toHaveText('4E256');

  // Close keeps the entry for next time.
  await close.click();
  await expect(calculator).toHaveCount(0);
  await toggle.click();
  await expect(entry).toHaveText('4E256');
});

test('the arrows move between the calculator’s keys; Enter presses the one with focus; typing goes back to =', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'the arrows need a keyboard');
  await page.goto('/?a=milliliter&v=1');
  await ready(page);
  await calculatorButton(page).click();
  const calculator = calculatorPanel(page);
  const key = (name: string) => calculator.getByRole('button', { name, exact: true });
  const entry = calculator.locator('[data-entry]');
  const close = calculator.getByRole('button', { name: 'Close calculator' });
  await expect(key('equals')).toBeFocused();

  // Up a column and along a row; Enter presses the key with focus, which keeps it.
  await page.keyboard.press('ArrowUp');
  await expect(key('plus')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(key('3')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(entry).toHaveText('33');
  await expect(key('3')).toBeFocused();

  // Typing goes back to =, so Enter then works the sum out.
  await page.keyboard.type('+4');
  await expect(key('equals')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(entry).toHaveText('37');

  // Down to "Use" and back up to the key it left; the top row reaches close, and nothing wraps.
  await page.keyboard.press('ArrowDown');
  await expect(calculator.getByRole('button', { name: /^Use/ })).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(key('equals')).toBeFocused();
  for (let row = 0; row < 4; row += 1) await page.keyboard.press('ArrowUp');
  await expect(key('divided by')).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(close).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(close).toBeFocused();

  // From a key the arrows reached, Tab goes on to the next stop.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowLeft');
  await expect(key('to the power of')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(key('equals')).toBeFocused();
});

test('Alt+C opens and closes the calculator; closed from inside, focus goes back where it was', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Alt+C needs a keyboard');
  await page.goto('/?a=milliliter&v=1');
  await ready(page);
  const toggle = calculatorButton(page);
  const calculator = calculatorPanel(page);
  const equals = calculator.getByRole('button', { name: 'equals', exact: true });
  await expect(toggle).toHaveAttribute('aria-keyshortcuts', 'Alt+C');
  await expect(toggle).toHaveAttribute('title', 'Calculator (Alt+C)');

  // From the box: it opens on =, and Alt+C inside it closes it, focus back in the box.
  await box(page).click();
  await page.keyboard.press('Alt+c');
  await expect(equals).toBeFocused();
  await page.keyboard.press('Alt+c');
  await expect(calculator).toHaveCount(0);
  await expect(box(page)).toBeFocused();
  // Open, with focus back in the box: Alt+C just closes it, and focus stays in the box.
  await page.keyboard.press('Alt+c');
  await box(page).click();
  await page.keyboard.press('Alt+c');
  await expect(calculator).toHaveCount(0);
  await expect(box(page)).toBeFocused();

  // With nothing focused, closing comes back to the box; Escape on an empty display does too.
  await blur(page);
  await page.keyboard.press('Alt+c');
  await expect(equals).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(calculator).toHaveCount(0);
  await expect(box(page)).toBeFocused();
});

test('the calculator says why its number has no value to use', async ({ page }) => {
  await page.goto('/?a=milliliter&v=1');
  await ready(page);
  await calculatorButton(page).click();
  const calculator = calculatorPanel(page);
  const message = calculator.locator('[data-calculator-message]');
  const equals = calculator.getByRole('button', { name: 'equals', exact: true });
  const use = calculator.getByRole('button', { name: /^Use/ });

  // A large exponent: the display says so, and nothing can be sent until it is back in range.
  await page.keyboard.type('9^999');
  await expect(message).toHaveText('Too large');
  await expect(equals).toHaveAccessibleDescription('Too large');
  await expect(use).toHaveAttribute('aria-disabled', 'true');
  await expect(use).toHaveAccessibleDescription('Too large');
  await page.keyboard.press('Backspace');
  await expect(message).toHaveCount(0);
  await expect(use).not.toHaveAttribute('aria-disabled', 'true');

  await calculator.getByRole('button', { name: 'clear', exact: true }).click();
  await page.keyboard.type('1e-999');
  await expect(message).toHaveText('Too small');
  await calculator.getByRole('button', { name: 'clear', exact: true }).click();
  await page.keyboard.type('5/0');
  await expect(message).toHaveText('Can’t divide by zero');
  await expectNoA11yViolations(page);
});
