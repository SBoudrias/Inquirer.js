import { render } from '@inquirer/testing';
import input from './src/index.mjs';

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
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name John"`);
  });

  it('handle transformer', async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'What is your name',
      transformer: (value, { isFinal }) => (isFinal ? 'Transformed' : `t+${value}`),
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name t+"`);

    events.type('John');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name t+John"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name Transformed"`);
  });

  it('handle synchronous validation', async () => {
    const { answer, events, getScreen } = await render(input, {
      message: 'Answer 2 ===',
      validate: (answer) => answer === '2',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 ==="`);

    events.type('1');
    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 1"`);

    events.keypress('enter');
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
      validate(answer) {
        return new Promise((resolve) => {
          if (answer === '2') {
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
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name Mike"`);
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
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name John"`);
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
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your name"`);
  });
});
