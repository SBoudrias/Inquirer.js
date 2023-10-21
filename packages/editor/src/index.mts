import chalk from 'chalk';
import { editAsync } from 'external-editor';
import {
  createPrompt,
  useEffect,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  type InquirerReadline,
} from '@inquirer/core';
import type {} from '@inquirer/type';

type EditorConfig = {
  message: string;
  default?: string;
  postfix?: string;
  waitForUseInput?: boolean;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
};

export default createPrompt<string, EditorConfig>((config, done) => {
  const { waitForUseInput = true, validate = () => true } = config;
  const [status, setStatus] = useState<string>('pending');
  const [value, setValue] = useState<string>(config.default || '');
  const [errorMsg, setError] = useState<string | undefined>(undefined);

  function startEditor(rl: InquirerReadline) {
    rl.pause();
    editAsync(
      value,
      async (error, answer) => {
        rl.resume();
        if (error) {
          setError(error.toString());
        } else {
          setStatus('loading');
          const isValid = await validate(answer);
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
      },
    );
  }

  useEffect((rl) => {
    if (!waitForUseInput) {
      startEditor(rl);
    }
  }, []);

  useKeypress((key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'pending') {
      return;
    }

    if (isEnterKey(key)) {
      startEditor(rl);
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
