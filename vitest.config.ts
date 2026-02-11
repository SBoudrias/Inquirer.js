import { defineConfig, defaultExclude, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['integration/**', ...defaultExclude],
    coverage: {
      provider: 'v8',
      include: ['packages/**/src/**/*.{ts,tsx,mts}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        'tools/**',
        'internals/**',
        'packages/*/dist/**',
        'packages/*/examples/**',
        'packages/demo/**',
        '.yarn/**',
      ],
    },
    testTimeout: 5000,
  },
});
