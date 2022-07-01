import input, { InputConfig } from '@inquirer/input/src';
import chalk from 'chalk';

type PasswordConfig = InputConfig & {
  mask?: boolean | string;
};

export default (config: PasswordConfig, stdio: Parameters<typeof input>[1]) => {
  if (config.transformer) {
    throw new Error(
      'Inquirer password prompt do not support custom transformer function. Use the input prompt instead.'
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
    stdio
  );
};
