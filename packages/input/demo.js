const chalk = require('chalk');
const input = require('.');

const hexRegEx = /([0-9]|[a-f])/gim;
const isHex = (value) =>
  (value.match(hexRegEx) || []).length === value.length &&
  (value.length === 3 || value.length === 6);

(async () => {
  let answer;

  answer = await input({
    message: 'Enter an hex color?',
    transformer: (value = '', { isFinal }) => {
      const color = chalk.hex(isHex(value) ? value : 'fff');
      return isFinal ? color.underline(value) : color(value);
    },
    validate: (value = '') => isHex(value) || 'Pass a valid hex value',
  });
  console.log('Answer:', answer);

  answer = await input({
    message: '(Slow validation) provide a number:',
    validate: (value) =>
      new Promise((resolve) => {
        setTimeout(
          () => resolve(!Number.isNaN(Number(value)) || 'You must provide a number'),
          3000
        );
      }),
  });
  console.log('Answer:', answer);

  answer = await input({
    message: () =>
      new Promise((resolve) => {
        setTimeout(() => resolve('(Slow message) Input any value:'), 3000);
      }),
  });
  console.log('Answer:', answer);

  answer = await input({
    message: "What's your favorite food?",
    default: 'Croissant',
  });
  console.log('Answer:', answer);
})();
