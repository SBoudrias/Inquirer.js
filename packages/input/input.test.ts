import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';
import input from './src/index.ts';

describe('input prompt', () => {
  it('handle simple use case', async () => {
    const answer = input({
      message: 'What is your name',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    screen.type('J');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name J"`);

    screen.type('ohn');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual('John');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your name John"`);
  });

  it('handle transformer', async () => {
    const answer = input({
      message: 'What is your name',
      transformer: (value: string, { isFinal }: { isFinal: boolean }) =>
        isFinal ? 'Transformed' : `t+${value}`,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name t+"`);

    screen.type('John');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name t+John"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual('John');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your name Transformed"`);
  });

  it('handle synchronous validation', async () => {
    const answer = input({
      message: 'Answer 2 ===',
      validate: (value: string) => value === '2',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Answer 2 ==="`);

    screen.type('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 1"`);

    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Answer 2 === 1
      > You must provide a valid value"
    `);

    screen.keypress('backspace');
    screen.type('2');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 2"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual('2');
  });

  it('can clear value when validation fail', async () => {
    const answer = input({
      message: 'Answer 2 ===',
      validate: (value: string) => value === '2',
      theme: {
        validationFailureMode: 'clear',
      },
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Answer 2 ==="`);

    screen.type('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 1"`);

    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Answer 2 ===
      > You must provide a valid value"
    `);

    screen.type('2');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 2"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual('2');
  });

  it('handle asynchronous validation', async () => {
    const answer = input({
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

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Answer 2 ==="`);

    screen.type('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 1"`);

    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Answer 2 === 1
      > Answer must be 2"
    `);

    screen.keypress('backspace');
    screen.type('2');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 2"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual('2');
  });

  it('handle default option', async () => {
    const answer = input({
      message: 'What is your name',
      default: 'Mike',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name (Mike)"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual('Mike');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mike"`);
  });

  it('handle numeric default option', async () => {
    const answer = input({
      message: 'What port do you want to use?',
      // @ts-expect-error - testing runtime behavior with numeric default
      default: 3042,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What port do you want to use? (3042)"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual('3042');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What port do you want to use? 3042"`);
  });

  it('handle overwriting the default option', async () => {
    const answer = input({
      message: 'What is your name',
      default: 'Mike',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name (Mike)"`);

    screen.type('John');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual('John');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your name John"`);
  });

  it('handle removing the default option', async () => {
    const answer = input({
      message: 'What is your name',
      default: 'Mike',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name (Mike)"`);

    screen.keypress('backspace');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual('');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your name"`);
  });

  it('handle editing the default option when prefill is omitted (backwards compatible)', async () => {
    const answer = input({
      message: 'What is your name',
      default: 'Mike',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name (Mike)"`);

    screen.keypress('tab');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name Mike"`);

    screen.type('y');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual('Mikey');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mikey"`);
  });

  it("handle editing the default option when prefill is set to 'tab'", async () => {
    const answer = input({
      message: 'What is your name',
      default: 'Mike',
      prefill: 'tab',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name (Mike)"`);

    screen.keypress('tab');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name Mike"`);

    screen.type('y');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual('Mikey');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mikey"`);
  });

  it("handle default option as initial value when prefill is set to 'editable'", async () => {
    const answer = input({
      message: 'What is your name',
      default: 'Mike',
      prefill: 'editable',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name Mike"`);

    screen.keypress('tab'); // Does nothing when prefill = 'editable'
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name Mike"`);

    screen.type('y');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual('Mikey');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mikey"`);
  });

  it("show normal behaviour when prefill is 'editable' and no default value is provided", async () => {
    const answer = input({
      message: 'What is your name',
      prefill: 'editable',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    screen.keypress('tab'); // Does nothing when prefill = 'editable' or no default value
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    screen.type('Mikey');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual('Mikey');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mikey"`);
  });

  it("show normal behaviour when prefill is 'tab' and no default value is provided", async () => {
    const answer = input({
      message: 'What is your name',
      prefill: 'tab',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    screen.keypress('tab'); // Does nothing when prefill = 'editable' or no default value
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    screen.type('Mikey');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual('Mikey');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mikey"`);
  });

  it('shows validation message if user did not provide any value', async () => {
    const answer = input({
      message: `What's your favorite food?`,
      required: true,
    });

    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? What's your favorite food?
      > You must provide a value"
    `);

    screen.type('Quinoa');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual('Quinoa');
  });

  it('handle editing the answer (properly tracks cursor position)', async () => {
    const answer = input({
      message: 'What is your name',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name"`);

    screen.type('Mkey');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name Mkey"`);

    screen.keypress('backspace');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name Mke"`);

    screen.keypress('left');
    screen.keypress('left');
    screen.type('i');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your name Mike"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual('Mike');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your name Mike"`);
  });

  it('is theme-able', async () => {
    const answer = input({
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

    expect(screen.getScreen()).toMatchInlineSnapshot(`"Q: Answer must be: 2 ==="`);

    screen.type('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"Q: Answer must be: 2 === 1"`);

    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "Q: Answer must be: 2 === 1
      !! You must provide a valid value !!"
    `);

    screen.keypress('backspace');
    screen.type('2');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual('2');

    expect(screen.getScreen()).toMatchInlineSnapshot(`"Q: Answer must be: 2 === _2_"`);
  });

  it('supports pattern validation', async () => {
    const answer = input({
      message: 'Enter a number',
      pattern: /^[0-9]*\.?[0-9]*$/,
    });

    screen.type('123a');
    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Enter a number 123a
      > Invalid input"
    `);

    screen.keypress('backspace');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual('123');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Enter a number 123"`);
  });

  it('supports pattern validation with custom error message', async () => {
    const answer = input({
      message: 'Enter a number',
      pattern: /^[0-9]*\.?[0-9]*$/,
      patternError: 'Only numbers and a decimal point are allowed',
    });

    screen.type('123a');
    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
    "? Enter a number 123a
    > Only numbers and a decimal point are allowed"
  `);

    screen.keypress('backspace');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual('123');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Enter a number 123"`);
  });
});
