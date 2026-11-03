import { defineConfig, defaultExclude, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    fsModuleCache: true,
    include: ['**/*.vitest.ts'],
    exclude: ['integration/**', ...defaultExclude],
    // Affected-test selection (CI: `vitest related`) resolves tests through
    // the import graph. Files that change how modules resolve or compile are
    // invisible to that graph — a workspace package.json (dependency or
    // exports map change) or tsconfig.json (module resolution, TS syntax
    // transforms) can alter runtime behavior with no import edge to follow —
    // so they rerun the full suite instead of a selection.
    forceRerunTriggers: [
      '**/package.json',
      '**/{vitest,vite}.config.*',
      '**/tsconfig.json',
    ],
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
