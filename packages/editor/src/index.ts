import { editAsync, IFileOptions } from '@inquirer/external-editor';
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
import colors from 'yoctocolors-cjs';

type EditorTheme = {
  validationFailureMode: 'keep' | 'clear';
  helpMode: 'always' | 'never' | 'auto';
};

const editorTheme: EditorTheme = {
  validationFailureMode: 'keep',
  helpMode: 'auto',
};

type EditorConfig = {
  message: string;
  default?: string;
  postfix?: string;
  waitForUseInput?: boolean;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
  file?: IFileOptions;
  theme?: PartialDeep<Theme<EditorTheme>>;
};

export default createPrompt<string, EditorConfig>((config, done) => {
  const {
    waitForUseInput = true,
    file: { postfix = config.postfix ?? '.txt', ...fileProps } = {},
    validate = () => true,
  } = config;
  const theme = makeTheme<EditorTheme>(editorTheme, config.theme);

  const [status, setStatus] = useState<Status>('idle');
  const [value = '', setValue] = useState<string | undefined>(config.default);
  const [errorMsg, setError] = useState<string>();

  const prefix = usePrefix({ status, theme });

  function startEditor(rl: InquirerReadline) {
    rl.pause();

    const editCallback = async (error: Error | undefined, answer: string | undefined) => {
      rl.resume();
      if (error) {
        setError(error.toString());
      } else {
        setStatus('loading');
        const finalAnswer = answer ?? '';
        const isValid = await validate(finalAnswer);
        if (isValid === true) {
          setError(undefined);
          setStatus('done');
          done(finalAnswer);
        } else {
          if (theme.validationFailureMode === 'clear') {
            setValue(config.default);
          } else {
            setValue(finalAnswer);
          }

          setError(isValid || 'You must provide a valid value');
          setStatus('idle');
        }
      }
    };

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
  let helpLine: string | undefined;
  if (theme.helpMode !== 'never') {
    if (status === 'loading') {
      helpLine = theme.style.help('Received');
    } else if (status === 'idle') {
      helpLine = theme.style.help(`⏎ ${colors.bold('launch editor')}`);
    }
  }

  let error = '';
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }

  const header = [prefix, message].filter(Boolean).join(' ');
  const lines = [header];
  if (helpLine) lines.push(helpLine);

  return [lines.join('\n'), error];
});
