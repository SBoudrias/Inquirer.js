import chalk from 'chalk';
import {
  createPrompt,
  useState,
  useKeypress,
  isEnterKey,
  usePrefix,
  AsyncPromptConfig,
} from '@inquirer/core';
import type {} from '@inquirer/type';

type ConfirmConfig = AsyncPromptConfig & {
  message: string;
  default?: boolean;
  transformer?: (value: boolean) => string;
};

export default createPrompt<boolean | string, ConfirmConfig>((config, done) => {
  const [status, setStatus] = useState('pending');
  const [value, setValue] = useState('');
  const prefix = usePrefix();

  useKeypress((key, rl) => {
    if (isEnterKey(key)) {
      const answer = value ? /^y(es)?/i.test(value) : config.default !== false;
      if (typeof config.transformer === 'function') {
        setValue(config.transformer(answer));
      } else {
        setValue(answer ? 'yes' : 'no');
      }
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
