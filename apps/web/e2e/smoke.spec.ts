import { expect, test } from '@playwright/test';
import { DEFAULT_LIGHT, THEMES } from '../src/lib/themes';
import { applyTheme, expectNoA11yViolations, pickTheme, ready, settled } from './support';

// Checks that span the site: every page and every theme pass axe, every Tab stop shows focus,
// and reduced motion stills every theme. Each feature's flows have a file of their own.

for (const path of ['/', '/dev/gallery', '/dev/wordmark-lab']) {
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
    await applyTheme(page, theme);
    const duration = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--motion-fast').trim(),
    );
    expect(duration, theme.id).toBe('0ms');
  }
});
