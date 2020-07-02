const chalk = require('chalk');
const spinner = require('cli-spinners').dots;
const { useState, useEffect } = require('../hooks');

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
