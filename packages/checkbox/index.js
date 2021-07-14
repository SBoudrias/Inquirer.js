const { createPrompt } = require('@inquirer/core');
const { isUpKey, isDownKey, isSpaceKey, isNumberKey } = require('@inquirer/core/lib/key');
const Paginator = require('@inquirer/core/lib/Paginator');
const chalk = require('chalk');
const figures = require('figures');
const { cursorHide } = require('ansi-escapes');

module.exports = createPrompt(
  (readline) => ({
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
      } else if (isSpaceKey(key)) {
        setState({
          showHelpTip: false,
          choices: choices.map((choice, i) => {
            if (i === cursorPosition) {
              return { ...choice, checked: !choice.checked };
            }

            return choice;
          }),
        });
      } else if (key.name === 'a') {
        const selectAll = Boolean(choices.find((choice) => !choice.checked));
        setState({
          choices: choices.map((choice) => ({ ...choice, checked: selectAll })),
        });
      } else if (key.name === 'i') {
        setState({
          choices: choices.map((choice) => ({ ...choice, checked: !choice.checked })),
        });
      } else if (isNumberKey(key)) {
        // Adjust index to start at 1
        const position = Number(key.name) - 1;

        // Abort if the choice doesn't exists or if disabled
        if (!choices[position] || choices[position].disabled) {
          return;
        }

        setState({
          cursorPosition: position,
          choices: choices.map((choice, i) => {
            if (i === position) {
              return { ...choice, checked: !choice.checked };
            }

            return choice;
          }),
        });
      }
    },
    mapStateToValue: ({ choices }) =>
      choices.filter((choice) => choice.checked).map((choice) => choice.value),
    paginator: new Paginator(readline),
  }),
  (state, { paginator }) => {
    const { prefix, choices, showHelpTip, cursorPosition = 0, pageSize = 7 } = state;
    const message = chalk.bold(state.message);

    if (state.status === 'done') {
      const selection = choices
        .filter((choice) => choice.checked)
        .map(({ name, value }) => name || value);
      return `${prefix} ${message} ${chalk.cyan(selection.join(', '))}`;
    }

    let helpTip = '';
    if (showHelpTip !== false) {
      const keys = [
        `${chalk.cyan.bold('<space>')} to select`,
        `${chalk.cyan.bold('<a>')} to toggle all`,
        `${chalk.cyan.bold('<i>')} to invert selection`,
      ];
      helpTip = ` (Press ${keys.join(', ')})`;
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
    return `${prefix} ${message}${helpTip}\n${windowedChoices}${cursorHide}`;
  }
);
