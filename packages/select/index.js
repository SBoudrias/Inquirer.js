const { createPrompt } = require('@inquirer/core');
const { isUpKey, isDownKey, isNumberKey } = require('@inquirer/core/lib/key');
const Paginator = require('@inquirer/core/lib/Paginator');
const chalk = require('chalk');
const figures = require('figures');
const { cursorHide } = require('ansi-escapes');

module.exports = createPrompt(
  readline => ({
    onKeypress: (value, key, { cursorPosition = 0, choices }, setState) => {
      if (isUpKey(key) || isDownKey(key)) {
        let newCursorPosition = cursorPosition;
        const offset = isUpKey(key) ? -1 : 1;
        let selectedOption;

        while (!selectedOption || selectedOption.disabled) {
          newCursorPosition =
            (newCursorPosition + offset + choices.length) % choices.length;
          selectedOption = choices[newCursorPosition];
        }

        setState({ cursorPosition: newCursorPosition });
      } else if (isNumberKey(key)) {
        // Adjust index to start at 1
        const newCursorPosition = Number(key.name) - 1;

        // Abort if the choice doesn't exists or if disabled
        if (!choices[newCursorPosition] || choices[newCursorPosition].disabled) {
          return;
        }

        setState({ cursorPosition: newCursorPosition });
      }
    },
    mapStateToValue: ({ cursorPosition = 0, choices }) => {
      return choices[cursorPosition].value;
    },
    paginator: new Paginator(readline)
  }),
  (state, { paginator }) => {
    const { prefix, choices, cursorPosition = 0, pageSize = 7 } = state;
    const message = chalk.bold(state.message);

    if (state.status === 'done') {
      const choice = choices[cursorPosition];
      return `${prefix} ${message} ${chalk.cyan(choice.name || choice.value)}`;
    }

    const allChoices = choices
      .map(({ name, value, disabled }, index) => {
        const line = name || value;
        if (disabled) {
          return chalk.dim(`- ${line} (disabled)`);
        }

        if (index === cursorPosition) {
          return chalk.cyan(`${figures.pointer} ${line}`);
        }

        return `  ${line}`;
      })
      .join('\n');
    const windowedChoices = paginator.paginate(allChoices, cursorPosition, pageSize);
    return `${prefix} ${message}\n${windowedChoices}${cursorHide}`;
  }
);
