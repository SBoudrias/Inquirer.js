import { editAsync, type FileOptions } from '@inquirer/external-editor';
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

type EditorTheme = {
  validationFailureMode: 'keep' | 'clear';
  style: {
    loadingMessage: () => string;
    waitingMessage: (enterKey: string) => string;
  };
};

const editorTheme: EditorTheme = {
  validationFailureMode: 'keep',
  style: {
    loadingMessage: () => 'Validating...',
    waitingMessage: (enterKey) => `Press ${enterKey} to launch your preferred editor.`,
  },
};

type EditorConfig = {
  message: string;
  default?: string;
  postfix?: string;
  waitForUserInput?: boolean;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
  file?: FileOptions;
  theme?: PartialDeep<Theme<EditorTheme>>;
};

export default createPrompt<string, EditorConfig>((config, done) => {
  const {
    waitForUserInput = true,
    file: { postfix = config.postfix ?? '.txt', ...fileProps } = {},
    validate = () => true,
  } = config;
  const theme = makeTheme<EditorTheme>(editorTheme, config.theme);

  const [status, setStatus] = useState<Status>('idle');
  const [value = '', setValue] = useState<string | undefined>(config.default);
  const [errorMsg, setError] = useState<string>();

  const prefix = usePrefix({ status, theme });

  async function startEditor(rl: InquirerReadline) {
    rl.pause();

    try {
      const answer = await editAsync(value, { postfix, ...fileProps });
      rl.resume();
      setStatus('loading');
      const isValid = await validate(answer);
      if (isValid === true) {
        setError(undefined);
        setStatus('done');
        done(answer);
      } else {
        if (theme.validationFailureMode === 'clear') {
          setValue(config.default);
        } else {
          setValue(answer);
        }
        setError(isValid || 'You must provide a valid value');
        setStatus('idle');
      }
    } catch (error: unknown) {
      rl.resume();
      setError(String(error));
    }
  }

  useEffect((rl) => {
    if (!waitForUserInput) {
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
    helpTip = theme.style.help(theme.style.loadingMessage());
  } else if (status === 'idle') {
    const enterKey = theme.style.key('enter');
    helpTip = theme.style.help(theme.style.waitingMessage(enterKey));
  }

  let error = '';
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }

  return [[prefix, message, helpTip].filter(Boolean).join(' '), error];
});
