/**
 * `rawlist` type prompt
 */

import colors from 'yoctocolors-cjs';
import { map, takeUntil } from 'rxjs';
import Separator from '../objects/separator.mjs';
import observe from '../utils/events.mjs';
import Paginator from '../utils/paginator.mjs';
import incrementListIndex from '../utils/incrementListIndex.mjs';
import Base from './base.mjs';

export default class RawListPrompt extends Base {
  hiddenLine = '';
  lastKey = '';
  selected = 0;
  rawDefault = 0;

  constructor(questions, rl, answers) {
    super(questions, rl, answers);

    // @ts-expect-error 2024-06-29
    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    // @ts-expect-error 2024-06-29
    this.opt.validChoices = this.opt.choices.filter(
      (choice) => !Separator.isSeparator(choice),
    );

    Object.assign(this.opt, {
      validate(val) {
        return val != null;
      },
    });

    // @ts-expect-error 2024-06-29
    const def = this.opt.default;
    // @ts-expect-error 2024-06-29
    if (typeof def === 'number' && def >= 0 && def < this.opt.choices.realLength) {
      this.selected = def;
      this.rawDefault = def;
    } else if (typeof def !== 'number' && def != null) {
      // @ts-expect-error 2024-06-29
      const index = this.opt.choices.findChoiceIndex(({ value }) => value === def);
      const safeIndex = Math.max(index, 0);
      this.selected = safeIndex;
      this.rawDefault = safeIndex;
    }

    // Make sure no default is set (so it won't be printed)
    // @ts-expect-error 2024-06-29
    this.opt.default = null;

    // @ts-expect-error 2024-06-29
    const shouldLoop = this.opt.loop === undefined ? true : this.opt.loop;
    // @ts-expect-error 2024-06-29
    this.paginator = new Paginator(undefined, { isInfinite: shouldLoop });
  }

  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */

  override _run(cb) {
    // @ts-expect-error 2024-06-29
    this.done = cb;

    // Once user confirm (enter key)
    // @ts-expect-error 2024-06-29
    const events = observe(this.rl);
    const submit = events.line.pipe(map(this.getCurrentValue.bind(this)));

    const validation = this.handleSubmitEvents(submit);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.normalizedUpKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onUpKey.bind(this));
    events.normalizedDownKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onDownKey.bind(this));
    events.keypress
      .pipe(takeUntil(validation.success))
      .forEach(this.onKeypress.bind(this));
    // Init the prompt
    // @ts-expect-error 2024-06-29
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   * @return {RawListPrompt} self
   */

  render(error) {
    // Render question
    let message = this.getQuestion();
    let bottomContent = '';

    // @ts-expect-error 2024-06-29
    if (this.status === 'answered') {
      // @ts-expect-error 2024-06-29
      message += colors.cyan(this.opt.choices.getChoice(this.selected).short);
    } else {
      // @ts-expect-error 2024-06-29
      const choicesStr = renderChoices(this.opt.choices, this.selected);
      message +=
        // @ts-expect-error 2024-06-29
        '\n' + this.paginator.paginate(choicesStr, this.selected, this.opt.pageSize);
      message += '\n  Answer: ';
    }
    // @ts-expect-error 2024-06-29
    message += this.rl.line;

    if (error) {
      bottomContent = '\n' + colors.red('>> ') + error;
    }

    // @ts-expect-error 2024-06-29
    this.screen.render(message, bottomContent);
  }

  /**
   * When user press `enter` key
   */

  getCurrentValue(index) {
    if (index == null) {
      index = this.rawDefault;
    } else if (index === '') {
      this.selected = this.selected === undefined ? -1 : this.selected;
      index = this.selected;
    } else {
      index -= 1;
    }

    // @ts-expect-error 2024-06-29
    const choice = this.opt.choices.getChoice(index);
    return choice ? choice.value : null;
  }

  onEnd(state) {
    // @ts-expect-error 2024-06-29
    this.status = 'answered';
    // @ts-expect-error 2024-06-29
    this.answer = state.value;

    // Re-render prompt
    // @ts-expect-error 2024-06-29
    this.render();

    // @ts-expect-error 2024-06-29
    this.screen.done();
    // @ts-expect-error 2024-06-29
    this.done(state.value);
  }

  onError() {
    this.render('Please enter a valid index');
  }

  /**
   * When user press a key
   */

  onKeypress() {
    let index;

    if (this.lastKey === 'arrow') {
      index = this.hiddenLine.length > 0 ? Number(this.hiddenLine) - 1 : 0;
    } else {
      // @ts-expect-error 2024-06-29
      index = this.rl.line.length > 0 ? Number(this.rl.line) - 1 : 0;
    }
    this.lastKey = '';

    // @ts-expect-error 2024-06-29
    this.selected = this.opt.choices.getChoice(index) ? index : undefined;
    // @ts-expect-error 2024-06-29
    this.render();
  }

  /**
   * When user press up key
   */

  onUpKey() {
    this.onArrowKey('up');
  }

  /**
   * When user press down key
   */

  onDownKey() {
    this.onArrowKey('down');
  }

  /**
   * When user press up or down key
   * @param {String} type Arrow type: up or down
   */

  onArrowKey(type) {
    // @ts-expect-error 2024-06-29
    this.selected = incrementListIndex(this.selected, type, this.opt) || 0;
    this.hiddenLine = String(this.selected + 1);
    // @ts-expect-error 2024-06-29
    this.rl.line = '';
    this.lastKey = 'arrow';
  }
}

/**
 * Function for rendering list choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */

function renderChoices(choices, pointer) {
  let output = '';
  let separatorOffset = 0;

  choices.forEach((choice, i) => {
    output += output ? '\n  ' : '  ';

    if (choice.type === 'separator') {
      separatorOffset++;
      output += ' ' + choice;
      return;
    }

    const index = i - separatorOffset;
    let display = index + 1 + ') ' + choice.name;
    if (index === pointer) {
      display = colors.cyan(display);
    }

    output += display;
  });

  return output;
}
