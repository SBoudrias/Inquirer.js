const fs = require('node:fs');
const path = require('node:path');

// In the monorepo, the adapter under test is the symlinked workspace at
// ../../packages/testing and jest.ts coverage is collected from there. In an
// isolated install (the CI e2e job packs workspace deps as tarballs), the
// workspace layout doesn't exist and only the test run matters.
const inMonorepo = fs.existsSync(
  path.join(__dirname, '../../packages/testing/package.json'),
);

/** @type {import('jest').Config} */
module.exports = {
  ...(inMonorepo && {
    // Jest only collects coverage for files under rootDir, so rootDir is
    // the monorepo root and the test lookup is pinned back here.
    rootDir: '../..',
    roots: ['<rootDir>/integration/jest'],
    collectCoverageFrom: ['packages/testing/src/jest.ts'],
  }),
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.[tj]sx?$': require.resolve('./ts-transformer.cjs'),
  },
  // Workspace packages ship raw TypeScript sources, and the fast-* wrap
  // chain (fast-wrap-ansi, fast-string-width, fast-string-truncated-width)
  // is ESM-only; all must pass through the transform. Every other
  // node_modules package is plain CJS.
  transformIgnorePatterns: [
    '/node_modules/(?!@inquirer/|fast-wrap-ansi/|fast-string-width/|fast-string-truncated-width/)',
  ],
  // @xterm/headless is CJS with __esModule set and named exports only, so a
  // default import of it under the CJS transform binds to undefined. The
  // shim re-exposes it with a default binding (see xterm-headless-shim.cjs).
  moduleNameMapper: {
    '^@xterm/headless$': require.resolve('./xterm-headless-shim.cjs'),
  },
  coverageDirectory: './coverage',
};
