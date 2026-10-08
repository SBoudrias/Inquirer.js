// Jest transformer for the monorepo's TypeScript sources.
//
// babel-jest is deliberately not used: it always appends
// babel-plugin-jest-hoist, whose static analysis rejects the
// @inquirer/testing Jest adapter. The adapter's jest.mock() factories
// reference module-scope helpers (wrapPrompt, screen), which the hoist
// plugin forbids. The adapter doesn't rely on hoisting: it registers its
// mocks while its own module evaluates, before any prompt package is
// imported (its README mandates importing it first).
const babel = require('@babel/core');

const presets = [
  ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
  ['@babel/preset-typescript', { allowDeclareFields: true }],
];

module.exports = {
  process(sourceText, filename, options) {
    const result = babel.transformSync(sourceText, {
      babelrc: false,
      configFile: false,
      filename,
      presets,
      plugins: options.instrument ? ['babel-plugin-istanbul'] : [],
      sourceMaps: true,
    });
    return { code: result.code, map: result.map };
  },
};
