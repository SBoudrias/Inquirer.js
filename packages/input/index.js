const { createPrompt } = require('@inquirer/core');
const chalk = require('chalk');

module.exports = createPrompt({}, state => {
  const { prefix, message, value, status } = state;
  let formattedValue = value;
  if (status === 'done') {
    formattedValue = chalk.cyan(value);
  }
  return `${prefix} ${message} ${formattedValue}`;
});
