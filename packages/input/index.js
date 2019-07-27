const { createPrompt, useState, useKeypress } = require('@inquirer/core/hooks');
const { usePrefix } = require('@inquirer/core/lib/prefix');
const chalk = require('chalk');

module.exports = createPrompt((config, done) => {
  const [status, setStatus] = useState('pending');
  const [errorMsg, setError] = useState();
  const [value, setValue] = useState(config.default || '');

  const isLoading = status === 'loading';
  const prefix = usePrefix(isLoading);

  useKeypress(async (key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'pending') {
      return;
    }

    if (key.name === 'enter' || key.name === 'return') {
      setStatus('loading');
      const isValid = await config.validate(value);
      if (isValid === true) {
        setStatus('done');
        done(value);
      } else {
        // TODO: Can we keep the value after validation failure?
        // `rl.line = value` works but it looses the cursor position.
        setValue('');
        setError(isValid || 'You must provide a valid value');
        setStatus('pending');
      }
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });

  const message = chalk.bold(config.message);
  let formattedValue = value;
  if (typeof config.transformer === 'function') {
    formattedValue = config.transformer(value, { isFinal: status === 'done' });
  } else if (status === 'done') {
    formattedValue = chalk.cyan(value);
  }

  let defaultValue = '';
  if (config.default && status !== 'done' && !value) {
    defaultValue = chalk.dim(` (${config.default})`);
  }

  let error = '';
  if (errorMsg) {
    error = chalk.red(`> ${errorMsg}`);
  }

  return [`${prefix} ${message}${defaultValue} ${formattedValue}`, error];
});
