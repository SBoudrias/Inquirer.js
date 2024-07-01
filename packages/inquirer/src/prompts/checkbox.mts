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
import Base from './base.mjs';

export default class CheckboxPrompt extends Base {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);

    // @ts-expect-error 2024-06-29
    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    // @ts-expect-error 2024-06-29
    if (Array.isArray(this.opt.default)) {
      // @ts-expect-error 2024-06-29
      for (const choice of this.opt.choices) {
        // @ts-expect-error 2024-06-29
        if (this.opt.default.includes(choice.value)) {
          choice.checked = true;
        }
      }
    }

    // @ts-expect-error 2024-06-29
    this.pointer = 0;

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

    const validation = this.handleSubmitEvents(
      events.line.pipe(map(this.getCurrentValue.bind(this))),
    );
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

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
    // @ts-expect-error 2024-06-29
    this.render();
    // @ts-expect-error 2024-06-29
    this.firstRender = false;

    return this;
  }

  /**
   * Render the prompt to screen
   * @return {CheckboxPrompt} self
   */

  render(error) {
    // Render question
    let message = this.getQuestion();
    let bottomContent = '';

    // @ts-expect-error 2024-06-29
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
    // @ts-expect-error 2024-06-29
    if (this.status === 'answered') {
      // @ts-expect-error 2024-06-29
      message += colors.cyan(this.selection.join(', '));
    } else {
      // @ts-expect-error 2024-06-29
      const choicesStr = renderChoices(this.opt.choices, this.pointer);
      // @ts-expect-error 2024-06-29
      const indexPosition = this.opt.choices.indexOf(
        // @ts-expect-error 2024-06-29
        this.opt.choices.getChoice(this.pointer),
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

    if (error) {
      bottomContent = colors.red('>> ') + error;
    }

    message += ansiEscapes.cursorHide;

    // @ts-expect-error 2024-06-29
    this.screen.render(message, bottomContent);
  }

  /**
   * When user press `enter` key
   */

  onEnd(state) {
    // @ts-expect-error 2024-06-29
    this.status = 'answered';
    // @ts-expect-error 2024-06-29
    this.dontShowHints = true;
    // Rerender prompt (and clean subline error)
    // @ts-expect-error 2024-06-29
    this.render();

    // @ts-expect-error 2024-06-29
    this.screen.done();
    // @ts-expect-error 2024-06-29
    this.done(state.value);
  }

  onError(state) {
    this.render(state.isValid);
  }

  getCurrentValue() {
    // @ts-expect-error 2024-06-29
    const choices = this.opt.choices.filter(
      (choice) => Boolean(choice.checked) && !choice.disabled,
    );

    // @ts-expect-error 2024-06-29
    this.selection = choices.map((choice) => choice.short);
    return choices.map((choice) => choice.value);
  }

  onUpKey() {
    // @ts-expect-error 2024-06-29
    this.pointer = incrementListIndex(this.pointer, 'up', this.opt);
    // @ts-expect-error 2024-06-29
    this.render();
  }

  onDownKey() {
    // @ts-expect-error 2024-06-29
    this.pointer = incrementListIndex(this.pointer, 'down', this.opt);
    // @ts-expect-error 2024-06-29
    this.render();
  }

  onNumberKey(input) {
    // @ts-expect-error 2024-06-29
    if (input <= this.opt.choices.realLength) {
      // @ts-expect-error 2024-06-29
      this.pointer = input - 1;
      // @ts-expect-error 2024-06-29
      this.toggleChoice(this.pointer);
    }

    // @ts-expect-error 2024-06-29
    this.render();
  }

  onSpaceKey() {
    // @ts-expect-error 2024-06-29
    this.toggleChoice(this.pointer);
    // @ts-expect-error 2024-06-29
    this.render();
  }

  onAllKey() {
    // @ts-expect-error 2024-06-29
    const shouldBeChecked = this.opt.choices.some(
      (choice) => choice.type !== 'separator' && !choice.checked,
    );

    // @ts-expect-error 2024-06-29
    this.opt.choices.forEach((choice) => {
      if (choice.type !== 'separator') {
        choice.checked = shouldBeChecked;
      }
    });

    // @ts-expect-error 2024-06-29
    this.render();
  }

  onInverseKey() {
    // @ts-expect-error 2024-06-29
    this.opt.choices.forEach((choice) => {
      if (choice.type !== 'separator') {
        choice.checked = !choice.checked;
      }
    });

    // @ts-expect-error 2024-06-29
    this.render();
  }

  toggleChoice(index) {
    // @ts-expect-error 2024-06-29
    const item = this.opt.choices.getChoice(index);
    if (item !== undefined) {
      // @ts-expect-error 2024-06-29
      this.opt.choices.getChoice(index).checked = !item.checked;
    }
  }
}

/**
 * Function for rendering checkbox choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */

function renderChoices(choices, pointer) {
  let output = '';
  let separatorOffset = 0;

  choices.forEach((choice, i) => {
    if (choice.type === 'separator') {
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
 * @param  {Boolean} checked - add a X or not to the checkbox
 * @return {String} Composited checkbox string
 */

function getCheckbox(checked) {
  return checked ? colors.green(figures.radioOn) : figures.radioOff;
}
