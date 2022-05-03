import chalk from 'chalk';
import { createPrompt, useState, useKeypress } from '@inquirer/core/hooks';
import { isEnterKey } from '@inquirer/core/lib/key';
import { usePrefix } from '@inquirer/core/lib/prefix';

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
