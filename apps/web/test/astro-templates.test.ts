/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * An HTML comment in an Astro template ships in every built page, so notes about a component
 * live in its frontmatter as a block comment, which the build strips (docs/LEARNINGS.md,
 * "Astro template comments ship").
 */

const src = fileURLToPath(new URL('../src/', import.meta.url));
const astroFiles = readdirSync(src, { recursive: true, encoding: 'utf8' }).filter((file) =>
  file.endsWith('.astro'),
);

/** The template: everything after the frontmatter's closing fence. */
function template(source: string): string {
  if (!source.startsWith('---')) return source;
  const end = source.indexOf('\n---', 3);
  return end < 0 ? source : source.slice(end + '\n---'.length);
}

describe('Astro templates', () => {
  it.each(astroFiles)('%s keeps its notes out of the page', (file) => {
    expect(template(readFileSync(join(src, file), 'utf8'))).not.toContain('<!--');
  });
});
