import input from '@inquirer/input/src';
import chalk from 'chalk';

type PasswordConfig = {
  type: string;
  name: string;
  message: string | (() => any);
  mask: boolean | string; 
  default: any; 
  filter: () => any; 
  validate: (input: string) => string | boolean | Promise<string | boolean>;
  transformer: (input: string, { isFinal }: { isFinal: boolean }) => string;
};

export default (config: Partial<PasswordConfig>, ...args: any[]) => {
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
    ...args
  );
};
