import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import input from './src/index.js';

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

  it('handle editing the default option', async () => {
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
});
