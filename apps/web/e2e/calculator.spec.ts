import { expect, test } from '@playwright/test';
import { TYPING_CHUNK_MS } from '../src/lib/timing';
import { boxes, expectNoA11yViolations, MARGIN_MS, ready } from './support';

// The calculator scratch pad (docs/UX-SPEC.md §8, "The calculator").

test('the calculator holds the keyboard, cycles Enter targets with Tab, and steps back with Escape', async ({
  page,
}) => {
  await page.goto('/?a=milliliter&b=liter&v=1&s=a');
  await ready(page);
  const { first, second } = boxes(page);
  const toggle = page.getByRole('button', { name: 'Calculator' });
  const calculator = page.getByRole('group', { name: 'Calculator' });
  const key = (name: string) => calculator.getByRole('button', { name, exact: true });
  const entry = calculator.locator('[data-entry]');
  const useIn = (ordinal: string) =>
    calculator.getByRole('button', { name: new RegExp(`^Use in ${ordinal}`) });
  const close = calculator.getByRole('button', { name: 'Close calculator' });

  // Opening puts focus on =, so typing and Enter reach the calculator at once.
  await toggle.click();
  await expect(key('equals')).toBeFocused();
  await expect(useIn('1st')).toHaveAttribute('aria-disabled', 'true');
  await expectNoA11yViolations(page);
  await page.keyboard.type('12*3');
  await expect(entry).toHaveText('12×3 = 36');
  await expect(first).toHaveValue('1');
  await page.keyboard.press('Enter');
  await expect(entry).toHaveText('36');

  // Tab cycles =, Use in 1st, Use in 2nd, Close; Enter presses whichever has focus.
  await page.keyboard.press('Tab');
  await expect(useIn('1st')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(useIn('2nd')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(key('equals')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(useIn('2nd')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(second).toHaveValue('36');
  await expect(first).toHaveValue('36,000');
  // After a send, focus is back on =, so Enter cannot send the same number again.
  await expect(key('equals')).toBeFocused();
  await expect(
    page.getByRole('status').filter({ hasText: 'Sent to the second value' }),
  ).toHaveCount(1);

  // One history: undo takes back the send, then the =, and redo puts both back.
  await page.keyboard.press('Control+z');
  await expect(second).toHaveValue('0.001');
  await page.keyboard.press('Control+z');
  await expect(entry).toHaveText('12×3 = 36');
  await page.keyboard.press('Control+y');
  await page.keyboard.press('Control+y');
  await expect(entry).toHaveText('36');
  await expect(second).toHaveValue('36');

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

test('the calculator says why its number has no value to use', async ({ page }) => {
  await page.goto('/?a=milliliter&b=liter&v=1&s=a');
  await ready(page);
  await page.getByRole('button', { name: 'Calculator' }).click();
  const calculator = page.getByRole('group', { name: 'Calculator' });
  const message = calculator.locator('[data-calculator-message]');
  const equals = calculator.getByRole('button', { name: 'equals', exact: true });
  const useIn = calculator.getByRole('button', { name: /^Use in 1st/ });

  // A large exponent: the display says so, and nothing can be sent until it is back in range.
  await page.keyboard.type('9^999');
  await expect(message).toHaveText('Too large');
  await expect(equals).toHaveAccessibleDescription('Too large');
  await expect(useIn).toHaveAttribute('aria-disabled', 'true');
  await expect(useIn).toHaveAccessibleDescription('Too large');
  await page.keyboard.press('Backspace');
  await expect(message).toHaveCount(0);
  await expect(useIn).not.toHaveAttribute('aria-disabled', 'true');

  await calculator.getByRole('button', { name: 'clear', exact: true }).click();
  await page.keyboard.type('1e-999');
  await expect(message).toHaveText('Too small');
  await calculator.getByRole('button', { name: 'clear', exact: true }).click();
  await page.keyboard.type('5/0');
  await expect(message).toHaveText('Can’t divide by zero');
  await expectNoA11yViolations(page);
});
