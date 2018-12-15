const { createPrompt } = require('@inquirer/core');
const { isUpKey, isDownKey, isSpaceKey } = require('@inquirer/core/lib/key');
const Paginator = require('@inquirer/core/lib/Paginator');
const chalk = require('chalk');
const figures = require('figures');
const { cursorHide } = require('ansi-escapes');

module.exports = createPrompt(
  readline => ({
    onKeypress: (value, key, { cursorPosition = 0, choices }, setState) => {
      let newCursorPosition = cursorPosition;
      if (isUpKey(key) || isDownKey(key)) {
        const offset = isUpKey(key) ? -1 : 1;
        let selectedOption;

        while (!selectedOption || selectedOption.disabled) {
          newCursorPosition =
            (newCursorPosition + offset + choices.length) % choices.length;
          selectedOption = choices[newCursorPosition];
        }

        setState({ cursorPosition: newCursorPosition });
      }

      if (isSpaceKey(key)) {
        const newChoices = choices.map((choice, i) => {
          if (i === cursorPosition) {
            return Object.assign({}, choice, { checked: !choice.checked });
          }
          return choice;
        });
        setState({
          choices: newChoices,
          value: newChoices.filter(choice => choice.checked).map(choice => choice.value)
        });
      }
    },
    paginator: new Paginator(readline)
  }),
  (state, { paginator }) => {
    const { prefix, message, choices, cursorPosition = 0, pageSize = 7 } = state;

    if (state.status === 'done') {
      const choice = choices[cursorPosition];
      return `${prefix} ${message} ${chalk.cyan(choice.name || choice.value)}`;
    }

    const allChoices = choices
      .map(({ name, value, checked, disabled }, index) => {
        const line = name || value;
        if (disabled) {
          return chalk.dim(` - ${line} (disabled)`);
        }
        const checkbox = checked ? chalk.green(figures.circleFilled) : figures.circle;
        if (index === cursorPosition) {
          return chalk.cyan(`${figures.pointer}${checkbox} ${line}`);
        }
        return ` ${checkbox} ${line}`;
      })
      .join('\n');
    const windowedChoices = paginator.paginate(allChoices, cursorPosition, pageSize);
    return `${prefix} ${message}\n${windowedChoices}${cursorHide}`;
  }
);
