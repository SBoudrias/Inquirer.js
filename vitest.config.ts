import { defineConfig, defaultExclude, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    fsModuleCache: true,
    // Required by Captain (RWX) to identify tests in its insights.
    includeTaskLocation: true,
    exclude: ['integration/**', ...defaultExclude],
    coverage: {
      provider: 'v8',
      include: ['packages/**/src/**/*.{ts,tsx,mts}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        'tools/**',
        'packages/*/dist/**',
        'packages/*/examples/**',
        'packages/demo/**',
        '.yarn/**',
      ],
    },
    testTimeout: 5000,
  },
});
