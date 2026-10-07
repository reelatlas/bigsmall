import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_LIGHT, THEMES } from '../src/lib/themes';
import { PEEK_CLOSE_MS, WORDMARK_TIMING } from '../src/lib/timing';
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

test('hovering the name and its art plays the wordmark, leaving settles it, and its name stays', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'hover needs a mouse; a tap plays it instead');
  await page.goto('/');
  await ready(page);
  const heading = page.getByRole('heading', { level: 1 });
  const line = page.locator('[data-wordmark]');

  await heading.hover();
  await expect(line).not.toHaveText('bigsmall');
  await expect(heading).toHaveAccessibleName('bigsmall');
  // Nothing clips while it plays, so descenders and tall symbols show whole.
  await expect(page.locator('[data-wordmark-box]')).toHaveCSS('overflow', 'visible');
  await page.mouse.move(5, 600);
  await expect(line).toHaveText('bigsmall');
  await expect(heading).toHaveAccessibleName('bigsmall');
});

test('hovering the header menus leaves the wordmark still', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover needs a mouse');
  await page.goto('/');
  await ready(page);
  await themeToggle(page).hover();
  await page.waitForTimeout(WORDMARK_TIMING.firstMs + WORDMARK_TIMING.restMs);
  await expect(page.locator('[data-wordmark]')).toHaveText('bigsmall');
});

test('the wordmark stays still under reduced motion', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover needs a mouse');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await ready(page);
  await page.getByRole('heading', { level: 1 }).hover();
  await page.waitForTimeout(WORDMARK_TIMING.firstMs + WORDMARK_TIMING.restMs);
  await expect(page.locator('[data-wordmark]')).toHaveText('bigsmall');
});

test('the art beside the wordmark follows the theme', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the art shows from the sm breakpoint up');
  await page.goto('/');
  for (const theme of THEMES) {
    await page.evaluate((id) => {
      document.documentElement.dataset['theme'] = id;
    }, theme.id);
    await expect(page.locator(`header [data-art="${theme.id}"]`), theme.id).toBeVisible();
    await expect(page.locator('header [data-art]:visible')).toHaveCount(1);
  }
});

/** The lab's sheet of phrases appears once its island runs. */
async function openLab(page: Page) {
  await page.goto('/dev/wordmark-lab');
  await page.locator('[data-sheet-report]').waitFor();
}

test('every phrase fits the name’s width in every theme, on one line or two', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'the name is the same width at every viewport');
  await openLab(page);
  await page.getByLabel(/^Include all/).check();
  const report = page.locator('[data-sheet-report]');
  for (const theme of THEMES) {
    await page.evaluate((id) => {
      document.documentElement.dataset['theme'] = id;
    }, theme.id);
    await expect(report).toHaveAttribute('data-theme-fitted', theme.id);
    await expect(report, theme.id).not.toContainText('Too long');
  }
});

test('the art flips to a symbol, and its drawing comes home when play stops', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'the art shows from the sm breakpoint up');
  await openLab(page);
  await page.getByLabel('Art flips to a symbol').fill('1');
  const pinned = page.getByLabel('Play without hovering');
  await pinned.check();
  const symbol = page.locator('header [data-art-line]');
  await expect(symbol).toBeVisible();
  await expect(page.locator('header [data-theme-art]')).toHaveClass(/invisible/);
  await pinned.uncheck();
  await expect(symbol).toBeHidden();
  await expect(page.locator('[data-wordmark]')).toHaveText('bigsmall');
  await expect(page.locator('header [data-theme-art]')).not.toHaveClass(/invisible/);
});

test('the lab copies its settings as code', async ({ page, context, isMobile }) => {
  test.skip(isMobile, 'one viewport is enough');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openLab(page);
  await page.getByLabel('Rest', { exact: true }).fill('2400');
  await page.getByRole('button', { name: 'Copy settings' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('restMs: 2400,');
  expect(copied).toContain('export const WORDMARK_TUNING');
});
