const { createPrompt } = require('@inquirer/core');
const chalk = require('chalk');

module.exports = createPrompt(
  {
    onLine(state, { submit, setState }) {
      // Handle expanding the prompt only if:
      // 1. Prompt isn't expanded
      // 2. If user do not provide a default (in such case we select the help as default)
      if (
        !state.expanded &&
        (state.value.toLowerCase() === 'h' || (state.value === '' && !state.default))
      ) {
        setState({ expanded: true });
      } else {
        submit();
      }
    },
    mapStateToValue({ value = '', choices, default: defaultOption }) {
      let selection;
      if (value) {
        selection = choices.find(choice => choice.key === value.toLowerCase());
      } else if (defaultOption) {
        selection = choices.find(choice => choice.key === defaultOption.toLowerCase());
      }

      if (!selection) {
        return undefined;
      }

      return selection.value || selection.name;
    },
    validate(selection, { value = '', choices }) {
      // If we matched an option, no need to run validation.
      if (selection) {
        return true;
      }

      if (value === '') {
        return 'Please input a value';
      }

      return (
        Boolean(choices.find(({ key }) => key === value.toLowerCase())) ||
        `"${chalk.red(value)}" isn't an available option`
      );
    }
  },
  (state, { mapStateToValue }) => {
    const { prefix, choices, value = '', expanded = false, default: rawDefault } = state;
    const message = chalk.bold(state.message);

    if (state.status === 'done') {
      const selection = mapStateToValue(state);
      return `${prefix} ${message} ${chalk.cyan(selection)}`;
    }

    let choicesDisplay;

    // Expanded display style
    if (expanded) {
      choicesDisplay = choices.map(choice => {
        const line = `\n  ${choice.key}) ${choice.name || choice.value}`;
        if (choice.key === value.toLowerCase()) {
          return chalk.cyan(line);
        }

        return line;
      });

      return `${prefix} ${message} ${value} ${choicesDisplay}`;
    }

    // Collapsed display style
    choicesDisplay = choices
      .map(choice => {
        if (choice.key === rawDefault) {
          return choice.key.toUpperCase();
        }

        return choice.key;
      })
      .join('');
    choicesDisplay += rawDefault ? 'h' : 'H';
    choicesDisplay = chalk.dim(`(${choicesDisplay})`);

    let helpTip = '';
    const currentOption = choices.find(({ key }) => key === value.toLowerCase());
    if (currentOption) {
      helpTip = `\n${chalk.cyan('>>')} ${currentOption.name || currentOption.value}`;
    } else if (value.toLowerCase() === 'h') {
      helpTip = `\n${chalk.cyan('>>')} Help, list all options`;
    }

    return `${prefix} ${message} ${choicesDisplay} ${value}${helpTip}`;
  }
);
