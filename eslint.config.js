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
  {
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
      },
    },
    plugins: {
      unicorn: eslintPluginUnicorn,
    },
    rules: {
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-node-protocol': 'error',
    },
  },
  eslint.configs.recommended,
  nodePlugin.configs['flat/recommended-module'],
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
