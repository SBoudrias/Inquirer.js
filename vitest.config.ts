import { defineConfig, defaultExclude, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    fsModuleCache: true,
    include: ['**/*.vitest.ts'],
    exclude: ['integration/**', ...defaultExclude],
    coverage: {
      provider: 'v8',
      include: ['packages/**/src/**/*.{ts,tsx,mts}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        // *.jest.ts files are Jest test files; without this they'd be
        // counted as uncovered source by vitest's report.
        '**/*.jest.ts',
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
