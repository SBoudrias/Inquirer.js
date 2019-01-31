const { createPrompt } = require('@inquirer/core');
const chalk = require('chalk');

module.exports = createPrompt(
  {
    canRemoveDefault: true,
    onKeypress: (value, key, { canRemoveDefault }, setState) => {
      const newState = { canRemoveDefault: !value };

      // Allow user to remove the default value by pressing backspace
      if (canRemoveDefault && key.name === 'backspace') {
        newState.default = undefined;
      }

      setState(newState);
    }
  },
  state => {
    const { prefix, value = '', status } = state;
    const message = chalk.bold(state.message);
    let formattedValue = value;
    if (status === 'done') {
      formattedValue = chalk.cyan(value || state.default || '');
    }

    let defaultValue = '';
    if (state.default && status !== 'done' && !value) {
      defaultValue = chalk.dim(` (${state.default})`);
    }

    return `${prefix} ${message}${defaultValue} ${formattedValue}`;
  }
);
