/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Inquirer public API test
 */

import fs from 'node:fs';
import os from 'node:os';
import stream from 'node:stream';
import tty from 'node:tty';
import { vi, expect, beforeEach, afterEach, describe, it, expectTypeOf } from 'vitest';
import { Observable } from 'rxjs';
import type { InquirerReadline } from '@inquirer/type';
import inquirer, { type QuestionMap } from '../src/index.mjs';
import type { Answers, Question } from '../src/types.mjs';
import { _ } from '../src/ui/prompt';

declare module '../src/index.mjs' {
  interface QuestionMap {
    stub: { answer?: string | boolean; message: string };
    stub2: { answer?: string | boolean; message: string; default: string };
    stubSelect: { choices: { value: string }[] };
    failing: { message: string };
  }
}

function throwFunc(step: string) {
  throw new Error(`askAnswered Error ${step}`);
}

class StubPrompt {
  question: QuestionMap['stub'];

  constructor(question: QuestionMap['stub']) {
    this.question = question;
  }

  run() {
    return Promise.resolve(this.question.answer ?? 'bar');
  }

  close() {}
}

class StubFailingPrompt {
  run() {
    return Promise.reject('This test prompt always reject');
  }

  close() {}
}

beforeEach(() => {
  inquirer.restoreDefaultPrompts();
  inquirer.registerPrompt('stub', StubPrompt);
  inquirer.registerPrompt('failing', StubFailingPrompt);
});

