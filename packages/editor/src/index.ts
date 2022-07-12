import chalk from 'chalk';
import { editAsync } from 'external-editor';
import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  AsyncPromptConfig,
} from '@inquirer/core';

type EditorConfig = AsyncPromptConfig & {
  default?: string;
  postfix?: string;
};

export default createPrompt<string, EditorConfig>((config, done) => {
  const [status, setStatus] = useState<string>('pending');
  const [value, setValue] = useState<string>(config.default || '');
  const [errorMsg, setError] = useState<string | undefined>(undefined);

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
            setError(error.toString());
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
