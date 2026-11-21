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
    validationError: () => string;
  };
};

const editorTheme: EditorTheme = {
  validationFailureMode: 'keep',
  style: {
    loadingMessage: () => 'Validating...',
    waitingMessage: (enterKey) => `Press ${enterKey} to launch your preferred editor.`,
    validationError: () => 'You must provide a valid value',
  },
};

type EditorConfig = {
  message: string;
  default?: string | undefined;
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

    let answer: string;
    try {
      answer = await editAsync(value, { postfix, ...fileProps });
    } catch (error: unknown) {
      // Only the external editor failed here, so the readline is guaranteed
      // to still be open (it stays paused across editAsync): resume it so the
      // user can retry, and surface the error.
      rl.resume();
      setError(String(error));
      return;
    }

    rl.resume();
    setStatus('loading');

    // Validation can fail two ways — the validator returning false/an error
    // message, or throwing — and the user's edits deserve the same treatment
    // in both: kept for the next editing round in 'keep' mode, reset to the
    // config default in 'clear' mode. Applying this on throw too is what
    // makes the editor reopen with the edited value instead of silently
    // dropping it.
    const validationFailed = (errorMsg: string) => {
      setValue(theme.validationFailureMode === 'clear' ? config.default : answer);
      setError(errorMsg);
      setStatus('idle');
    };

    try {
      const isValid = await validate(answer);
      if (isValid === true) {
        setError(undefined);
        setStatus('done');
        done(answer);
      } else {
        validationFailed(isValid || theme.style.validationError());
      }
    } catch (error: unknown) {
      // The readline was already resumed above, before validation started, so
      // there is nothing to resume here — and it may already be closed: on
      // EOF (#2428) the prompt rejects with ExitPromptError while a submitted
      // answer is still validating. Resuming the closed readline there would
      // raise an unhandled ERR_USE_AFTER_CLOSE after the caller already
      // handled the exit. Surface the error and let the user retry instead.
      validationFailed(String(error));
    }
  }

  useEffect((rl) => {
    if (!waitForUserInput) {
      void startEditor(rl);
    }
  }, []);

  useKeypress((key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'idle') {
      return;
    }

    if (isEnterKey(key)) {
      void startEditor(rl);
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
