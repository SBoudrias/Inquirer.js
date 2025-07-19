import config from '@repo/eslint-config';

export default [
  ...config,
  {
    files: ['examples/**'],
    rules: {
      'n/no-unsupported-features/node-builtins': [
        'error',
        {
          version: '>=22.0.0',
        },
      ],
    },
  },
];
