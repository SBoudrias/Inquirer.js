import { defineConfig, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      all: true,
      exclude: [
        ...coverageConfigDefaults.exclude,
        'tools/**',
        'internals/**',
        'packages/*/dist/**',
        'packages/inquirer/examples/**',
        'packages/demo/**',
        '.yarn/**',
      ],
    },
    testTimeout: 300,
  },
});
