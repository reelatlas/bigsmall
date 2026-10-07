import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_LIGHT, THEMES } from '../src/lib/themes';
import { PEEK_CLOSE_MS } from '../src/lib/timing';
import { expectNoA11yViolations, ready, settled } from './support';

const themeToggle = (page: Page) => page.getByRole('button', { name: /^Theme/ });

/** Picks a theme the way a mouse user does: open the menu, click the option's label. */
async function pickTheme(page: Page, name: string) {
  await themeToggle(page).click();
  await page
    .locator('label')
    .filter({ hasText: new RegExp(`^${name}$`) })
    .click();
}

for (const path of ['/', '/dev/gallery']) {
  test(`${path} renders with no WCAG violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page);
  });
}

test('a conversion loads from the URL', async ({ page }) => {
  await page.goto('/?a=mile&b=kilometer&v=1&s=a');
  await expect(page.getByRole('combobox', { name: 'Second value' })).toHaveValue('1.609344');
});

test('theme choice applies immediately, closes the menu, and survives reload', async ({ page }) => {
  await page.goto('/');
  await pickTheme(page, 'Sakura');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sakura');
  await expect(themeToggle(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: 'Theme Sakura' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sakura');
  await expect(page.getByRole('button', { name: 'Theme Sakura' })).toBeVisible();
});

test('the theme menu closes on Escape, a click outside, and focus leaving it', async ({ page }) => {
  await page.goto('/');
  const toggle = themeToggle(page);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.getByRole('heading', { level: 1 }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  // Tab out of the open menu: it must not stay drawn over the control that now has focus.
  await toggle.click();
  await page.keyboard.press('Tab');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('arrow keys preview themes in the open menu; Enter keeps the choice and closes it', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const toggle = themeToggle(page);
  await toggle.click();
  await expect(page.getByRole('radio', { name: 'Daylight' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('html')).toHaveAttribute('data-theme', THEMES[1]!.id);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('html')).toHaveAttribute('data-theme', THEMES[2]!.id);
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('every theme passes axe when applied to the page', async ({ page }) => {
  await page.goto('/');
  for (const theme of THEMES.filter((t) => t.id !== DEFAULT_LIGHT)) {
    await pickTheme(page, theme.name);
    await expect(page.locator('html'), theme.id).toHaveAttribute('data-theme', theme.id);
    await expectNoA11yViolations(page);
  }
});

test('every Tab stop shows a visible focus indicator', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=mile&b=kilometer&v=1&s=a');
  await ready(page);
  const missing: string[] = [];
  for (let stop = 0; stop < 10; stop += 1) {
    await page.keyboard.press('Tab');
    // Shell edges fade in; read the indicator once transitions have finished.
    await settled(page);
    // A stop passes with its own outline, or with an accent edge on the shell it sits in
    // (fields and the theme menu show focus that way). Astro's dev toolbar is not ours.
    const result = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element || element === document.body) return null;
      if (element.closest('astro-dev-toolbar')) return null;
      const name =
        element.getAttribute('aria-label') ?? element.textContent?.trim() ?? element.tagName;
      const style = getComputedStyle(element);
      if (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2) {
        return { ok: true, name };
      }
      const probe = document.createElement('span');
      probe.style.color = 'var(--accent)';
      document.body.append(probe);
      const accent = getComputedStyle(probe).color;
      probe.remove();
      for (let node = element.parentElement; node; node = node.parentElement) {
        const edge = getComputedStyle(node);
        if (parseFloat(edge.borderTopWidth) >= 2 && edge.borderTopColor === accent) {
          return { ok: true, name };
        }
      }
      return { ok: false, name };
    });
    if (result && !result.ok) missing.push(result.name);
  }
  expect(missing).toEqual([]);
});

test('reduced motion zeroes the motion tokens in every theme', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const theme of THEMES) {
    const duration = await page.evaluate((id) => {
      document.documentElement.dataset['theme'] = id;
      return getComputedStyle(document.documentElement).getPropertyValue('--motion-fast').trim();
    }, theme.id);
    expect(duration, theme.id).toBe('0ms');
  }
});

test('the shortcuts map opens on hover, stays when clicked, and closes on Escape', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'the shortcuts map is hidden on touch-first devices');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Keyboard shortcuts' });

  await toggle.hover();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Confirm input or selection')).toBeVisible();
  // The open edge goes with the panel: a fading edge would leave a green square behind.
  const shell = toggle.locator('xpath=ancestor::*[@data-shell]/*[1]');
  const edgeFades = await shell.evaluate((el) => {
    const style = getComputedStyle(el);
    const durations = style.transitionDuration.split(',').map((d) => parseFloat(d));
    return style.transitionProperty
      .split(',')
      .some(
        (property, i) =>
          ['border-color', 'all'].includes(property.trim()) &&
          (durations[i % durations.length] ?? 0) > 0,
      );
  });
  expect(edgeFades).toBe(false);
  await page.mouse.move(5, 5);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(PEEK_CLOSE_MS * 2);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expectNoA11yViolations(page);

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('the shortcuts map is hidden on touch-first devices', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'desktop shows the shortcuts map');
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Keyboard shortcuts' })).toBeHidden();
});

test('shortcuts name ⌘ on Apple devices and Ctrl elsewhere', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the shortcuts map is hidden on touch-first devices');
  const undo = page.getByRole('button', { name: 'Undo' });

  await page.goto('/');
  await ready(page);
  await expect(page.locator('[data-mod-key]').first()).toHaveText('Ctrl');
  await expect(undo).toHaveAttribute('title', 'Undo (Ctrl+Z)');

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
    Object.defineProperty(navigator, 'userAgentData', { get: () => ({ platform: 'macOS' }) });
  });
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-mod-key]').first()).toHaveText('⌘');
  await expect(undo).toHaveAttribute('title', 'Undo (⌘Z)');
});
