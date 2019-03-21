const { createPrompt } = require('@inquirer/core');
const chalk = require('chalk');

module.exports = createPrompt(
  {
    mapStateToValue({ value, default: rawDefault }) {
      if (value) {
        return /^y(es)?/i.test(value);
      }

      return rawDefault !== false;
    }
  },
  (state, { mapStateToValue }) => {
    const { prefix, value = '', status } = state;
    const message = chalk.bold(state.message);
    let formattedValue = value;
    if (status === 'done') {
      const value = mapStateToValue(state);
      formattedValue = chalk.cyan(value ? 'yes' : 'no');
    }

    let defaultValue = '';
    if (status !== 'done') {
      defaultValue = chalk.dim(state.default === false ? ' (y/N)' : ' (Y/n)');
    }

    return `${prefix} ${message}${defaultValue} ${formattedValue}`;
  }
);
