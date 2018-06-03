const { createPrompt } = require('@inquirer/core');
const chalk = require('chalk');

module.exports = createPrompt({}, state => {
  let { prefix, value } = state;
  if (state.status === 'done') {
    value = chalk.cyan(value);
  }
  return `${prefix} ${state.message} ${value}`;
});
