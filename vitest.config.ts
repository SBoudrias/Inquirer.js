import { defineConfig, defaultExclude, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    fsModuleCache: true,
    include: ['**/*.vitest.ts'],
    exclude: ['integration/**', ...defaultExclude],
    coverage: {
      provider: 'v8',
      // Symmetric with jest's coverage/jest: each tool writes its own
      // subdirectory (CI uploads both), and each cleans only its own at
      // start — run order doesn't matter.
      reportsDirectory: 'coverage/vitest',
      include: ['packages/**/src/**/*.{ts,tsx,mts}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        // *.jest.ts files are Jest test files; without this they'd be
        // counted as uncovered source by vitest's report.
        '**/*.jest.ts',
        // src/jest.ts needs the jest globals; its coverage belongs to the
        // Jest run (see jest.config.js). Codecov merges both uploads.
        'packages/testing/src/jest.ts',
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
