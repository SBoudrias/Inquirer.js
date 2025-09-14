import { fileURLToPath, URL } from 'node:url';
import { defineConfig, defaultExclude, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['integration/**', ...defaultExclude],
    coverage: {
      provider: 'v8',
      all: true,
      exclude: [
        ...coverageConfigDefaults.exclude,
        'tools/**',
        'packages/inquirer/examples/**',
        'packages/demo/**',
        '.yarn/**',
        '**/*.type.mts',
      ],
    },
    testTimeout: 300,
  },
  resolve: {
    alias: [
      {
        // Resolve @inquirer/* packages to their source code (except external-editor)
        find: /@inquirer\/(?!external-editor)(.*)/,
        replacement: fileURLToPath(new URL('packages/$1/src', import.meta.url)),
      },
    ],
  },
});
