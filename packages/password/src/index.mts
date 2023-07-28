import type { Prompt } from '@inquirer/type';
import input from '@inquirer/input';
import chalk from 'chalk';

type InputConfig = Parameters<typeof input>[0];
type PasswordConfig = InputConfig & {
  mask?: boolean | string;
};

const password: Prompt<string, Omit<PasswordConfig, 'transformer' | 'default'>> = (
  config,
  context,
) => {
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
          return chalk.dim('[input is masked]');
        }

        return '';
      },
    },
    context,
  );
};

export default password;
