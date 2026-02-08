import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';
import number from './src/index.ts';

describe('number prompt', () => {
  it('handle simple use case', async () => {
    const answer = number({
      message: 'What is your age',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age"`);

    screen.type('4');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age 4"`);

    screen.type('2');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual(42);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your age 42"`);
  });

  it('handle non numeric input', async () => {
    const answer = number({
      message: 'What is your age',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age"`);

    screen.type('Twenty');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age Twenty"`);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? What is your age Twenty
      > You must provide a valid numeric value"
    `);

    screen.keypress('backspace');
    screen.keypress('backspace');
    screen.keypress('backspace');
    screen.keypress('backspace');
    screen.keypress('backspace');
    screen.keypress('backspace');
    screen.type('2');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age 2"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(2);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your age 2"`);
  });

  it('supports min/max options', async () => {
    const answer = number({
      message: 'What is your age',
      min: 16,
      max: 120,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age"`);

    screen.type('14');
    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? What is your age 14
      > Value must be between 16 and 120"
    `);

    screen.keypress('backspace');
    screen.keypress('backspace');
    screen.type('140');
    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? What is your age 140
      > Value must be between 16 and 120"
    `);

    screen.keypress('backspace');
    screen.keypress('backspace');
    screen.keypress('backspace');
    screen.type('30');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual(30);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your age 30"`);
  });

  it('supports step option', async () => {
    const answer = number({
      message: 'Enter an increment of 5',
      step: 5,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Enter an increment of 5"`);

    screen.type('13');
    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Enter an increment of 5 13
      > Value must be a multiple of 5"
    `);

    screen.keypress('backspace');
    screen.keypress('backspace');
    screen.type('15');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual(15);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Enter an increment of 5 15"`);
  });

  it('supports step option from min', async () => {
    const answer = number({
      message: 'Enter an increment of 5',
      step: 5,
      min: 3,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Enter an increment of 5"`);

    screen.type('12');
    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Enter an increment of 5 12
      > Value must be a multiple of 5 starting from 3"
    `);

    screen.keypress('backspace');
    screen.keypress('backspace');
    screen.type('13');

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(13);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Enter an increment of 5 13"`);
  });

  it('drops invalid default', async () => {
    const answer = number({
      message: 'What is your age',
      min: 16,
      max: 120,
      default: 12,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age"`);

    screen.type('22');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual(22);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your age 22"`);
  });

  it('handle synchronous validation', async () => {
    const answer = number({
      message: 'Answer 2 ===',
      validate: (value?: number) => value === 2,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Answer 2 ==="`);

    screen.type('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 1"`);

    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Answer 2 === 1
      > You must provide a valid numeric value"
    `);

    screen.keypress('backspace');
    screen.type('2');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Answer 2 === 2"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(2);
  });

  it('handle asynchronous validation', async () => {
    const answer = number({
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
    await expect(answer).resolves.toEqual(2);
  });

  it('handle default option', async () => {
    const answer = number({
      message: 'What is your age',
      default: 35,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age (35)"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(35);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your age 35"`);
  });

  it('handle overwriting the default option', async () => {
    const answer = number({
      message: 'What is your age',
      default: 35,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age (35)"`);

    screen.type('37');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual(37);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your age 37"`);
  });

  it('handle removing the default option', async () => {
    const answer = number({
      message: 'What is your age',
      default: 35,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age (35)"`);

    screen.keypress('backspace');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual(undefined);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your age"`);
  });

  it('handle removing the default option with required prompt', async () => {
    const answer = number({
      message: 'What is your age',
      default: 35,
      required: true,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age (35)"`);

    screen.keypress('backspace');
    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? What is your age
      > You must provide a valid numeric value"
    `);

    screen.type('1');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual(1);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your age 1"`);
  });

  it('handle editing the default option', async () => {
    const answer = number({
      message: 'What is your age',
      default: 35,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age (35)"`);

    screen.keypress('tab');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age 35"`);

    screen.type('1');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual(351);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your age 351"`);
  });

  it('handle editing the answer (properly tracks cursor position)', async () => {
    const answer = number({
      message: 'What is your age',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age"`);

    screen.type('123');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age 123"`);

    screen.keypress('backspace');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age 12"`);

    screen.keypress('left');
    screen.keypress('left');
    screen.type('3');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? What is your age 312"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(312);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ What is your age 312"`);
  });

  it('is theme-able', async () => {
    const answer = number({
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

    expect(screen.getScreen()).toMatchInlineSnapshot(`"Q: Answer must be: 2 ==="`);

    screen.type('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"Q: Answer must be: 2 === 1"`);

    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "Q: Answer must be: 2 === 1
      !! You must provide a valid numeric value !!"
    `);

    screen.keypress('backspace');
    screen.type('2');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual(2);

    expect(screen.getScreen()).toMatchInlineSnapshot(`"Q: Answer must be: 2 === _2_"`);
  });

  it('handle decimal steps', async () => {
    const answer = number({
      message: 'Enter a decimal number',
      min: 1,
      max: 100,
      step: 0.01,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Enter a decimal number"`);

    screen.type('10.01');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual(10.01);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Enter a decimal number 10.01"`);
  });
});
