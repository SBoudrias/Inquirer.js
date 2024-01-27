import chalk from 'chalk';
import {
  createPrompt,
  useState,
  useKeypress,
  isEnterKey,
  usePrefix,
} from '@inquirer/core';
import type {} from '@inquirer/type';

type ConfirmConfig = {
  message: string;
  default?: boolean;
  transformer?: (value: boolean) => string;
};

export default createPrompt<boolean, ConfirmConfig>((config, done) => {
  const { transformer = (answer) => (answer ? 'yes' : 'no') } = config;
  const [status, setStatus] = useState('pending');
  const [value, setValue] = useState('');
  const prefix = usePrefix();

  useKeypress((key, rl) => {
    if (isEnterKey(key)) {
      let answer = config.default !== false;
      if (/^(y|yes)/i.test(value)) answer = true;
      else if (/^(n|no)/i.test(value)) answer = false;

      setValue(transformer(answer));
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
