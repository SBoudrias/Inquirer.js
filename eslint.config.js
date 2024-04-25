// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import nodePlugin from 'eslint-plugin-n';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';

export default tseslint.config(
  {
    ignores: [
      '.git',
      'node_modules',
      'coverage',
      'packages/*/dist/**',
      'packages/*/node_modules/**',
      'packages/*/__snapshots__/**',
    ],
  },
  eslint.configs.recommended,
  nodePlugin.configs['flat/recommended-module'],
  eslintPluginUnicorn.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
      },
    },
    rules: {
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
    extends: [...tseslint.configs.recommended],
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
          allowModules: ['vitest'],
        },
      ],
      'n/no-extraneous-require': [
        'error',
        {
          allowModules: ['vitest'],
        },
      ],
    },
  },
  eslintPluginPrettierRecommended,
);
