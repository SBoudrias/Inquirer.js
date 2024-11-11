import { AsyncResource } from 'node:async_hooks';
import { editAsync, IFileOptions } from 'external-editor';
import {
  createPrompt,
  useEffect,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  makeTheme,
  type Theme,
  type Status,
} from '@inquirer/core';
import type { PartialDeep, InquirerReadline } from '@inquirer/type';

type EditorConfig = {
  message: string;
  default?: string;
  postfix?: string;
  waitForUseInput?: boolean;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
  file?: IFileOptions;
  theme?: PartialDeep<Theme>;
};

export default createPrompt<string, EditorConfig>((config, done) => {
  const {
    waitForUseInput = true,
    file: { postfix = config.postfix ?? '.txt', ...fileProps } = {},
    validate = () => true,
  } = config;
  const theme = makeTheme(config.theme);

  const [status, setStatus] = useState<Status>('idle');
  const [value, setValue] = useState<string>(config.default || '');
  const [errorMsg, setError] = useState<string>();

  const prefix = usePrefix({ status, theme });

  function startEditor(rl: InquirerReadline) {
    rl.pause();

    // Note: The bind call isn't strictly required. But we need it for our mocks to work as expected.
    const editCallback = AsyncResource.bind(
      async (error: Error | undefined, answer: string) => {
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
            setStatus('idle');
          }
        }
      },
    );

    editAsync(value, (error, answer) => void editCallback(error, answer), {
      postfix,
      ...fileProps,
    });
  }

  useEffect((rl) => {
    if (!waitForUseInput) {
      startEditor(rl);
    }
  }, []);

  useKeypress((key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'idle') {
      return;
    }

    if (isEnterKey(key)) {
      startEditor(rl);
    }
  });

  const message = theme.style.message(config.message, status);
  let helpTip = '';
  if (status === 'loading') {
    helpTip = theme.style.help('Received');
  } else if (status === 'idle') {
    const enterKey = theme.style.key('enter');
    helpTip = theme.style.help(`Press ${enterKey} to launch your preferred editor.`);
  }

  let error = '';
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }

  return [[prefix, message, helpTip].filter(Boolean).join(' '), error];
});
