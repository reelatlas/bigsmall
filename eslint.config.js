// @ts-check
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
                'astro',
                'astro:*',
                '@bigsmall/web',
                '@bigsmall/web/*',
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