describe('inquirer.prompt(...)', () => {
  describe('interfaces', () => {
    it('takes a prompts array', async () => {
      const answers = await inquirer.prompt([
        {
          type: 'stub',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'stub',
          name: 'q2',
          message: 'message',
        },
      ]);

      expect(answers).toEqual({
        q1: 'bar',
        q2: 'bar',
      });
      expectTypeOf(answers).toEqualTypeOf<{ q1: any; q2: any }>();
    });

    it('takes a question map object', async () => {
      const answers = await inquirer.prompt({
        q1: {
          type: 'stub',
          message: 'message',
        },
        q2: {
          type: 'stub',
          answer: 'Foo',
          message: 'message',
        },
      });

      expect(answers).toEqual({
        q1: 'bar',
        q2: 'Foo',
      });
      expectTypeOf(answers).toEqualTypeOf<{ q1: any; q2: any }>();
    });

    it('takes a single prompt', async () => {
      const answers = await inquirer.prompt({
        type: 'stub',
        name: 'q1',
        message: 'message',
      });
      expect(answers).toEqual({ q1: 'bar' });
      expectTypeOf(answers).toEqualTypeOf<{ q1: any }>();
    });

    it('takes an Observable', async () => {
      const answers = await inquirer.prompt(
        new Observable<Question<{ q1: boolean; q2: boolean }>>((subscriber) => {
          subscriber.next({
            type: 'stub',
            name: 'q1',
            message: 'message',
            answer: true,
          });
          setTimeout(() => {
            subscriber.next({
              type: 'stub',
              name: 'q2',
              message: 'message',
              answer: false,
            });
            subscriber.complete();
          }, 30);
        }),
      );

      expect(answers).toEqual({ q1: true, q2: false });
      expectTypeOf(answers).toEqualTypeOf<{ q1: boolean; q2: boolean }>();
    });
  });

  it("should close and create a new readline instances each time it's called", async () => {
    const promise = inquirer.prompt([
      {
        type: 'stub',
        name: 'q1',
        message: 'message',
      },
    ]);

    const rl1 = promise.ui.rl as InquirerReadline;
    vi.spyOn(rl1, 'close');
    vi.spyOn(rl1.output, 'end');

    await promise;
    expect(rl1.close).toHaveBeenCalledTimes(1);
    expect(rl1.output.end).toHaveBeenCalledTimes(1);

    const promise2 = inquirer.prompt([
      {
        type: 'stub',
        name: 'q1',
        message: 'message',
      },
    ]);

    const rl2 = promise2.ui.rl as InquirerReadline;
    vi.spyOn(rl2, 'close');
    vi.spyOn(rl2.output, 'end');

    await promise2;
    expect(rl2.close).toHaveBeenCalledTimes(1);
    expect(rl2.output.end).toHaveBeenCalledTimes(1);

    expect(rl1).not.toEqual(rl2);
  });

  it('should close readline instance on rejected promise', async () => {
    const promise = inquirer.prompt([
      {
        type: 'failing',
        name: 'q1',
        message: 'message',
      },
    ]);

    const rl1 = promise.ui.rl as InquirerReadline;
    vi.spyOn(rl1, 'close');
    vi.spyOn(rl1.output, 'end');

    await promise.catch(() => {
      expect(rl1.close).toHaveBeenCalledTimes(1);
      expect(rl1.output.end).toHaveBeenCalledTimes(1);
    });
  });

  it('should take a prompts array with nested names', async () => {
    const answers = await inquirer.prompt([
      {
        type: 'stub',
        name: 'foo.bar.q1',
        message: 'message',
      },
      {
        type: 'stub',
        name: 'foo.q2',
        message: 'message',
      },
    ]);
    expect(answers).toEqual({
      foo: {
        bar: {
          q1: 'bar',
        },
        q2: 'bar',
      },
    });
  });

  it('should parse `message` if passed as a function', async () => {
    const stubMessage = 'foo';
    class FakePrompt {
      constructor(question: QuestionMap['stub']) {
        expect(question.message).toEqual(stubMessage);
      }

      run() {
        return Promise.resolve();
      }

      close() {}
    }
    inquirer.registerPrompt('stub', FakePrompt);

    await inquirer.prompt(
      [
        {
          type: 'stub',
          name: 'name',
          message(answers) {
            expectTypeOf(answers).toEqualTypeOf<Partial<{ name: any; name1: string }>>();
            expect(answers).toEqual({ name1: 'bar' });
            return stubMessage;
          },
        },
      ],
      { name1: 'bar' },
    );
  });

  it('should run asynchronous `message`', async () => {
    const stubMessage = 'Stub message';
    class FakePrompt {
      question: QuestionMap['stub2'];

      constructor(question: QuestionMap['stub2']) {
        this.question = question;
        expect(question.message).toEqual(stubMessage);
      }

      run() {
        return Promise.resolve(this.question.answer);
      }

      close() {}
    }
    inquirer.registerPrompt('stub2', FakePrompt);

    const answers = await inquirer.prompt([
      {
        type: 'stub',
        name: 'name1',
        answer: 'bar',
        message: 'message',
      },
      {
        type: 'stub',
        name: 'name2',
        answer: 'foo',
        message(answers) {
          // @ts-expect-error TODO fix answer types passed in getters.
          expectTypeOf(answers).toEqualTypeOf<Partial<{ name1: any; name2: any }>>();
          expect(answers).toEqual({ name1: 'bar' });
          const goOn = this.async();
          setTimeout(() => {
            goOn(null, stubMessage);
          }, 0);
        },
      },
    ]);

    expect(answers).toEqual({ name1: 'bar', name2: 'foo' });
  });

  it('should parse `default` if passed as a function', async () => {
    await inquirer.prompt([
      {
        type: 'stub',
        name: 'name1',
        message: 'message',
        answer: 'bar',
      },
      {
        type: 'stub',
        name: 'name',
        message: 'message',
        default(answers: { name1: string }) {
          expect(answers.name1).toEqual('bar');
          return 'foo';
        },
      },
    ]);
  });

  it('should run asynchronous `default`', async () => {
    let goesInDefault = false;
    const input2Default = 'foo';

    class Stub2Prompt {
      constructor(question: QuestionMap['stub2']) {
        expect(question.default).toEqual(input2Default);
      }

      run() {
        return Promise.resolve();
      }

      close() {}
    }
    inquirer.registerPrompt('stub2', Stub2Prompt);

    await inquirer.prompt([
      {
        type: 'stub',
        name: 'name1',
        message: 'message',
        answer: 'bar',
      },
      {
        type: 'stub2',
        name: 'q2',
        message: 'message',
        default(answers) {
          goesInDefault = true;
          // @ts-expect-error TODO fix answer types passed in getters.
          expectTypeOf(answers).toEqualTypeOf<Partial<{ name1: any; q2: any }>>();
          expect(answers).toEqual({ name1: 'bar' });
          const goOn = this.async();
          setTimeout(() => {
            goOn(null, input2Default);
          }, 0);
        },
      },
    ]);
    expect(goesInDefault).toEqual(true);
  });

  it('should pass previous answers to the prompt constructor', async () => {
    class Stub2Prompt {
      constructor(
        _question: Record<string, any>,
        _rl: InquirerReadline,
        answers: Answers,
      ) {
        expect(answers['name1']).toEqual('bar');
      }

      run() {
        return Promise.resolve();
      }

      close() {}
    }
    inquirer.registerPrompt('stub2', Stub2Prompt);

    await inquirer.prompt([
      {
        type: 'stub',
        name: 'name1',
        answer: 'bar',
        message: 'message',
      },
      {
        type: 'stub2',
        name: 'name',
        message: 'message',
      },
    ]);
  });

  it('should parse `choices` if passed as a function', async () => {
    const stubChoices = ['foo', 'bar'];

    class FakeSelect {
      constructor(question: QuestionMap['stubSelect']) {
        expect(question.choices).toEqual(
          stubChoices.map((choice) => ({ name: choice, value: choice })),
        );
      }

      run() {
        return Promise.resolve();
      }

      close() {}
    }
    inquirer.registerPrompt('stubSelect', FakeSelect);

    const answers = await inquirer.prompt([
      {
        type: 'stub',
        name: 'name1',
        message: 'message',
        answer: 'bar',
      },
      {
        type: 'stubSelect',
        name: 'name',
        message: 'message',
        choices(answers) {
          // @ts-expect-error TODO fix answer types passed in getters.
          expectTypeOf(answers).toEqualTypeOf<Partial<{ name1: any; name: any }>>();
          expect(answers).toEqual({ name1: 'bar' });
          return stubChoices;
        },
      },
    ]);
    expect(answers).toEqual({ name1: 'bar', name: undefined });
  });

  it('should expose the Reactive interface', async () => {
    const spy = vi.fn();

    const promise = inquirer.prompt([
      {
        type: 'stub',
        name: 'name1',
        message: 'message',
        answer: 'bar',
      },
      {
        type: 'stub',
        name: 'name',
        message: 'message',
        answer: 'doe',
      },
    ]);
    promise.ui.process.subscribe(spy);

    await promise;
    expect(spy).toHaveBeenCalledWith({ name: 'name1', answer: 'bar' });
    expect(spy).toHaveBeenCalledWith({ name: 'name', answer: 'doe' });
  });

  it('should expose the UI', async () => {
    const promise = inquirer.prompt([]);
    expect(promise.ui.answers).toBeTypeOf('object');

    await promise;
  });

  describe('hierarchical mode (`when`)', () => {
    it('should pass current answers to `when`', async () => {
      const answers = await inquirer.prompt([
        {
          type: 'stub',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'stub',
          name: 'q2',
          message: 'message',
          when(answers) {
            expect(answers).toEqual({ q1: 'bar' });
            return true;
          },
        },
      ]);

      expect(answers).toEqual({
        q1: 'bar',
        q2: 'bar',
      });
    });

    it('should run prompt if `when` returns true', async () => {
      const when = vi.fn(() => true);

      const answers = await inquirer.prompt([
        {
          type: 'stub',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'stub',
          name: 'q2',
          message: 'message',
          when,
        },
      ]);
      expect(when).toHaveBeenCalledOnce();
      expect(answers).toEqual({ q1: 'bar', q2: 'bar' });
    });

    it('should run prompt if `when` is true', async () => {
      const answers = await inquirer.prompt([
        {
          type: 'stub',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'stub',
          name: 'q2',
          message: 'message',
          when: true,
        },
      ]);

      expect(answers).toEqual({ q1: 'bar', q2: 'bar' });
    });

    it('should not run prompt if `when` returns false', async () => {
      const when = vi.fn(() => false);
      const answers = await inquirer.prompt([
        {
          type: 'stub',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'stub',
          name: 'q2',
          message: 'message',
          when,
        },
        {
          type: 'stub',
          name: 'q3',
          message: 'message',
        },
      ]);

      expect(when).toHaveBeenCalledOnce();
      expect(answers).toEqual({ q1: 'bar', q3: 'bar' });
    });

    it('should not run prompt if `when` is false', async () => {
      const answers = await inquirer.prompt([
        {
          type: 'stub',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'stub',
          name: 'q2',
          message: 'message',
          when: false,
        },
        {
          type: 'stub',
          name: 'q3',
          message: 'message',
          default: 'foo',
        },
      ]);
      expect(answers).toEqual({ q1: 'bar', q3: 'bar' });
    });

    it('should run asynchronous `when`', async () => {
      let goesInWhen = false;

      const answers = await inquirer.prompt([
        {
          type: 'stub',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'stub',
          name: 'q2',
          message: 'message',
          answer: 'answer from running',
          when(answers) {
            expect(answers).toEqual({ q1: 'bar' });
            // @ts-expect-error TODO fix answer types passed in getters.
            expectTypeOf(answers).toEqualTypeOf<Partial<{ q1: any; q2: any }>>();

            goesInWhen = true;
            const goOn = this.async();
            setTimeout(() => {
              goOn(null, true);
            }, 0);
          },
        },
      ]);
      expect(goesInWhen).toEqual(true);
      expect(answers).toEqual({ q1: 'bar', q2: 'answer from running' });
    });

    it('should get the value which set in `when` on returns false', async () => {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'q',
          message: 'message',
          when(answers) {
            expectTypeOf(answers).toEqualTypeOf<Partial<{ q: any }>>();
            answers.q = 'foo';
            return false;
          },
        },
      ]);
      expect(answers).toEqual({ q: 'foo' });
    });
  });

  describe('Prefilling answers', () => {
    it('should take a prompts array and answers and return answers', async () => {
      const answers = await inquirer.prompt(
        [
          {
            type: 'stub',
            name: 'q1',
            message: 'message',
            answer: 'stub answer',
          },
        ],
        { prefilled: true },
      );
      expect(answers).toEqual({
        q1: 'stub answer',
        prefilled: true,
      });
      expectTypeOf(answers).toEqualTypeOf<{ q1: any; prefilled: boolean }>();
    });

    it('should not run prompt if answer exists for question', async () => {
      const answers = await inquirer.prompt(
        [
          {
            type: 'input',
            name: 'prefilled',
            when: throwFunc.bind(undefined, 'when') as any,
            validate: throwFunc.bind(undefined, 'validate') as any,
            transformer: throwFunc.bind(undefined, 'transformer') as any,
            message: 'message',
            default: 'newValue',
          },
        ],
        { prefilled: 'prefilled' },
      );

      expect(answers).toEqual({ prefilled: 'prefilled' });
    });

    it('should not run prompt if nested answer exists for question', async () => {
      const answers = await inquirer.prompt(
        [
          {
            type: 'input',
            name: 'prefilled.nested',
            when: throwFunc.bind(undefined, 'when') as any,
            validate: throwFunc.bind(undefined, 'validate') as any,
            transformer: throwFunc.bind(undefined, 'transformer') as any,
            message: 'message',
            default: 'newValue',
          },
        ],
        {
          prefilled: { nested: 'prefilled' },
        },
      );
      expect(answers.prefilled.nested).toEqual('prefilled');
      // @ts-expect-error TODO fix types around nested types.
      expectTypeOf(answers).toEqualTypeOf<{ prefilled: { nested: string } }>();
    });

    it('should run prompt if answer exists for question and askAnswered is set', async () => {
      const answers = await inquirer.prompt(
        [
          {
            askAnswered: true,
            type: 'stub',
            name: 'prefilled',
            message: 'message',
            answer: 'bar',
          },
        ],
        { prefilled: 'prefilled' },
      );
      expect(answers).toEqual({ prefilled: 'bar' });
    });

    it('should run prompt if nested answer exists for question and askAnswered is set', async () => {
      const answers = await inquirer.prompt(
        [
          {
            askAnswered: true,
            type: 'stub',
            name: 'prefilled.nested',
            message: 'message',
            answer: 'newValue',
          },
        ],
        {
          prefilled: { nested: 'prefilled' },
        },
      );
      expect(answers).toEqual({ prefilled: { nested: 'newValue' } });
      // @ts-expect-error TODO fix types around nested types.
      expectTypeOf(answers).toEqualTypeOf<{ prefilled: { nested: string } }>();
    });
  });

  describe('#registerPrompt()', () => {
    it('register new prompt types', async () => {
      class FakePrompt {
        constructor(
          question: { type: 'stub'; name: string; message: string },
          _rl: InquirerReadline,
          answers: Answers,
        ) {
          expect(question).toEqual({ type: 'stub2', name: 'foo', message: 'message' });
          expect(answers).toEqual({ extra: 'bar' });
        }

        run() {
          return Promise.resolve('bar');
        }

        close() {}
      }

      inquirer.registerPrompt('stub2', FakePrompt);

      const answers = await inquirer.prompt([
        { type: 'stub', name: 'extra', message: 'message' },
        { type: 'stub2', name: 'foo', message: 'message' },
      ]);
      expect(answers).toEqual({ extra: 'bar', foo: 'bar' });
    });
  });

  describe('#restoreDefaultPrompts()', () => {
    it('restore default prompts', async () => {
      class StubPrompt {
        run = vi.fn(() => {
          return Promise.resolve('bar');
        });

        close() {}
      }

      const ConfirmPrompt = inquirer.prompt.prompts['confirm'];
      inquirer.registerPrompt('confirm', StubPrompt);
      inquirer.restoreDefaultPrompts();
      expect(ConfirmPrompt).toEqual(inquirer.prompt.prompts['confirm']);
    });
  });
});

