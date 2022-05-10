import { createPrompt, useState, useKeypress } from '@inquirer/core/hooks';
import { usePrefix } from '@inquirer/core/lib/prefix';
import { isEnterKey, isBackspaceKey } from '@inquirer/core/lib/key';
import chalk from 'chalk';

export default createPrompt((config, done) => {
  const [status, setStatus] = useState('pending');
  const [defaultValue, setDefaultValue] = useState(config.default);
  const [errorMsg, setError] = useState();
  const [value, setValue] = useState('');

  const isLoading = status === 'loading';
  const prefix = usePrefix(isLoading);

  useKeypress(async (key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'pending') {
      return;
    }

    if (isEnterKey(key)) {
      const answer = value || defaultValue || '';
      setStatus('loading');
      const isValid = await config.validate(answer);
      if (isValid === true) {
        setValue(answer);
        setStatus('done');
        done(answer);
      } else {
        // TODO: Can we keep the value after validation failure?
        // `rl.line = value` works but it looses the cursor position.
        setValue('');
        setError(isValid || 'You must provide a valid value');
        setStatus('pending');
      }
    } else if (isBackspaceKey(key) && !value) {
      setDefaultValue(undefined);
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });

  const message = chalk.bold(config.message);
  let formattedValue = value;
  if (typeof config.transformer === 'function') {
    formattedValue = config.transformer(value, { isFinal: status === 'done' });
  }
  if (status === 'done') {
    formattedValue = chalk.cyan(formattedValue);
  }

  let defaultStr = '';
  if (defaultValue && status !== 'done' && !value) {
    defaultStr = chalk.dim(` (${defaultValue})`);
  }

  let error = '';
  if (errorMsg) {
    error = chalk.red(`> ${errorMsg}`);
  }

  return [`${prefix} ${message}${defaultStr} ${formattedValue}`, error];
});
