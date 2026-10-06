// Measures what the converter page ships, gzipped, against the budgets in docs/PLAN.md §9.
// Usage: node scripts/bundle-size.mjs [--check]   (run after `pnpm build`)
import { readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = join('apps', 'web', 'dist');
const PAGE = 'index.html';
const BUDGET_JS = 90 * 1024;
const BUDGET_CSS = 20 * 1024;

const html = readFileSync(join(DIST, PAGE), 'utf8');

// Entry points: scripts, modulepreloads, stylesheets, and Astro island component/renderer urls.
const attrs = /(?:src|href|component-url|renderer-url)="([^"]+)"/g;
const entries = [...html.matchAll(attrs)].map((m) => m[1]).filter((u) => u.startsWith('/_astro/'));

const seen = new Map(); // url -> gzipped bytes
function visit(url) {
  if (seen.has(url)) return;
  const file = join(DIST, url);
  const source = readFileSync(file);
  seen.set(url, gzipSync(source).length);
  if (!url.endsWith('.js')) return;
  // Follow static and dynamic imports so the island's React chunk is counted.
  const text = source.toString('utf8');
  const importRe = /(?:from\s*|import\s*\(\s*)["']([^"']+)["']/g;
  for (const match of text.matchAll(importRe)) {
    const spec = match[1];
    if (!spec.startsWith('.') && !spec.startsWith('/')) continue;
    const resolved = spec.startsWith('/')
      ? spec
      : posix.join(dirname(url).replaceAll('\\', '/'), spec);
    visit(resolved);
  }
}
for (const url of entries) visit(url);

const rows = [...seen.entries()].sort((a, b) => b[1] - a[1]);
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
let js = 0;
let css = 0;
for (const [url, size] of rows) {
  if (url.endsWith('.css')) css += size;
  else js += size;
  console.log(`${kb(size).padStart(9)}  ${url}`);
}
console.log('');
console.log(`JS  ${kb(js).padStart(9)} of ${kb(BUDGET_JS)} budget`);
console.log(`CSS ${kb(css).padStart(9)} of ${kb(BUDGET_CSS)} budget`);

if (process.argv.includes('--check')) {
  const over = [];
  if (js > BUDGET_JS) over.push(`JS over budget by ${kb(js - BUDGET_JS)}`);
  if (css > BUDGET_CSS) over.push(`CSS over budget by ${kb(css - BUDGET_CSS)}`);
  if (over.length) {
    console.error(`\nBundle budget exceeded: ${over.join('; ')}`);
    process.exit(1);
  }
  console.log('\nWithin budget.');
}
