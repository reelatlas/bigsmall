const {
  chromium,
} = require('C:/Users/seanr/Projects/bigsmall/node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core');
const path = require('path');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  for (const [label, vp, mobile] of [
    ['phone', { width: 390, height: 844 }, true],
    ['desktop', { width: 1280, height: 800 }, false],
  ]) {
    const ctx = await b.newContext({
      viewport: vp,
      isMobile: mobile,
      hasTouch: mobile,
      locale: 'en-US',
    });
    const p = await ctx.newPage();
    await p.goto('https://bigsmall.work/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(out, `ours_start_${label}.png`), fullPage: true });
    const info = await p.evaluate(() => {
      const box = [...document.querySelectorAll('button, a')].filter(
        (e) => /Length|Weight|Torque|Cooking/.test(e.innerText) && e.offsetParent,
      );
      const rects = box.map((e) => {
        const r = e.getBoundingClientRect();
        return {
          t: e.innerText.trim().replace(/\s+/g, ' ').slice(0, 30),
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      });
      return { h: document.documentElement.scrollHeight, rects };
    });
    console.log(label, JSON.stringify(info));
    // tiles: find elements with the category names
    const tiles = await p.evaluate(() => {
      const names = [
        'Length',
        'Weight',
        'Volume',
        'Temperature',
        'Area',
        'Speed',
        'Time',
        'Data',
        'Fuel economy',
        'Energy',
        'Pressure',
        'Power',
        'Angle',
        'Cooking',
        'Force',
        'Torque',
      ];
      const els = [...document.querySelectorAll('main *')].filter(
        (e) => e.children.length === 0 && names.includes(e.textContent.trim()) && e.offsetParent,
      );
      const rs = els.map((e) => e.getBoundingClientRect());
      if (!rs.length) return null;
      return {
        n: els.length,
        order: els.map((e) => e.textContent.trim()),
        top: Math.round(Math.min(...rs.map((r) => r.top))),
        bottom: Math.round(Math.max(...rs.map((r) => r.bottom))),
      };
    });
    console.log(label, 'tiles', JSON.stringify(tiles));
    // open the category menu
    const trig = p.getByRole('button', { name: /category/i }).first();
    try {
      await trig.click({ timeout: 5000 });
      await p.waitForTimeout(800);
      await p.screenshot({ path: path.join(out, `ours_menu_${label}.png`) });
      const m = await p.evaluate(() => {
        const rs = [...document.querySelectorAll('input[type=radio]')].filter((e) => {
          const r = e.getBoundingClientRect();
          return (
            r.width > 0 ||
            (e.labels && e.labels[0] && e.labels[0].getBoundingClientRect().width > 0)
          );
        });
        const lab = rs.map((e) =>
          e.labels && e.labels[0] ? e.labels[0].getBoundingClientRect() : e.getBoundingClientRect(),
        );
        return {
          radios: rs.length,
          top: Math.round(Math.min(...lab.map((r) => r.top))),
          bottom: Math.round(Math.max(...lab.map((r) => r.bottom))),
          rowH: lab[0] ? Math.round(lab[0].height) : 0,
        };
      });
      console.log(label, 'menu', JSON.stringify(m));
    } catch (e) {
      console.log(label, 'menu error', String(e).slice(0, 150));
    }
    await ctx.close();
  }
  await b.close();
})();
