/**
 * `list` type prompt
 */

import ansiEscapes from 'ansi-escapes';
import colors from 'yoctocolors-cjs';
import figures from '@inquirer/figures';
import runAsync from 'run-async';
import { flatMap, map, take, takeUntil } from 'rxjs';
import observe from '../utils/events.mjs';
import Paginator from '../utils/paginator.mjs';
import incrementListIndex from '../utils/incrementListIndex.mjs';
import Separator from '../objects/separator.mjs';
import Base, { type Answers, type BaseQuestion } from './base.mjs';
import type { InquirerReadline } from '@inquirer/type';
import Choices from '../objects/choices.mjs';

export default class ListPrompt extends Base<BaseQuestion> {
  paginator: Paginator;
  firstRender: boolean = true;
  selected: number = 0;

  constructor(questions: BaseQuestion, rl: InquirerReadline, answers?: Answers) {
    super(questions, rl, answers);

    if (this.opt.choices.realLength === 0) {
      this.throwParamError('choices');
    }

    const def = this.opt.default;

    // If def is a Number, then use as index. Otherwise, check for value.
    if (typeof def === 'number' && def >= 0 && def < this.opt.choices.realLength) {
      this.selected = def;
    } else if (typeof def !== 'number' && def != null) {
      const index = this.opt.choices.findChoiceIndex(({ value }) => value === def);
      this.selected = Math.max(index, 0);
    }

    // Make sure no default is set (so it won't be printed)
    this.opt.default = undefined;

    // @ts-expect-error 2024-06-29
    const shouldLoop = this.opt.loop === undefined ? true : this.opt.loop;
    this.paginator = new Paginator(this.screen, { isInfinite: shouldLoop });
  }

  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */

  override _run(cb: (value?: unknown) => void) {
    this.done = cb;

    const events = observe(this.rl);
    events.normalizedUpKey.pipe(takeUntil(events.line)).forEach(this.onUpKey.bind(this));
    events.normalizedDownKey
      .pipe(takeUntil(events.line))
      .forEach(this.onDownKey.bind(this));
    events.numberKey.pipe(takeUntil(events.line)).forEach(this.onNumberKey.bind(this));
    events.line
      .pipe(
        take(1),
        map(this.getCurrentValue.bind(this)),
        flatMap((value) =>
          runAsync(this.opt.filter)(value, this.answers).catch((error) => error),
        ),
      )
      .forEach(this.onSubmit.bind(this));

    // Init the prompt
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   * @return {ListPrompt} self
   */

  render() {
    // Render question
    let message = this.getQuestion();

    if (this.firstRender) {
      message += colors.dim('(Use arrow keys)');
    }

    // Render choices or answer depending on the state
    if (this.status === 'answered') {
      // @ts-expect-error 2024-06-29
      message += colors.cyan(this.opt.choices.getChoice(this.selected).short);
    } else {
      const choicesStr = listRender(this.opt.choices, this.selected);
      const indexPosition = this.opt.choices.indexOf(
        // @ts-expect-error 2024-06-29
        this.opt.choices.getChoice(this.selected),
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
        // @ts-expect-error 2024-06-29
        '\n' + this.paginator.paginate(choicesStr, realIndexPosition, this.opt.pageSize);
    }

    message += ansiEscapes.cursorHide;
    this.firstRender = false;

    this.screen.render(message);
  }

  /**
   * When user press `enter` key
   */

  onSubmit(value) {
    this.status = 'answered';

    // Rerender prompt
    this.render();

    this.screen.done();
    this.done(value);
  }

  getCurrentValue() {
    // @ts-expect-error 2024-06-29
    return this.opt.choices.getChoice(this.selected).value;
  }

  /**
   * When user press a key
   */
  onUpKey() {
    this.selected = incrementListIndex(this.selected, 'up', this.opt);
    this.render();
  }

  onDownKey() {
    this.selected = incrementListIndex(this.selected, 'down', this.opt);
    this.render();
  }

  onNumberKey(input) {
    if (input <= this.opt.choices.realLength) {
      this.selected = input - 1;
    }

    this.render();
  }
}

/**
 * Function for rendering list choices
 */
function listRender(choices: Choices, pointer: number): string {
  let output = '';
  let separatorOffset = 0;

  choices.forEach((choice, i) => {
    if (Separator.isSeparator(choice)) {
      separatorOffset++;
      output += '  ' + choice + '\n';
      return;
    }

    if (choice.disabled) {
      separatorOffset++;
      output += '  - ' + choice.name;
      output += ` (${
        typeof choice.disabled === 'string' ? choice.disabled : 'Disabled'
      })`;
      output += '\n';
      return;
    }

    const isSelected = i - separatorOffset === pointer;
    let line = (isSelected ? figures.pointer + ' ' : '  ') + choice.name;
    if (isSelected) {
      line = colors.cyan(line);
    }

    output += line + ' \n';
  });

  return output.replaceAll(/\n$/g, '');
}
