/**
 * `rawlist` type prompt
 */

import colors from 'yoctocolors-cjs';
import { map, takeUntil } from 'rxjs';
import Separator from '../objects/separator.mjs';
import observe from '../utils/events.mjs';
import Paginator from '../utils/paginator.mjs';
import Base from './base.mjs';

export default class ExpandPrompt extends Base {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);

    // @ts-expect-error 2024-06-29
    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    // @ts-expect-error 2024-06-29
    this.validateChoices(this.opt.choices);

    // Add the default `help` (/expand) option
    // @ts-expect-error 2024-06-29
    this.opt.choices.push({
      key: 'h',
      name: 'Help, list all options',
      value: 'help',
    });

    // @ts-expect-error 2024-06-29
    this.opt.validate = (choice) => {
      if (choice == null) {
        return 'Please enter a valid command';
      }

      return choice !== 'help';
    };

    // Setup the default string (capitalize the default key)
    // @ts-expect-error 2024-06-29
    this.opt.default = this.generateChoicesString(this.opt.choices, this.opt.default);

    // @ts-expect-error 2024-06-29
    this.paginator = new Paginator(this.screen);
  }

  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */

  override _run(cb) {
    // @ts-expect-error 2024-06-29
    this.done = cb;

    // Save user answer and update prompt to show selected option.
    // @ts-expect-error 2024-06-29
    const events = observe(this.rl);
    const validation = this.handleSubmitEvents(
      events.line.pipe(map(this.getCurrentValue.bind(this))),
    );
    validation.success.forEach(this.onSubmit.bind(this));
    validation.error.forEach(this.onError.bind(this));
    // @ts-expect-error 2024-06-29
    this.keypressObs = events.keypress
      .pipe(takeUntil(validation.success))
      .forEach(this.onKeypress.bind(this));

    // Init the prompt
    // @ts-expect-error 2024-06-29
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   * @return {ExpandPrompt} self
   */

  render(error, hint) {
    let message = this.getQuestion();
    let bottomContent = '';

    // @ts-expect-error 2024-06-29
    if (this.status === 'answered') {
      // @ts-expect-error 2024-06-29
      message += colors.cyan(this.answer);
      // @ts-expect-error 2024-06-29
    } else if (this.status === 'expanded') {
      // @ts-expect-error 2024-06-29
      const choicesStr = renderChoices(this.opt.choices, this.selectedKey);
      // @ts-expect-error 2024-06-29
      message += this.paginator.paginate(choicesStr, this.selectedKey, this.opt.pageSize);
      message += '\n  Answer: ';
    }

    // @ts-expect-error 2024-06-29
    message += this.rl.line;

    if (error) {
      bottomContent = colors.red('>> ') + error;
    }

    if (hint) {
      bottomContent = colors.cyan('>> ') + hint;
    }

    // @ts-expect-error 2024-06-29
    this.screen.render(message, bottomContent);
  }

  getCurrentValue(input) {
    // @ts-expect-error 2024-06-29
    input ||= this.rawDefault;

    // @ts-expect-error 2024-06-29
    const selected = this.opt.choices.where({ key: input.toLowerCase().trim() })[0];
    if (!selected) {
      return null;
    }

    return selected.value;
  }

  /**
   * Generate the prompt choices string
   * @return {String}  Choices string
   */

  getChoices() {
    let output = '';

    // @ts-expect-error 2024-06-29
    this.opt.choices.forEach((choice) => {
      output += '\n  ';

      if (choice.type === 'separator') {
        output += ' ' + choice;
        return;
      }

      let choiceStr = choice.key + ') ' + choice.name;
      // @ts-expect-error 2024-06-29
      if (this.selectedKey === choice.key) {
        choiceStr = colors.cyan(choiceStr);
      }

      output += choiceStr;
    });

    return output;
  }

  onError(state) {
    if (state.value === 'help') {
      // @ts-expect-error 2024-06-29
      this.selectedKey = '';
      // @ts-expect-error 2024-06-29
      this.status = 'expanded';
      // @ts-expect-error 2024-06-29
      this.render();
      return;
    }

    // @ts-expect-error 2024-06-29
    this.render(state.isValid);
  }

  /**
   * When user press `enter` key
   */

  onSubmit(state) {
    // @ts-expect-error 2024-06-29
    this.status = 'answered';
    // @ts-expect-error 2024-06-29
    const choice = this.opt.choices.where({ value: state.value })[0];
    // @ts-expect-error 2024-06-29
    this.answer = choice.short || choice.name;

    // Re-render prompt
    // @ts-expect-error 2024-06-29
    this.render();
    // @ts-expect-error 2024-06-29
    this.screen.done();
    // @ts-expect-error 2024-06-29
    this.done(state.value);
  }

  /**
   * When user press a key
   */

  onKeypress() {
    // @ts-expect-error 2024-06-29
    this.selectedKey = this.rl.line.toLowerCase();
    // @ts-expect-error 2024-06-29
    const selected = this.opt.choices.where({ key: this.selectedKey })[0];
    // @ts-expect-error 2024-06-29
    if (this.status === 'expanded') {
      // @ts-expect-error 2024-06-29
      this.render();
    } else {
      this.render(null, selected ? selected.name : null);
    }
  }

  /**
   * Validate the choices
   * @param {Array} choices
   */

  validateChoices(choices) {
    let formatError;
    const errors: string[] = [];
    const keymap: Record<string, boolean> = {};

    choices
      .filter((item) => !Separator.isSeparator(item))
      .forEach((choice) => {
        if (!choice.key || choice.key.length !== 1) {
          formatError = true;
        }

        choice.key = String(choice.key).toLowerCase();

        if (keymap[choice.key]) {
          errors.push(choice.key);
        }

        keymap[choice.key] = true;
      });

    if (formatError) {
      throw new Error(
        'Format error: `key` param must be a single letter and is required.',
      );
    }

    if ('h' in keymap) {
      throw new Error(
        'Reserved key error: `key` param cannot be `h` - this value is reserved.',
      );
    }

    if (errors.length > 0) {
      throw new Error(
        'Duplicate key error: `key` param must be unique. Duplicates: ' +
          [...new Set(errors)].join(','),
      );
    }
  }

  /**
   * Generate a string out of the choices keys
   * @param  {Array}  choices
   * @param  {Number|String} default - the choice index or name to capitalize
   * @return {String} The rendered choices key string
   */
  generateChoicesString(choices, defaultChoice) {
    let defIndex = choices.realLength - 1;
    // @ts-expect-error 2024-06-29
    if (typeof defaultChoice === 'number' && this.opt.choices.getChoice(defaultChoice)) {
      defIndex = defaultChoice;
    } else if (typeof defaultChoice === 'string') {
      const index = choices.findChoiceIndex(({ value }) => value === defaultChoice);
      defIndex = index === -1 ? defIndex : index;
    }

    // @ts-expect-error 2024-06-29
    const defStr = this.opt.choices.pluck('key');
    // @ts-expect-error 2024-06-29
    this.rawDefault = defStr[defIndex];
    defStr[defIndex] = String(defStr[defIndex]).toUpperCase();
    return defStr.join('');
  }
}

/**
 * Function for rendering checkbox choices
 * @param  {String} pointer Selected key
 * @return {String}         Rendered content
 */

function renderChoices(choices, pointer) {
  let output = '';

  choices.forEach((choice) => {
    output += '\n  ';

    if (choice.type === 'separator') {
      output += ' ' + choice;
      return;
    }

    let choiceStr = choice.key + ') ' + choice.name;
    if (pointer === choice.key) {
      choiceStr = colors.cyan(choiceStr);
    }

    output += choiceStr;
  });

  return output;
}