describe('Non-TTY checks', () => {
  let original: boolean;

  beforeEach(() => {
    original = process.stdin.isTTY;
    process.stdin.isTTY = false;
  });

  afterEach(() => {
    process.stdin.isTTY = original;
  });

  it('Throw an exception when run in non-tty', async () => {
    const localPrompt = inquirer.createPromptModule({ skipTTYChecks: false });
    localPrompt.registerPrompt('stub', StubPrompt);

    const promise = localPrompt([
      {
        type: 'stub',
        name: 'q1',
        message: 'message',
      },
    ]);
    await expect(promise).rejects.toHaveProperty('isTtyError', true);
  });

  it("Don't throw an exception when run in non-tty by default ", async () => {
    const localPrompt = inquirer.createPromptModule();
    localPrompt.registerPrompt('stub', StubPrompt);

    await localPrompt([
      {
        type: 'stub',
        name: 'q1',
        message: 'message',
      },
      {
        type: 'stub',
        name: 'q2',
        message: 'message',
      },
    ]);
  });

  it("Don't throw an exception when run in non-tty and skipTTYChecks is true ", async () => {
    const localPrompt = inquirer.createPromptModule({ skipTTYChecks: true });
    localPrompt.registerPrompt('stub', StubPrompt);

    await localPrompt([
      {
        type: 'stub',
        name: 'q1',
        message: 'message',
      },
      {
        type: 'stub',
        name: 'q2',
        message: 'message',
      },
    ]);
  });

  it("Don't throw an exception when run in non-tty and custom input is provided async ", async () => {
    const localPrompt = inquirer.createPromptModule({
      input: new stream.Readable({
        // We must have a default read implementation
        // for this to work, if not it will error out
        // with the following error message during testing
        // Uncaught Error [ERR_METHOD_NOT_IMPLEMENTED]: The _read() method is not implemented
        read() {},
      }),
    });
    localPrompt.registerPrompt('stub', StubPrompt);

    await localPrompt([
      {
        type: 'stub',
        name: 'q1',
        message: 'message',
      },
      {
        type: 'stub',
        name: 'q2',
        message: 'message',
      },
    ]);
  });

  it('Throw an exception when run in non-tty and custom input is provided with skipTTYChecks: false', async () => {
    const localPrompt = inquirer.createPromptModule({
      input: new stream.Readable(),
      skipTTYChecks: false,
    });
    localPrompt.registerPrompt('stub', StubPrompt);

    const promise = localPrompt([
      {
        type: 'stub',
        name: 'q1',
        message: 'message',
      },
    ]);
    await expect(promise).rejects.toHaveProperty('isTtyError', true);
  });

  const itSkipWindows =
    os.type() === 'Windows_NT' || process.env['GITHUB_ACTIONS'] ? it.skip : it;
  itSkipWindows('No exception when using tty other than process.stdin', async () => {
    const input = new tty.ReadStream(fs.openSync('/dev/tty', 'r+'));

    // Uses manually opened tty as input instead of process.stdin
    const localPrompt = inquirer.createPromptModule({
      input,
      skipTTYChecks: false,
    });
    localPrompt.registerPrompt('stub', StubPrompt);

    const promise = localPrompt([
      {
        type: 'stub',
        name: 'q1',
        message: 'message',
      },
    ]);

    // Release the input tty socket
    input.unref();

    await expect(promise).resolves.toEqual({ q1: 'bar' });
  });
});

describe('set utility function tests', () => {
  it('Should set an objects property when provided a path and a value', () => {
    const obj: any = {};
    const path = 'a.b';
    const value = 'c';

    _.set(obj, path, value);

    expect(obj.a.b).toBe('c');
  });

  it('Should set an objects property when provided a path and an array value', () => {
    const obj: any = {};
    const path = 'a.b';
    const value = ['c', 'd'];

    _.set(obj, path, value);

    expect(obj.a.b[0]).toBe('c');
    expect(obj.a.b[1]).toBe('d');
  });

  it('Should replace a boolean with an object when a path is provided that overrides that boolean', () => {
    const obj: any = { a: true };
    const path = 'a.b';
    const value = 'c';

    _.set(obj, path, value);

    expect(obj.a.b).toBe('c');
  });

  it('Should replace a string with an object when a path is provided that overrides that string', () => {
    const obj: any = { a: 'test' };
    const path = 'a.b';
    const value = 'c';

    _.set(obj, path, value);

    expect(obj.a.b).toBe('c');
  });
});
