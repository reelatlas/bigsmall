const {
  chromium,
} = require('C:/Users/seanr/Projects/bigsmall/node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');
const out = process.argv[2];
const urls = process.argv.slice(3);
(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const url of urls) {
    for (const [label, vp, mobile] of [
      ['phone', { width: 390, height: 844 }, true],
      ['desktop', { width: 1280, height: 800 }, false],
    ]) {
      const ctx = await browser.newContext({
        viewport: vp,
        isMobile: mobile,
        hasTouch: mobile,
        deviceScaleFactor: 1,
        locale: 'en-US',
      });
      const page = await ctx.newPage();
      const r = { url, label };
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2500);
        r.title = await page.title();
        r.challenge = /just a moment|attention required|verify you are human|captcha/i.test(
          r.title + (await page.content()).slice(0, 4000),
        );
        const slug = url
          .replace(/https?:\/\//, '')
          .replace(/[^a-z0-9]+/gi, '_')
          .slice(0, 50);
        await page.screenshot({ path: path.join(out, `${slug}_${label}.png`) });
        r.dims = await page.evaluate(() => ({
          h: document.documentElement.scrollHeight,
          w: document.documentElement.scrollWidth,
        }));
        r.headings = await page.evaluate(() =>
          [...document.querySelectorAll('h1,h2,h3')]
            .map((e) => e.innerText.trim())
            .filter(Boolean)
            .slice(0, 40),
        );
        r.links = await page.evaluate(() =>
          [...document.querySelectorAll('a')]
            .filter((a) => a.offsetParent !== null)
            .map((a) => a.innerText.trim().replace(/\s+/g, ' '))
            .filter((t) => t && t.length < 40)
            .slice(0, 150),
        );
        r.selects = await page.evaluate(() =>
          [...document.querySelectorAll('select')]
            .map((s) => ({
              n: s.options.length,
              first: [...s.options].slice(0, 40).map((o) => o.text.trim()),
            }))
            .slice(0, 4),
        );
        if (!mobile) {
          const stops = [];
          for (let i = 0; i < 25; i++) {
            await page.keyboard.press('Tab');
            stops.push(
              await page.evaluate(() => {
                const e = document.activeElement;
                if (!e) return '';
                const cs = getComputedStyle(e);
                return `${e.tagName}:${(e.innerText || e.value || e.getAttribute('aria-label') || '').trim().slice(0, 30)}${cs.outlineStyle === 'none' && cs.boxShadow === 'none' ? ' [no-outline?]' : ''}`;
              }),
            );
          }
          r.tabStops = stops;
        }
      } catch (e) {
        r.error = String(e).slice(0, 200);
      }
      results.push(r);
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(
    path.join(out, 'wild-' + Date.now() + '.json'),
    JSON.stringify(results, null, 1),
  );
  for (const r of results)
    console.log(
      r.label,
      r.url,
      r.error || '',
      r.title,
      'challenge=' + r.challenge,
      JSON.stringify(r.dims),
      'links=' + (r.links || []).length,
    );
})();
