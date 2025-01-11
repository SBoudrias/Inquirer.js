module.exports = {
  pipeline: {
    attw: {
      dependsOn: ['tsc'],
      outputs: [],
    },
    tsc: {
      type: 'worker',
      options: {
        worker: require.resolve('@repo/lage-workers/tsc-worker'),
      },
      dependsOn: ['^tsc'],
      outputs: ['dist/**'],
    },
    lint: {
      type: 'worker',
      options: {
        worker: require.resolve('@repo/lage-workers/eslint-worker'),
      },
    },
  },
  npmClient: 'yarn',
};
