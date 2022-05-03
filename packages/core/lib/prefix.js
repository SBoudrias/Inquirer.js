import chalk from 'chalk';
import cliSpinners from 'cli-spinners';
import { useState, useEffect } from '../hooks';

const spinner = cliSpinners.dots;

exports.usePrefix = (isLoading) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setTick(tick + 1);
      }, spinner.interval);

      return () => clearTimeout(timeout);
    }
  }, [isLoading, tick]);

  if (isLoading) {
    const frame = tick % spinner.frames.length;
    return chalk.yellow(spinner.frames[frame]);
  }

  return chalk.green('?');
};
