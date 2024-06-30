/**
 * `rawlist` type prompt
 */

import colors from 'yoctocolors-cjs';
import { map, takeUntil } from 'rxjs';
import Separator from '../objects/separator.mjs';
import observe from '../utils/events.mjs';
import Paginator from '../utils/paginator.mjs';
import Base, { type Answers, type BaseQuestion } from './base.mjs';
import type { InquirerReadline } from '@inquirer/type';
import Choices from '../objects/choices.mjs';
import Choice from '../objects/choice.mjs';

export default class ExpandPrompt extends Base<BaseQuestion> {
  paginator: Paginator;
  answer?: string;
  selectedKey: string = '';

  constructor(questions: BaseQuestion, rl: InquirerReadline, answers?: Answers) {
    super(questions, rl, answers);

    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    this.validateChoices(this.opt.choices);

    // Add the default `help` (/expand) option
    this.opt.choices.push({
      key: 'h',
      name: 'Help, list all options',
      value: 'help',
    });

    this.opt.validate = (choice) => {
      if (choice == null) {
        return 'Please enter a valid command';
      }

      return choice !== 'help';
    };

    // Setup the default string (capitalize the default key)
    // @ts-expect-error 2024-06-29
    this.opt.default = this.generateChoicesString(this.opt.choices, this.opt.default);

    this.paginator = new Paginator(this.screen);
  }

  /**
   * Start the Inquiry session
   */
  override _run(cb: (value?: unknown) => void) {
    this.done = cb;

    // Save user answer and update prompt to show selected option.
    const events = observe(this.rl);
    const validation = this.handleSubmitEvents(
      events.line.pipe(map((line) => this.getCurrentValue(line))),
    );
    validation.success.forEach((state) => this.onSubmit(state));
    validation.error.forEach((state) => this.onError(state));
    // @ts-expect-error 2024-06-29
    this.keypressObs = events.keypress
      .pipe(takeUntil(validation.success))
      .forEach(this.onKeypress.bind(this));

    // Init the prompt
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   */
  render(error?: string, hint?: string) {
    let message = this.getQuestion();
    let bottomContent = '';

    if (this.status === 'answered') {
      // @ts-expect-error 2024-06-29
      message += colors.cyan(this.answer);
    } else if (this.status === 'expanded') {
      const choicesStr = renderChoices(this.opt.choices, this.selectedKey);
      // @ts-expect-error 2024-06-29
      message += this.paginator.paginate(choicesStr, this.selectedKey, this.opt.pageSize);
      message += '\n  Answer: ';
    }

    message += this.rl.line;

    if (error) {
      bottomContent = colors.red('>> ') + error;
    }

    if (hint) {
      bottomContent = colors.cyan('>> ') + hint;
    }

    this.screen.render(message, bottomContent);
  }

  getCurrentValue(input?: string) {
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

    this.opt.choices.forEach((choice) => {
      output += '\n  ';

      if (Separator.isSeparator(choice)) {
        output += ' ' + choice;
        return;
      }

      // @ts-expect-error 2024-06-29
      let choiceStr = choice.key + ') ' + choice.name;
      // @ts-expect-error 2024-06-29
      if (this.selectedKey === choice.key) {
        choiceStr = colors.cyan(choiceStr);
      }

      output += choiceStr;
    });

    return output;
  }

  onError(state: { value: string; isValid: string }) {
    if (state.value === 'help') {
      this.selectedKey = '';
      this.status = 'expanded';
      this.render();
      return;
    }

    this.render(state.isValid);
  }

  /**
   * When user press `enter` key
   */

  onSubmit(state) {
    this.status = 'answered';
    const choice = this.opt.choices.where({ value: state.value })[0] as Choice;
    this.answer = choice.short || choice.name;

    // Re-render prompt
    this.render();
    this.screen.done();
    this.done(state.value);
  }

  /**
   * When user press a key
   */
  onKeypress() {
    this.selectedKey = this.rl.line.toLowerCase();
    const selected = this.opt.choices.where({ key: this.selectedKey })[0];
    if (this.status === 'expanded') {
      this.render();
    } else {
      this.render(undefined, selected ? selected.name : undefined);
    }
  }

  /**
   * Validate the choices
   */

  validateChoices(choices: Choices) {
    let formatError;
    const errors: string[] = [];
    const keymap: Record<string, boolean> = {};

    choices
      .filter((item) => !Separator.isSeparator(item))
      .forEach((choice) => {
        // @ts-expect-error 2024-06-29
        if (!choice.key || choice.key.length !== 1) {
          formatError = true;
        }

        // @ts-expect-error 2024-06-29
        choice.key = String(choice.key).toLowerCase();

        // @ts-expect-error 2024-06-29
        if (keymap[choice.key]) {
          // @ts-expect-error 2024-06-29
          errors.push(choice.key);
        }

        // @ts-expect-error 2024-06-29
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
   */
  generateChoicesString(choices: Choices, defaultChoice: number | string): string {
    let defIndex = choices.realLength - 1;
    if (typeof defaultChoice === 'number' && this.opt.choices.getChoice(defaultChoice)) {
      defIndex = defaultChoice;
    } else if (typeof defaultChoice === 'string') {
      const index = choices.findChoiceIndex(({ value }) => value === defaultChoice);
      defIndex = index === -1 ? defIndex : index;
    }

    const defStr = this.opt.choices.pluck('key');
    // @ts-expect-error 2024-06-29
    this.rawDefault = defStr[defIndex];
    defStr[defIndex] = String(defStr[defIndex]).toUpperCase();
    return defStr.join('');
  }
}

/**
 * Function for rendering checkbox choices
 */
function renderChoices(choices: Choices, pointer: string): string {
  let output = '';

  choices.forEach((choice) => {
    output += '\n  ';

    if (Separator.isSeparator(choice)) {
      output += ' ' + choice;
      return;
    }

    // @ts-expect-error 2024-06-29
    let choiceStr = choice.key + ') ' + choice.name;
    // @ts-expect-error 2024-06-29
    if (pointer === choice.key) {
      choiceStr = colors.cyan(choiceStr);
    }

    output += choiceStr;
  });

  return output;
}
