const input = require('@inquirer/input');
const chalk = require('chalk');

module.exports = (config, ...args) => {
  if (config.transformer) {
    throw new Error(
      'Inquirer password prompt do not support custom transformer function. Use the input prompt instead.'
    );
  }

  return input(
    Object.assign({}, config, {
      // Make sure we do not display the default password
      default: undefined,
      transformer: (input, { isFinal }) => {
        if (config.mask) {
          return String(config.mask).repeat(input.length);
        }

        if (!isFinal) {
          return chalk.dim('[input is masked]');
        }

        return '';
      },
    }),
    ...args
  );
};
