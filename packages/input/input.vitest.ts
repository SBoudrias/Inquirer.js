import { PassThrough } from 'node:stream';
import { setImmediate } from 'node:timers/promises';
import { stripVTControlCharacters } from 'node:util';
import { describe, it, expect } from 'vitest';
import { ExitPromptError } from '@inquirer/core';
import { render } from '@inquirer/testing';
import { withResolver } from '@inquirer/type';
import input from './src/index.ts';

describe('input prompt', () => {
  it.each(['g', 'y', 'gy'])('preserves a supplied %s pattern cursor', async (flags) => {
    const pattern = new RegExp('^[0-9]+$', flags);
    pattern.lastIndex = 2;
    const { answer, events, getScreen, nextRender } = await render(input, {
      message: 'Number',
      pattern,
    });

    events.type('123');
    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toContain('✔ Number 123');
    await expect(answer).resolves.toBe('123');
    expect(pattern.lastIndex).toBe(2);
  });

  it.each(['g', 'y', 'gy'])(
    'rechecks %s patterns after a validation failure',
    async (flags) => {
      const pattern = new RegExp('^[0-9]+$', flags);
      let validations = 0;
      const { answer, events, nextRender, getScreen } = await render(input, {
        message: 'Number',
        pattern,
        validate: () => ++validations > 1 || 'Try again',
      });

      events.type('123');
      events.keypress('enter');
      await nextRender();
      expect(getScreen()).toContain('Try again');

      // Resubmitting the same value passes both checks.
      events.keypress('enter');
      await expect(answer).resolves.toBe('123');
      expect(validations).toBe(2);
      // The failed attempt's error line is cleared on success.
      expect(getScreen()).toBe('✔ Number 123');
    },
  );

  it('handle simple use case', async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    events.type('J');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name J"`);

    events.type('ohn');
    events.keypress('enter');

    await expect(answer).resolves.toEqual('John');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your name John"`);
  });

  it(
    'rejects when Ctrl+D closes an empty terminal prompt',
    { timeout: 1000 },
    async () => {
      const stdin = Object.assign(new PassThrough(), { isTTY: true });
      const stdout = new PassThrough();
      const answer = input(
        { message: 'What is your name' },
        { input: stdin, output: stdout },
      );

      await setImmediate(); // Wait for the deferred first render on a TTY.
      stdin.write('\u0004');

      await expect(answer).rejects.toThrow(ExitPromptError);
      await expect(answer).rejects.toThrow('User force closed the prompt with EOF');
    },
  );

  it('rejects on Ctrl+D while a TTY answer is still validating', async () => {
    const stdin = Object.assign(new PassThrough(), { isTTY: true });
    const stdout = new PassThrough();
    const answer = input(
      {
        message: 'What is your name',
        validate: () => new Promise<boolean>(() => {}),
      },
      { input: stdin, output: stdout },
    );

    await setImmediate(); // Wait for the deferred first render on a TTY.
    stdin.write('John');
    stdin.write('\r');
    stdin.write('\u0004'); // EOF on the now-empty line, while validation is pending.

    await expect(answer).rejects.toThrow(ExitPromptError);
  });

  it('accepts a piped answer when its validation completes after EOF', async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const answer = input(
      {
        message: 'What is your name',
        validate: async () => {
          await setImmediate();
          return true;
        },
      },
      { input: stdin, output: stdout },
    );

    stdin.end('John\n');

    await expect(answer).resolves.toBe('John');
  });

  it.each([
    { message: 'ABCDEF', columns: 9, expected: '? ABCDEF\n' },
    { message: '界界界', columns: 9, expected: '? 界界界\n' },
    { message: '界界界', columns: 5, expected: '? 界\n界界\n' },
    { message: '界界界界界界', columns: 7, expected: '? 界界\n界界界\n界' },
  ])(
    'wraps "$message" in $columns terminal columns',
    async ({ message, columns, expected }) => {
      const stdin = new PassThrough();
      const stdout = Object.assign(new PassThrough(), { columns });
      let screen = '';
      stdout.setEncoding('utf8').on('data', (chunk: string) => {
        screen += chunk;
      });

      const answer = input({ message }, { input: stdin, output: stdout });
      const initial = stripVTControlCharacters(screen);

      stdin.write('\r');
      await expect(answer).resolves.toEqual('');
      expect(initial).toBe(expected);
    },
  );

  // The cursor must return to the input row after each re-render. These cases
  // pin the row arithmetic through the raw escape sequences the prompt writes:
  // a wide character grows the prompt line across a terminal-edge wrap, and
  // every re-render moves the cursor back up by the rows below the input row.
  // The counts are whole-session totals (each typed character re-renders and
  // emits its own cursorUp), so they also pin the arithmetic's stability
  // across re-renders — on the old length-based row count they come out one
  // short (or wrong) for wide characters.
  it.each([
    {
      message: '界界界',
      columns: 5,
      typed: '界',
      validate: undefined as ((v: string) => string | boolean) | undefined,
      cursorUps: 2,
    },
    {
      message: '界界界',
      columns: 5,
      typed: '界',
      validate: (v: string) => v.length > 1 || 'err below',
      cursorUps: 2,
    },
    {
      message: 'ABCDE',
      columns: 7,
      typed: 'F a界b',
      validate: undefined as ((v: string) => string | boolean) | undefined,
      cursorUps: 5,
    },
  ])(
    'places the cursor back on the input row for "$message" in $columns columns',
    async ({ message, columns, typed, validate, cursorUps }) => {
      const controller = new AbortController();
      const stdin = new PassThrough();
      const stdout = Object.assign(new PassThrough(), { columns });
      let raw = '';
      stdout.setEncoding('utf8').on('data', (chunk: string) => {
        raw += chunk;
      });

      const answer = input(validate ? { message, validate } : { message }, {
        input: stdin,
        output: stdout,
        signal: controller.signal,
      });

      await setImmediate(); // Wait for the deferred first render on a TTY.
      stdin.write(typed);
      await setImmediate();

      // Every re-render emits exactly `cursorUps` total row-moves; a wrong
      // row count moves the cursor one row too few (or too many) somewhere.
      // The regex matches the raw CSI escape sequences on purpose.
      /* eslint-disable-next-line no-control-regex */
      /* oxlint-disable-next-line eslint/no-control-regex */
      const ups = raw.match(/\u001B\[\d+A/g) ?? [];
      expect(ups).toHaveLength(cursorUps);

      controller.abort();
      await answer.catch(() => {});
    },
  );

  it('handle transformer', async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
      transformer: (value: string, { isFinal }: { isFinal: boolean }) =>
        isFinal ? 'Transformed' : `t+${value}`,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name t+"`);

    events.type('John');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name t+John"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your name Transformed"`);
  });

  it('handle synchronous validation', async () => {
    const { answer, events, getScreen, nextRender } = await render(input, {
      message: 'Answer 2 ===',
      validate: (value: string) => value === '2',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 ==="`);

    events.type('1');
    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 1"`);

    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Answer 2 === 1
      > You must provide a valid value"
    `);

    events.keypress('backspace');
    events.type('2');
    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 2"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('2');
  });

  it('can clear value when validation fail', async () => {
    const { answer, events, getScreen, nextRender } = await render(input, {
      message: 'Answer 2 ===',
      validate: (value: string) => value === '2',
      theme: {
        validationFailureMode: 'clear',
      },
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 ==="`);

    events.type('1');
    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 1"`);

    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Answer 2 ===
      > You must provide a valid value"
    `);

    events.type('2');
    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 2"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('2');
  });

  it('handle asynchronous validation', async () => {
    const { answer, events, getScreen, nextRender } = await render(input, {
      message: 'Answer 2 ===',
      validate: (value: string) => {
        return new Promise<string | boolean>((resolve) => {
          if (value === '2') {
            resolve(true);
          } else {
            resolve('Answer must be 2');
          }
        });
      },
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 ==="`);

    events.type('1');
    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 1"`);

    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Answer 2 === 1
      > Answer must be 2"
    `);

    events.keypress('backspace');
    events.type('2');
    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 2"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('2');
  });

  it('ignores keys typed while asynchronous validation is pending', async () => {
    const { promise: validation, resolve: resolveValidation } = withResolver<string>();
    const { answer, events, getScreen, nextRender } = await render(input, {
      message: 'Answer 2 ===',
      validate: (value: string) => value === '2' || validation,
    });

    events.type('1');
    events.keypress('enter');
    await nextRender();

    events.type('x');
    resolveValidation('Answer must be 2');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Answer 2 === 1
      > Answer must be 2"
    `);

    events.keypress('backspace');
    events.type('2');
    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 2"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('2');
  });

  it('ignores keys typed while asynchronous validation is pending when clearing the value', async () => {
    const { promise: validation, resolve: resolveValidation } = withResolver<string>();
    const { answer, events, getScreen, nextRender } = await render(input, {
      message: 'Answer 2 ===',
      validate: (value: string) => value === '2' || validation,
      theme: {
        validationFailureMode: 'clear',
      },
    });

    events.type('1');
    events.keypress('enter');
    await nextRender();

    events.type('x');
    resolveValidation('Answer must be 2');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Answer 2 ===
      > Answer must be 2"
    `);

    events.type('2');
    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 2"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('2');
  });

  it('handle default option', async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
      default: 'Mike',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name (Mike)"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('Mike');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mike"`);
  });

  it('accepts explicit undefined as default', async () => {
    const defaultValue: string | undefined = undefined;
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
      default: defaultValue,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    events.type('Mike');
    events.keypress('enter');
    await expect(answer).resolves.toEqual('Mike');
  });

  it('handle numeric default option', async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What port do you want to use?',
      // @ts-expect-error - testing runtime behavior with numeric default
      default: 3042,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What port do you want to use? (3042)"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('3042');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What port do you want to use? 3042"`);
  });

  it('handle overwriting the default option', async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
      default: 'Mike',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name (Mike)"`);

    events.type('John');
    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your name John"`);
  });

  it('handle removing the default option', async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
      default: 'Mike',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name (Mike)"`);

    events.keypress('backspace');
    events.keypress('enter');
    await expect(answer).resolves.toEqual('');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your name"`);
  });

  it('handle editing the default option when prefill is omitted (backwards compatible)', async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
      default: 'Mike',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name (Mike)"`);

    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name Mike"`);

    events.type('y');
    events.keypress('enter');
    await expect(answer).resolves.toEqual('Mikey');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mikey"`);
  });

  it("handle editing the default option when prefill is set to 'tab'", async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
      default: 'Mike',
      prefill: 'tab',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name (Mike)"`);

    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name Mike"`);

    events.type('y');
    events.keypress('enter');
    await expect(answer).resolves.toEqual('Mikey');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mikey"`);
  });

  it("handle default option as initial value when prefill is set to 'editable'", async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
      default: 'Mike',
      prefill: 'editable',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name Mike"`);

    events.keypress('tab'); // Does nothing when prefill = 'editable'
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name Mike"`);

    events.type('y');
    events.keypress('enter');
    await expect(answer).resolves.toEqual('Mikey');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mikey"`);
  });

  it("show normal behaviour when prefill is 'editable' and no default value is provided", async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
      prefill: 'editable',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    events.keypress('tab'); // Does nothing when prefill = 'editable' or no default value
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    events.type('Mikey');
    events.keypress('enter');
    await expect(answer).resolves.toEqual('Mikey');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mikey"`);
  });

  it("show normal behaviour when prefill is 'tab' and no default value is provided", async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
      prefill: 'tab',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    events.keypress('tab'); // Does nothing when prefill = 'editable' or no default value
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    events.type('Mikey');
    events.keypress('enter');
    await expect(answer).resolves.toEqual('Mikey');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mikey"`);
  });

  it('shows validation message if user did not provide any value', async () => {
    const { answer, events, getScreen, nextRender } = await render(input, {
      message: `What's your favorite food?`,
      required: true,
    });

    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? What's your favorite food?
      > You must provide a value"
    `);

    events.type('Quinoa');
    events.keypress('enter');
    await expect(answer).resolves.toEqual('Quinoa');
  });

  it('handle editing the answer (properly tracks cursor position)', async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    events.type('Mkey');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name Mkey"`);

    events.keypress('backspace');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name Mke"`);

    events.keypress('left');
    events.keypress('left');
    events.type('i');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name Mike"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('Mike');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mike"`);
  });

  it('is theme-able', async () => {
    const { answer, events, getScreen, nextRender } = await render(input, {
      message: 'Answer must be: 2',
      validate: (value?: string) => value === '2',
      theme: {
        prefix: 'Q:',
        style: {
          message: (text: string) => `${text} ===`,
          error: (text: string) => `!! ${text} !!`,
          answer: (text: string) => `_${text}_`,
        },
      },
    });

    expect(getScreen()).toMatchInlineSnapshot(`"Q: Answer must be: 2 ==="`);

    events.type('1');
    expect(getScreen()).toMatchInlineSnapshot(`"Q: Answer must be: 2 === 1"`);

    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "Q: Answer must be: 2 === 1
      !! You must provide a valid value !!"
    `);

    events.keypress('backspace');
    events.type('2');
    events.keypress('enter');
    await expect(answer).resolves.toEqual('2');

    expect(getScreen()).toMatchInlineSnapshot(`"Q: Answer must be: 2 === _2_"`);
  });

  it('supports pattern validation', async () => {
    const { answer, events, getScreen, nextRender } = await render(input, {
      message: 'Enter a number',
      pattern: /^[0-9]*\.?[0-9]*$/,
    });

    events.type('123a');
    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter a number 123a
      > Invalid input"
    `);

    events.keypress('backspace');
    events.keypress('enter');
    await expect(answer).resolves.toEqual('123');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Enter a number 123"`);
  });

  it('supports pattern validation with custom error message', async () => {
    const { answer, events, getScreen, nextRender } = await render(input, {
      message: 'Enter a number',
      pattern: /^[0-9]*\.?[0-9]*$/,
      patternError: 'Only numbers and a decimal point are allowed',
    });

    events.type('123a');
    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
    "? Enter a number 123a
    > Only numbers and a decimal point are allowed"
  `);

    events.keypress('backspace');
    events.keypress('enter');
    await expect(answer).resolves.toEqual('123');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Enter a number 123"`);
  });
});
