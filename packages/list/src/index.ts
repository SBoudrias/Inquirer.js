import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  makeTheme,
  type Theme,
  type Status,
  isUpKey,
  isDownKey,
  isBackspaceKey,
  isTabKey,
} from '@inquirer/core';
import { styleText } from 'util';
import type { PartialDeep } from '@inquirer/type';
import figures from '@inquirer/figures';

interface ListTheme {
  validationFailureMode: 'keep' | 'clear';
  icon: { cursor: string };
  style: {
    keysHelpTip: (keys: [key: string, action: string][]) => string | undefined;
  };
}

const listTheme: ListTheme = {
  validationFailureMode: 'keep',
  icon: {
    cursor: figures.pointer,
  },
  style: {
    keysHelpTip: (keys: [string, string][]) =>
      keys
        .map(([key, action]) => `${styleText('bold', key)} ${styleText('dim', action)}`)
        .join(styleText('dim', ' • ')),
  },
};

interface ListConfig {
  message: string;
  default?: string[];
  min?: number;
  max?: number;
  unique?: true;
  uniqueError?: string;
  prefill?: 'tab' | 'editable';
  transformer?: (value: string, { isFinal }: { isFinal: boolean }) => string;
  validateEntry?: (value: string) => boolean | string | Promise<boolean | string>;
  validateList?: (value: string[]) => boolean | string | Promise<boolean | string>;
  theme?: PartialDeep<Theme<ListTheme>>;
  pattern?: RegExp;
  patternError?: string;
}

export default createPrompt<string[], ListConfig>((config, done) => {
  const theme = makeTheme<ListTheme>(listTheme, config.theme);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>();
  const [input, setInput] = useState<string>('');

  const { min = 0, max = Infinity } = config;
  const [values, setValues] = useState<string[]>([...(config.default ?? [])]);
  const [selected, setSelected] = useState<number>(-1);
  const prefix = usePrefix({ status, theme });
  const [navigation, setNavigation] = useState<boolean>(false);

  async function validateEntry(value: string): Promise<true | string> {
    const {
      pattern,
      patternError = 'Invalid input',
      unique,
      uniqueError = 'This entry is already in the list',
    } = config;

    if (unique && values.includes(value)) {
      return uniqueError;
    }

    if (pattern && !pattern.test(value)) {
      return patternError;
    }

    if (typeof config.validateEntry === 'function') {
      return (await config.validateEntry(value)) || 'You must provide a valid value';
    }

    return true;
  }

  async function validateList(
    value: string[],
    options: { isFinal: boolean },
  ): Promise<true | string> {
    if (options.isFinal) {
      if (value.length < min) {
        return `Please provide at least ${String(min)} lines`;
      }
    }

    if (value.length > max) {
      return `Please provide no more than ${String(max)} lines`;
    }

    if (typeof config.validateList === 'function') {
      return (await config.validateList(value)) || `The list is not valid`;
    }

    return true;
  }

  useKeypress(async (key, rl) => {
    /**
     * Prevent any input when loading or done
     */
    if (status !== 'idle') {
      return;
    }

    /**
     * Handle tab key to enter/exit navigation mode
     */
    if (isTabKey(key)) {
      rl.clearLine(0);
      if (!navigation && values.length > 0) {
        setNavigation(true);
        setSelected(0);
      } else if (navigation) {
        setNavigation(false);
        setSelected(-1);
        rl.write(input);
      }

      return;
    }

    /**
     * Handle Ctrl + Enter/J to submit current entries
     */
    if (key.name === 'enter') {
      const isValid = await validateList(values, { isFinal: true });

      if (isValid === true) {
        setStatus('done');
        done(values);
      } else {
        setError(isValid);
      }

      return;
    }

    /**
     * Handle navigation mode controls
     */
    if (navigation) {
      if (isUpKey(key) && selected > 0) {
        rl.clearLine(0);
        setSelected(selected - 1);
      }

      if (isDownKey(key) && selected < values.length - 1) {
        rl.clearLine(0);
        setSelected(selected + 1);
      }

      if (isBackspaceKey(key) && selected !== -1) {
        const value = values.filter((_, index) => index !== selected);
        setValues(value);
        setSelected(Math.max(0, Math.min(selected, value.length - 1)));
        if (value.length === 0) {
          setNavigation(false);
          setSelected(-1);
        }
      }

      return;
    }

    /**
     * Handle input and validation in edit mode
     */
    if (key.name === 'return') {
      const answer = input;
      setStatus('loading');

      let isValid = await validateEntry(answer);

      const newValues = [...values, answer];

      if (isValid === true) {
        isValid = await validateList(newValues, { isFinal: false });
      }

      if (isValid === true) {
        setSelected(-1);
        setValues(newValues);
        setInput('');
        setStatus('idle');
      } else {
        if (theme.validationFailureMode === 'clear') {
          setInput('');
        } else {
          // Reset the readline line value to the previous value. On line event, the value
          // get cleared, forcing the user to re-enter the value instead of fixing it.
          rl.write(input);
        }
        setError(isValid);
        setStatus('idle');
      }

      return;
    }

    setInput(rl.line);
    setError(undefined);
  });

  const message = theme.style.message(config.message, status);

  let formattedInput = input;
  if (typeof config.transformer === 'function') {
    formattedInput = config.transformer(input, {
      isFinal: false,
    });
  }

  const formattedValues = values
    .map((line, index) => {
      const isActive = index === selected;

      // Apply transformer if provided
      let displayValue = line;
      if (typeof config.transformer === 'function') {
        displayValue = config.transformer(line, {
          isFinal: status === 'done',
        });
      }

      // Apply styling
      const color =
        status === 'done'
          ? theme.style.answer
          : isActive
            ? theme.style.highlight
            : (x: string) => x;

      const cursor = isActive ? theme.icon.cursor : ` `;
      return color(`${cursor} ${displayValue}`);
    })
    .join('\n');

  const helpline =
    status !== 'done' && values.length
      ? theme.style.keysHelpTip(
          navigation
            ? [
                ['tab', 'edit'],
                ['↑↓', 'navigate'],
                ['del', 'delete'],
                ['ctrl+enter', 'done'],
              ]
            : [
                ['tab', 'navigate'],
                ['enter', 'add'],
                ['ctrl+enter', 'done'],
              ],
        )
      : undefined;

  const errorMsg = error ? theme.style.error(error) : '';

  // Compose final output
  const header = [prefix, message, formattedInput].join(' ');

  const body = [errorMsg, formattedValues, ' ', helpline]
    .filter(Boolean)
    .join('\n')
    .trimEnd();

  return [header, body];
});
