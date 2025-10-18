// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import nodePlugin from 'eslint-plugin-n';
import oxlint from 'eslint-plugin-oxlint';

export default tseslint.config(
  {
    ignores: [
      '.git',
      'node_modules',
      'coverage',
      '.yarn',
      'packages/*/dist/**',
      'packages/*/node_modules/**',
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
    files: ['**/*.mts', '**/*.ts'],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
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
      '@typescript-eslint/unbound-method': 'off',
      'n/no-extraneous-import': [
        'error',
        {
          allowModules: ['vitest'],
        },
      ],
      'n/no-extraneous-require': [
        'error',
        {
          allowModules: ['vitest'],
        },
      ],
      'n/no-unsupported-features/node-builtins': [
        'error',
        {
          version: '^20.12.0',
        },
      ],
    },
  },
  {
    files: [
      'tools/**',
      'integration/**',
      'packages/inquirer/examples/**',
      'packages/demo/**',
    ],
    rules: {
      'n/no-unsupported-features/node-builtins': [
        'error',
        {
          version: '^24.0.0',
        },
      ],
    },
  },
  ...oxlint.configs['flat/recommended'],
);
