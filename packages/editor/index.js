const chalk = require('chalk');
const { editAsync } = require('external-editor');
const { createPrompt, useState, useKeypress } = require('@inquirer/core/hooks');
const { usePrefix } = require('@inquirer/core/lib/prefix');
const { isEnterKey } = require('@inquirer/core/lib/key');

module.exports = createPrompt((config, done) => {
  const [status, setStatus] = useState('pending');
  const [value, setValue] = useState(config.default || '');
  const [errorMsg, setError] = useState();

  useKeypress(async (key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'pending') {
      return;
    }

    if (isEnterKey(key)) {
      rl.pause();
      editAsync(
        value,
        async (error, answer) => {
          rl.resume();
          if (error) {
            setError(error);
          } else {
            setStatus('loading');
            const isValid = await config.validate(answer);
            if (isValid === true) {
              setError(undefined);
              setStatus('done');
              done(answer);
            } else {
              setValue(answer);
              setError(isValid || 'You must provide a valid value');
              setStatus('pending');
            }
          }
        },
        {
          postfix: config.postfix || '.txt',
        }
      );
    }
  });

  const isLoading = status === 'loading';
  const prefix = usePrefix(isLoading);

  let message = chalk.bold(config.message);
  if (status === 'loading') {
    message += chalk.dim(' Received');
  } else if (status === 'pending') {
    message += chalk.dim(' Press <enter> to launch your preferred editor.');
  }

  let error = '';
  if (errorMsg) {
    error = chalk.red(`> ${errorMsg}`);
  }

  return [`${prefix} ${message}`, error];
});
