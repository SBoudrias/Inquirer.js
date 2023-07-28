import type { Prompt } from '@inquirer/type';
import input from '@inquirer/input';
import chalk from 'chalk';
import ansiEscapes from 'ansi-escapes';

type InputConfig = Parameters<typeof input>[0];
type PasswordConfig = Omit<InputConfig, 'transformer' | 'default'> & {
  mask?: boolean | string;
};

const password: Prompt<string, PasswordConfig> = (config, context) => {
  if ('transformer' in config) {
    throw new Error(
      'Inquirer password prompt do not support custom transformer function. Use the input prompt instead.',
    );
  }

  return input(
    {
      ...config, // Make sure we do not display the default password
      default: undefined,
      transformer(input: string, { isFinal }: { isFinal: boolean }) {
        if (config.mask) {
          return String(config.mask).repeat(input.length);
        }

        if (!isFinal) {
          return `${chalk.dim('[input is masked]')}${ansiEscapes.cursorHide}`;
        }

        return '';
      },
    },
    context,
  );
};

export default password;
