/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CONTRAST_PAIRS, THEMES, TOKEN_CONTRACT } from '../src/lib/themes';

/**
 * Every theme must define the full token contract, use 6-digit hex for color tokens,
 * declare its color-scheme, and meet WCAG 2.2 AA contrast on the pairs in CONTRAST_PAIRS.
 * This is what makes "every theme passes contrast" a build failure instead of a hope.
 */

const themesDir = fileURLToPath(new URL('../src/styles/themes/', import.meta.url));

function parseTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const match of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    tokens[match[1]!] = match[2]!.trim();
  }
  return tokens;
}

function parseColorScheme(css: string): string | undefined {
  return css.match(/color-scheme\s*:\s*([a-z]+)\s*;/)?.[1];
}

const HEX6 = /^#[0-9a-f]{6}$/i;

function channel(hex: string, offset: number): number {
  const c = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance per WCAG 2.x. */
function luminance(hex: string): number {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

/** Contrast ratio per WCAG 2.x, always >= 1. */
export function contrast(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

const allTokens = Object.values(TOKEN_CONTRACT).flat();

describe('theme files', () => {
  it('registry and files match one to one', () => {
    const files = readdirSync(themesDir)
      .filter((f) => f.endsWith('.css'))
      .map((f) => f.replace(/\.css$/, ''))
      .sort();
    const ids = THEMES.map((t) => t.id).sort();
    expect(files).toEqual(ids);
  });

  for (const theme of THEMES) {
    describe(theme.id, () => {
      const css = readFileSync(join(themesDir, `${theme.id}.css`), 'utf8');
      const tokens = parseTokens(css);

      it('targets its own data-theme selector', () => {
        expect(css).toContain(`[data-theme='${theme.id}']`);
      });

      it('declares the color-scheme from the registry', () => {
        expect(parseColorScheme(css)).toBe(theme.scheme);
      });

      it('defines every token in the contract', () => {
        const missing = allTokens.filter((t) => !(t in tokens));
        expect(missing).toEqual([]);
      });

      it('uses 6-digit hex for every color token', () => {
        for (const name of TOKEN_CONTRACT.colors) {
          expect(tokens[name], name).toMatch(HEX6);
        }
      });

      for (const [fg, bg, min] of CONTRAST_PAIRS) {
        it(`${fg} on ${bg} is at least ${min}:1`, () => {
          const ratio = contrast(tokens[fg]!, tokens[bg]!);
          expect(
            ratio,
            `${tokens[fg]} on ${tokens[bg]} = ${ratio.toFixed(2)}`,
          ).toBeGreaterThanOrEqual(min);
        });
      }
    });
  }
});

describe('contrast()', () => {
  it('matches known WCAG values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrast('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
});
