const chalk = require('chalk');
const { createPrompt, useState, useKeypress } = require('@inquirer/core/hooks');
const { isEnterKey } = require('@inquirer/core/lib/key');
const { usePrefix } = require('@inquirer/core/lib/prefix');

module.exports = createPrompt((config, done) => {
  const [status, setStatus] = useState('pending');
  const [value, setValue] = useState('');
  const prefix = usePrefix();

  useKeypress((key, rl) => {
    if (isEnterKey(key)) {
      const answer = value ? /^y(es)?/i.test(value) : config.default !== false;
      setValue(answer ? 'yes' : 'no');
      setStatus('done');
      done(answer);
    } else {
      setValue(rl.line);
    }
  });

  let formattedValue = value;
  let defaultValue = '';
  if (status === 'done') {
    formattedValue = chalk.cyan(value);
  } else {
    defaultValue = chalk.dim(config.default === false ? ' (y/N)' : ' (Y/n)');
  }

  const message = chalk.bold(config.message);
  return `${prefix} ${message}${defaultValue} ${formattedValue}`;
});
