import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import number from './src/index.ts';

describe('number prompt', () => {
  it('handle simple use case', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'What is your age',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age"`);

    events.type('4');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age 4"`);

    events.type('2');
    events.keypress('enter');

    await expect(answer).resolves.toEqual(42);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your age 42"`);
  });

  it('handle non numeric input', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'What is your age',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age"`);

    events.type('Twenty');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age Twenty"`);

    events.keypress('enter');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? What is your age Twenty
      > You must provide a valid numeric value"
    `);

    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.type('2');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age 2"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(2);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your age 2"`);
  });

  it('supports min/max options', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'What is your age',
      min: 16,
      max: 120,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age"`);

    events.type('14');
    events.keypress('enter');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? What is your age 14
      > Value must be between 16 and 120"
    `);

    events.keypress('backspace');
    events.keypress('backspace');
    events.type('140');
    events.keypress('enter');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? What is your age 140
      > Value must be between 16 and 120"
    `);

    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.type('30');
    events.keypress('enter');
    await expect(answer).resolves.toEqual(30);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your age 30"`);
  });

  it('supports step option', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'Enter an increment of 5',
      step: 5,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? Enter an increment of 5"`);

    events.type('13');
    events.keypress('enter');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter an increment of 5 13
      > Value must be a multiple of 5"
    `);

    events.keypress('backspace');
    events.keypress('backspace');
    events.type('15');
    events.keypress('enter');
    await expect(answer).resolves.toEqual(15);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Enter an increment of 5 15"`);
  });

  it('supports step option from min', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'Enter an increment of 5',
      step: 5,
      min: 3,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? Enter an increment of 5"`);

    events.type('12');
    events.keypress('enter');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter an increment of 5 12
      > Value must be a multiple of 5 starting from 3"
    `);

    events.keypress('backspace');
    events.keypress('backspace');
    events.type('13');

    events.keypress('enter');
    await expect(answer).resolves.toEqual(13);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Enter an increment of 5 13"`);
  });

  it('drops invalid default', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'What is your age',
      min: 16,
      max: 120,
      default: 12,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age"`);

    events.type('22');
    events.keypress('enter');
    await expect(answer).resolves.toEqual(22);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your age 22"`);
  });

  it('handle synchronous validation', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'Answer 2 ===',
      validate: (value?: number) => value === 2,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 ==="`);

    events.type('1');
    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 1"`);

    events.keypress('enter');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Answer 2 === 1
      > You must provide a valid numeric value"
    `);

    events.keypress('backspace');
    events.type('2');
    expect(getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 2"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(2);
  });

  it('handle asynchronous validation', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'Answer 2 ===',
      validate: (value?: number) => {
        return new Promise<string | boolean>((resolve) => {
          if (value === 2) {
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
    await expect(answer).resolves.toEqual(2);
  });

  it('handle default option', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'What is your age',
      default: 35,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age (35)"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(35);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your age 35"`);
  });

  it('handle overwriting the default option', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'What is your age',
      default: 35,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age (35)"`);

    events.type('37');
    events.keypress('enter');
    await expect(answer).resolves.toEqual(37);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your age 37"`);
  });

  it('handle removing the default option', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'What is your age',
      default: 35,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age (35)"`);

    events.keypress('backspace');
    events.keypress('enter');
    await expect(answer).resolves.toEqual(undefined);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your age"`);
  });

  it('handle removing the default option with required prompt', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'What is your age',
      default: 35,
      required: true,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age (35)"`);

    events.keypress('backspace');
    events.keypress('enter');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? What is your age
      > You must provide a valid numeric value"
    `);

    events.type('1');
    events.keypress('enter');
    await expect(answer).resolves.toEqual(1);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your age 1"`);
  });

  it('handle editing the default option', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'What is your age',
      default: 35,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age (35)"`);

    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age 35"`);

    events.type('1');
    events.keypress('enter');
    await expect(answer).resolves.toEqual(351);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your age 351"`);
  });

  it('handle editing the answer (properly tracks cursor position)', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'What is your age',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age"`);

    events.type('123');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age 123"`);

    events.keypress('backspace');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age 12"`);

    events.keypress('left');
    events.keypress('left');
    events.type('3');
    expect(getScreen()).toMatchInlineSnapshot(`"? What is your age 312"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(312);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ What is your age 312"`);
  });

  it('is theme-able', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'Answer must be: 2',
      validate: (value?: number) => value === 2,
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
      !! You must provide a valid numeric value !!"
    `);

    events.keypress('backspace');
    events.type('2');
    events.keypress('enter');
    await expect(answer).resolves.toEqual(2);

    expect(getScreen()).toMatchInlineSnapshot(`"Q: Answer must be: 2 === _2_"`);
  });

  it('handle decimal steps', async () => {
    const { answer, events, getScreen } = await render(number, {
      message: 'Enter a decimal number',
      min: 1,
      max: 100,
      step: 0.01,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? Enter a decimal number"`);

    events.type('10.01');
    events.keypress('enter');
    await expect(answer).resolves.toEqual(10.01);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Enter a decimal number 10.01"`);
  });
});
