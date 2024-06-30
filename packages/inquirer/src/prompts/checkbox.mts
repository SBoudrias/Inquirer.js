/**
 * `list` type prompt
 */

import ansiEscapes from 'ansi-escapes';
import colors from 'yoctocolors-cjs';
import figures from '@inquirer/figures';
import { map, takeUntil } from 'rxjs';
import observe from '../utils/events.mjs';
import Paginator from '../utils/paginator.mjs';
import incrementListIndex from '../utils/incrementListIndex.mjs';
import Base, { type BaseQuestion, type Answers } from './base.mjs';
import Separator from '../objects/separator.mjs';
import Choice from '../objects/choice.mjs';
import Choices from '../objects/choices.mjs';
import type { InquirerReadline } from '@inquirer/type';

type Question = BaseQuestion & { loop?: boolean; pageSize?: number; default?: unknown[] };

export default class CheckboxPrompt extends Base<Question> {
  paginator: Paginator;
  pointer = 0;
  firstRender: boolean = false;
  dontShowHints: boolean = false;
  selection: string[] = [];

  constructor(questions: Question, rl: InquirerReadline, answers?: Answers) {
    super(questions, rl, answers);

    if (this.opt.choices.realLength === 0) {
      this.throwParamError('choices');
    }

    if (Array.isArray(this.opt.default)) {
      for (const choice of this.opt.choices) {
        if (
          choice &&
          !Separator.isSeparator(choice) &&
          this.opt.default.includes(choice.value)
        ) {
          // @ts-expect-error 2024-06-29
          choice.checked = true;
        }
      }
    }

    // Make sure no default is set (so it won't be printed)
    this.opt.default = undefined;

    const shouldLoop = this.opt.loop === undefined ? true : this.opt.loop;
    this.paginator = new Paginator(this.screen, { isInfinite: shouldLoop });
  }

  /**
   * Start the Inquiry session
   */
  override _run(cb: (value?: unknown) => void) {
    this.done = cb;

    const events = observe(this.rl);

    const validation = this.handleSubmitEvents<unknown[]>(
      events.line.pipe(map(() => this.getCurrentValue())),
    );
    validation.success.forEach((state) => this.onEnd(state));
    validation.error.forEach((state) => this.onError(state));

    events.normalizedUpKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onUpKey.bind(this));
    events.normalizedDownKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onDownKey.bind(this));
    events.numberKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onNumberKey.bind(this));
    events.spaceKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onSpaceKey.bind(this));
    events.aKey.pipe(takeUntil(validation.success)).forEach(this.onAllKey.bind(this));
    events.iKey.pipe(takeUntil(validation.success)).forEach(this.onInverseKey.bind(this));

    // Init the prompt
    this.render();
    this.firstRender = false;

    return this;
  }

  /**
   * Render the prompt to screen
   */
  render(error?: string) {
    // Render question
    let message = this.getQuestion();
    let bottomContent = '';

    if (!this.dontShowHints) {
      message +=
        '(Press ' +
        colors.cyan(colors.bold('<space>')) +
        ' to select, ' +
        colors.cyan(colors.bold('<a>')) +
        ' to toggle all, ' +
        colors.cyan(colors.bold('<i>')) +
        ' to invert selection, and ' +
        colors.cyan(colors.bold('<enter>')) +
        ' to proceed)';
    }

    // Render choices or answer depending on the state
    if (this.status === 'answered') {
      message += colors.cyan(this.selection.join(', '));
    } else {
      const choicesStr = renderChoices(this.opt.choices, this.pointer);
      const indexPosition = this.opt.choices.indexOf(
        // @ts-expect-error 2024-06-29
        this.opt.choices.getChoice(this.pointer),
      );
      const realIndexPosition =
        // @ts-expect-error 2024-06-29
        this.opt.choices.reduce((acc: number, value, i): number => {
          // Don't count lines past the choice we are looking at
          if (i > indexPosition) {
            return acc;
          }
          // Add line if it's a separator
          if (Separator.isSeparator(value)) {
            return acc + 1;
          }

          // Non-strings take up one line
          if (typeof value.name !== 'string') {
            return acc + 1;
          }

          // Calculate lines taken up by string
          return acc + value.name.split('\n').length;
        }, 0) - 1;
      message +=
        '\n' + this.paginator.paginate(choicesStr, realIndexPosition, this.opt.pageSize);
    }

    if (error) {
      bottomContent = colors.red('>> ') + error;
    }

    message += ansiEscapes.cursorHide;

    this.screen.render(message, bottomContent);
  }

  /**
   * When user press `enter` key
   */

  onEnd(state) {
    this.status = 'answered';
    this.dontShowHints = true;
    // Rerender prompt (and clean subline error)
    this.render();

    this.screen.done();
    this.done(state.value);
  }

  onError(state) {
    this.render(state.isValid);
  }

  getCurrentValue() {
    const choices = this.opt.choices.filter(
      // @ts-expect-error 2024-06-29
      (choice) => Boolean(choice.checked) && !choice.disabled,
    ) as Choice[];

    this.selection = choices.map((choice) => choice.short);
    return choices.map((choice) => choice.value);
  }

  onUpKey() {
    this.pointer = incrementListIndex(this.pointer, 'up', this.opt);
    this.render();
  }

  onDownKey() {
    this.pointer = incrementListIndex(this.pointer, 'down', this.opt);
    this.render();
  }

  onNumberKey(input) {
    if (input <= this.opt.choices.realLength) {
      this.pointer = input - 1;
      this.toggleChoice(this.pointer);
    }

    this.render();
  }

  onSpaceKey() {
    this.toggleChoice(this.pointer);
    this.render();
  }

  onAllKey() {
    const shouldBeChecked = this.opt.choices.some(
      // @ts-expect-error 2024-06-29
      (choice) => !Separator.isSeparator(choice) && !choice.checked,
    );

    this.opt.choices.forEach((choice) => {
      if (choice.type !== 'separator') {
        // @ts-expect-error 2024-06-29
        choice.checked = shouldBeChecked;
      }
    });

    this.render();
  }

  onInverseKey() {
    this.opt.choices.forEach((choice) => {
      if (choice.type !== 'separator') {
        // @ts-expect-error 2024-06-29
        choice.checked = !choice.checked;
      }
    });

    this.render();
  }

  toggleChoice(index) {
    const item = this.opt.choices.getChoice(index);
    if (item !== undefined) {
      // @ts-expect-error 2024-06-29
      this.opt.choices.getChoice(index).checked = !item.checked;
    }
  }
}

/**
 * Function for rendering checkbox choices
 */
function renderChoices(choices: Choices, pointer: number) {
  let output = '';
  let separatorOffset = 0;

  choices.forEach((choice, i) => {
    if (Separator.isSeparator(choice)) {
      separatorOffset++;
      output += ' ' + choice + '\n';
      return;
    }

    if (choice.disabled) {
      separatorOffset++;
      output += ' - ' + choice.name;
      output += ` (${
        typeof choice.disabled === 'string' ? choice.disabled : 'Disabled'
      })`;
    } else {
      // @ts-expect-error 2024-06-29
      const line = getCheckbox(choice.checked) + ' ' + choice.name;
      output +=
        i - separatorOffset === pointer
          ? colors.cyan(figures.pointer + line)
          : ' ' + line;
    }

    output += '\n';
  });

  return output.replaceAll(/\n$/g, '');
}

/**
 * Get the checkbox
 */
function getCheckbox(checked: boolean): string {
  return checked ? colors.green(figures.radioOn) : figures.radioOff;
}
