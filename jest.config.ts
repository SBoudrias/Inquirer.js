import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  coverageDirectory: './coverage/',
  collectCoverage: true,
  resolver: '<rootDir>/jest/mjs-resolver.ts',
  transform: {
    '^.+\\.m?tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx|js|tsx|ts|mts)$',
  moduleNameMapper: {
    '#ansi-styles': 'ansi-styles',
    '#supports-color': 'supports-color',
  },
  extensionsToTreatAsEsm: ['.ts', '.mts'],
  moduleFileExtensions: ['js', 'jsx', 'mjs', 'mts'],
};

export default config;
