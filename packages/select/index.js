const { createPrompt } = require('@inquirer/core');
const { isUpKey, isDownKey } = require('@inquirer/core/lib/key');
const chalk = require('chalk');

module.exports = createPrompt(
  {
    onKeypress: (value, key, { cursorPosition = 0, choices }, setState) => {
      let newCursorPosition = cursorPosition;
      if (isUpKey(key)) {
        newCursorPosition = (cursorPosition + 1) % choices.length;
      } else if (isDownKey(key)) {
        newCursorPosition = (cursorPosition - 1 + choices.length) % choices.length;
      }

      if (newCursorPosition !== cursorPosition) {
        setState({
          cursorPosition: newCursorPosition,
          value: choices[newCursorPosition].value
        });
      }
    }
  },
  state => {
    const { prefix, message, choices, cursorPosition = 0 } = state;

    if (state.status === 'done') {
      const choice = choices[cursorPosition];
      return `${prefix} ${message} ${chalk.cyan(choice.name || choice.value)}`;
    }

    const cursorChar = '> ';
    const padding = '  ';
    const list = choices
      .map(
        ({ name, value }, index) =>
          `${index === cursorPosition ? cursorChar : padding}${name || value}`
      )
      .join('\n');
    return `${prefix} ${message}\n${list}\n`;
  }
);
