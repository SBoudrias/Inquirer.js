// Jest runs the *.jest.ts suites (the vitest suites are *.vitest.ts —
// see CONTRIBUTING.md). Tests run through SWC emitting CommonJS: the Jest
// adapter (@inquirer/testing/jest) uses jest.mock() hoisting, which only
// exists for CommonJS modules.
/** @type {import('jest').Config} */
export default {
  testMatch: ['<rootDir>/packages/**/*.jest.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript' },
          target: 'es2023',
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  // ESM-only transitive dependencies of the prompt packages (used through
  // jest.requireActual in the adapters) must be transformed too, or loading
  // them fails with "Must use import to load ES Module".
  transformIgnorePatterns: [
    '/node_modules/(?!(fast-wrap-ansi|fast-string-width|fast-string-truncated-width|wrap-ansi)/)',
  ],
  // Coverage ownership is disjoint between the two runners: vitest covers
  // everything except each package's jest adapter source (excluded in
  // vitest.config.ts — it needs the jest globals), Jest covers exactly those
  // adapter files (src/jest.ts, the tool-named entry). Codecov merges the two
  // uploads; a per-file istanbul merge would double-count.
  collectCoverageFrom: ['<rootDir>/packages/*/src/jest.ts'],
  coverageDirectory: '<rootDir>/coverage/jest',
  coverageProvider: 'v8',
};
