import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import input from './src/index.ts';

describe('input prompt', () => {
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
    const { answer, events, getScreen } = await render(input, {
      message: 'Answer 2 ===',
      validate: (value: string) => value === '2',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 ==="`);

    events.type('1');
    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 1"`);

    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
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
    const { answer, events, getScreen } = await render(input, {
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
    await Promise.resolve();
    await Promise.resolve();
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
    const { answer, events, getScreen } = await render(input, {
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
    await Promise.resolve();
    await Promise.resolve();
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
    const { answer, events, getScreen } = await render(input, {
      message: `What's your favorite food?`,
      required: true,
    });

    events.keypress('enter');
    await Promise.resolve();
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
    const { answer, events, getScreen } = await render(input, {
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
    await Promise.resolve();
    await Promise.resolve();
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
    const { answer, events, getScreen } = await render(input, {
      message: 'Enter a number',
      pattern: /^[0-9]*\.?[0-9]*$/,
    });

    events.type('123a');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
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
    const { answer, events, getScreen } = await render(input, {
      message: 'Enter a number',
      pattern: /^[0-9]*\.?[0-9]*$/,
      patternError: 'Only numbers and a decimal point are allowed',
    });

    events.type('123a');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
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
