// @ts-check
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Token guard (CLAUDE.md rule 3; docs/DESIGN-SYSTEM.md, "Token guard"). Each pattern is a way to
 * bypass the semantic tokens inside a string, usually a class list. Patterns cannot contain "/",
 * because selectors end a regex at the first one.
 */
const RAW_VALUES = [
  {
    pattern: String.raw`#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(`,
    message:
      'Raw color. Use a color token (bg-surface, text-ink, border-line ...); a new need is a new token in every theme.',
  },
  {
    pattern: String.raw`\b(?:bg|text|border|outline|ring|fill|stroke|caret|accent|decoration|divide|placeholder|from|via|to|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)\b`,
    message: 'Tailwind palette color. Use a color token; the palette does not follow the theme.',
  },
  {
    pattern: String.raw`-\[[^\]]*(?:\d(?:px|r?em|vh|vw|dvh|svh|ms|s)\b|\d%|#|\b(?:rgb|hsl|oklch|var)\()|-\(--`,
    message:
      'One-off arbitrary value. Use the token utility or the spacing scale; a new need is a new token.',
  },
  {
    pattern: String.raw`\b(?:duration|delay)-\d+\b|\bease-(?:linear|in|out|in-out)\b`,
    message:
      'Literal motion. Use duration-fast, duration-base, duration-slow, and ease-standard, which reduced motion zeroes.',
  },
  {
    pattern: String.raw`\brounded(?:-[a-z]{1,2})?-(?:xs|xl|2xl|3xl|4xl)\b|\b(?:shadow|drop-shadow|inset-shadow)-(?:xs|lg|xl|2xl)\b|\bfont-(?:sans|serif|mono)\b`,
    message:
      'Untokened radius, shadow, or font. Use rounded-sm/md/lg or rounded-nested, shadow-sm/md, and font-display/body/numeric.',
  },
];

const TOKEN_GUARD = [
  ...RAW_VALUES.flatMap(({ pattern, message }) => [
    { selector: `Literal[value=/${pattern}/]`, message },
    { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
  ]),
  {
    selector: [
      'CallExpression[callee.name=/^set(?:Timeout|Interval)$/][arguments.1.type="Literal"]',
      'CallExpression[callee.property.name=/^set(?:Timeout|Interval)$/][arguments.1.type="Literal"]',
    ].join(', '),
    message: 'Literal delay. Name it in src/lib/timing.ts.',
  },
];

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.astro/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-recommended'],

  // Web app: browser globals, React hooks rules, JSX accessibility rules.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'jsx-a11y': jsxA11y, 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      ...reactHooks.configs['recommended-latest'].rules,
    },
  },
  // Node-side files in the web app (tests, configs).
  {
    files: [
      'apps/web/test/**',
      'apps/web/e2e/**',
      'apps/web/*.config.ts',
      'apps/web/*.config.mjs',
      'scripts/**/*.mjs',
    ],
    languageOptions: { globals: { ...globals.node } },
  },

  // Core stays framework-free and DOM-free (ADR 0003).
  {
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'react/*',
                'preact',
                'preact/*',
                'astro',
                'astro:*',
                '@bigsmall/web',
                '@bigsmall/web/*',
                '**/apps/web/**',
              ],
              message: 'packages/core must stay framework-free (ADR 0003).',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'navigator',
        'localStorage',
        'sessionStorage',
      ],
    },
  },
  // Components use semantic tokens, never raw values. A flagged value is matched to an existing
  // token or brought to the owner as a proposed new one; it is never silenced with a disable comment.
  {
    files: ['apps/web/src/**/*.{ts,tsx,astro}'],
    rules: { 'no-restricted-syntax': ['error', ...TOKEN_GUARD] },
  },
  // The web app uses only the public API of core, never its internals.
  {
    files: ['apps/web/**/*.{ts,tsx,astro}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@bigsmall/core/src/*', '**/packages/core/src/*'],
              message: 'Import from @bigsmall/core, not its internals (ADR 0003).',
            },
          ],
        },
      ],
    },
  },
);
