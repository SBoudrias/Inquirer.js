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
import Base from './base.mjs';

export default class ListPrompt extends Base {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);

    // @ts-expect-error 2024-06-29
    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    // @ts-expect-error 2024-06-29
    this.firstRender = true;
    // @ts-expect-error 2024-06-29
    this.selected = 0;

    // @ts-expect-error 2024-06-29
    const def = this.opt.default;

    // If def is a Number, then use as index. Otherwise, check for value.
    // @ts-expect-error 2024-06-29
    if (typeof def === 'number' && def >= 0 && def < this.opt.choices.realLength) {
      // @ts-expect-error 2024-06-29
      this.selected = def;
    } else if (typeof def !== 'number' && def != null) {
      // @ts-expect-error 2024-06-29
      const index = this.opt.choices.findChoiceIndex(({ value }) => value === def);
      // @ts-expect-error 2024-06-29
      this.selected = Math.max(index, 0);
    }

    // Make sure no default is set (so it won't be printed)
    // @ts-expect-error 2024-06-29
    this.opt.default = null;

    // @ts-expect-error 2024-06-29
    const shouldLoop = this.opt.loop === undefined ? true : this.opt.loop;
    // @ts-expect-error 2024-06-29
    this.paginator = new Paginator(this.screen, { isInfinite: shouldLoop });
  }

  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */

  override _run(cb) {
    // @ts-expect-error 2024-06-29
    this.done = cb;

    // @ts-expect-error 2024-06-29
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
          // @ts-expect-error 2024-06-29
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

    // @ts-expect-error 2024-06-29
    if (this.firstRender) {
      message += colors.dim('(Use arrow keys)');
    }

    // Render choices or answer depending on the state
    // @ts-expect-error 2024-06-29
    if (this.status === 'answered') {
      // @ts-expect-error 2024-06-29
      message += colors.cyan(this.opt.choices.getChoice(this.selected).short);
    } else {
      // @ts-expect-error 2024-06-29
      const choicesStr = listRender(this.opt.choices, this.selected);
      // @ts-expect-error 2024-06-29
      const indexPosition = this.opt.choices.indexOf(
        // @ts-expect-error 2024-06-29
        this.opt.choices.getChoice(this.selected),
      );
      const realIndexPosition =
        // @ts-expect-error 2024-06-29
        this.opt.choices.reduce((acc, value, i) => {
          // Dont count lines past the choice we are looking at
          if (i > indexPosition) {
            return acc;
          }
          // Add line if it's a separator
          if (value.type === 'separator') {
            return acc + 1;
          }

          let l = value.name;
          // Non-strings take up one line
          if (typeof l !== 'string') {
            return acc + 1;
          }

          // Calculate lines taken up by string
          l = l.split('\n');
          return acc + l.length;
        }, 0) - 1;
      message +=
        // @ts-expect-error 2024-06-29
        '\n' + this.paginator.paginate(choicesStr, realIndexPosition, this.opt.pageSize);
    }

    message += ansiEscapes.cursorHide;
    // @ts-expect-error 2024-06-29
    this.firstRender = false;

    // @ts-expect-error 2024-06-29
    this.screen.render(message);
  }

  /**
   * When user press `enter` key
   */

  onSubmit(value) {
    // @ts-expect-error 2024-06-29
    this.status = 'answered';

    // Rerender prompt
    this.render();

    // @ts-expect-error 2024-06-29
    this.screen.done();
    // @ts-expect-error 2024-06-29
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
    // @ts-expect-error 2024-06-29
    this.selected = incrementListIndex(this.selected, 'up', this.opt);
    this.render();
  }

  onDownKey() {
    // @ts-expect-error 2024-06-29
    this.selected = incrementListIndex(this.selected, 'down', this.opt);
    this.render();
  }

  onNumberKey(input) {
    // @ts-expect-error 2024-06-29
    if (input <= this.opt.choices.realLength) {
      // @ts-expect-error 2024-06-29
      this.selected = input - 1;
    }

    this.render();
  }
}

/**
 * Function for rendering list choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */
function listRender(choices, pointer) {
  let output = '';
  let separatorOffset = 0;

  choices.forEach((choice, i) => {
    if (choice.type === 'separator') {
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
