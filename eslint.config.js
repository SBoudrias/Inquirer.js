// @ts-check
import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import globals from 'globals';
import tseslintParser from '@repo/eslint-parser';
import nodePlugin from 'eslint-plugin-n';
import oxlint from 'eslint-plugin-oxlint';

// `eslint-disable` directives suppressing rules that moved to oxlint still
// use `@typescript-eslint/*` names — and oxlint honors those same directives,
// so they must keep working. eslint no longer registers these rules (typed
// lint lives in `yarn oxlint --type-aware`), so we register inert
// placeholders, derived from the oxlint plugin's own migration list, to keep
// the directives from being reported as unknown rules.
const oxlintConfigs = oxlint.buildFromOxlintConfigFile('./.oxlintrc.json');
/** @type {Set<string>} */
const migratedTseslintRuleNames = new Set();
for (const config of oxlintConfigs) {
  for (const ruleName of Object.keys(config.rules ?? {})) {
    if (ruleName.startsWith('@typescript-eslint/')) {
      migratedTseslintRuleNames.add(ruleName);
    }
  }
}
const inertTseslintPlugin = {
  rules: Object.fromEntries(
    [...migratedTseslintRuleNames].map((qualifiedName) => [
      qualifiedName.slice('@typescript-eslint/'.length),
      { create: () => ({}) },
    ]),
  ),
};

export default defineConfig(
  {
    // Rules enforced by oxlint are turned off below via eslint-plugin-oxlint,
    // so eslint-disable directives suppressing them now read as "unused".
    // oxlint honors these same directives, so they must not be reported (or
    // auto-removed by `eslint --fix`) while the rule still runs in oxlint.
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  {
    ignores: [
      '.git',
      'node_modules',
      'coverage',
      '.yarn',
      'packages/*/dist/**',
      'packages/*/node_modules/**',
      'tools/*/dist/**',
      'tools/*/node_modules/**',
      'integration/*/dist/**',
      'integration/*/node_modules/**',
      // Deno fixture scripts: type-checked by `deno check` in CI and linted by
      // oxlint. They run under Deno's runtime and config discovery, not Node's.
      'integration/deno/cases/**',
      'packages/*/__snapshots__/**',
    ],
  },
  eslint.configs.recommended,
  nodePlugin.configs['flat/recommended-module'],
  {
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
      },
    },
    rules: {
      'n/hashbang': 'off',
      'n/no-unpublished-bin': 'off',
      // `util.styleText` is intentionally used despite still being flagged as
      // experimental on Node 20.x; it is stable on the other supported ranges.
      'n/no-unsupported-features/node-builtins': [
        'error',
        { ignores: ['util.styleText'] },
      ],
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/prefer-event-target': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  {
    // The `n/*` module-resolution rules need a parser that understands
    // TypeScript syntax; espree can't. This is parse-only: no TS language
    // service (no typed-lint), which keeps eslint decoupled from the
    // TypeScript version. Typed-lint lives in `yarn oxlint --type-aware`.
    files: ['**/*.mts', '**/*.ts'],
    plugins: {
      '@typescript-eslint': inertTseslintPlugin,
    },
    languageOptions: {
      parser: tseslintParser,
    },
    rules: {
      // `no-undef` is unreliable on TypeScript files (it flags type-only
      // globals); undefined-identifier checks are owned by the TypeScript
      // compiler and `yarn tsc`.
      'no-undef': 'off',
      'n/no-missing-import': ['error', { ignoreTypeImport: true }],
    },
  },
  {
    files: ['**/*.cjs'],
    extends: [nodePlugin.configs['flat/recommended-script']],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['packages/inquirer/test/**', 'packages/**/*.test.*'],
    rules: {
      'n/no-extraneous-import': [
        'error',
        {
          allowModules: ['vitest', '@inquirer/testing'],
        },
      ],
      'n/no-extraneous-require': [
        'error',
        {
          allowModules: ['vitest', '@inquirer/testing'],
        },
      ],
      'n/no-unsupported-features/node-builtins': [
        'error',
        {
          version: '^22.16.0 || >=24.0.0',
        },
      ],
    },
  },
  {
    files: ['tools/**', 'integration/**', 'packages/*/examples/**', 'packages/demo/**'],
    rules: {
      'n/no-unsupported-features/node-builtins': [
        'error',
        {
          version: '^24.0.0',
        },
      ],
    },
  },
  ...oxlintConfigs,
);
