/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Inquirer public API test
 */

import fs from 'node:fs';
import os from 'node:os';
import stream from 'node:stream';
import tty from 'node:tty';
import { vi, expect, beforeEach, afterEach, describe, it } from 'vitest';
import { Observable } from 'rxjs';
import type { InquirerReadline } from '@inquirer/type';
import inquirer from '../src/index.mts';
import type { Answers, Question } from '../src/types.mts';

function throwFunc(step: string) {
  throw new Error(`askAnswered Error ${step}`);
}

class StubPrompt {
  question: any;

  constructor(question: any) {
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
});

describe('inquirer.prompt', () => {
  it("should close and create a new readline instances each time it's called", async () => {
    const promise = inquirer.prompt({
      type: 'stub',
      name: 'q1',
      message: 'message',
    });

    const rl1 = promise.ui.rl as InquirerReadline;
    vi.spyOn(rl1, 'close');
    vi.spyOn(rl1.output, 'end');

    await promise;
    expect(rl1.close).toHaveBeenCalledTimes(1);
    expect(rl1.output.end).toHaveBeenCalledTimes(1);

    const promise2 = inquirer.prompt({
      type: 'stub',
      name: 'q1',
      message: 'message',
    });

    const rl2 = promise2.ui.rl as InquirerReadline;
    vi.spyOn(rl2, 'close');
    vi.spyOn(rl2.output, 'end');

    await promise2;
    expect(rl2.close).toHaveBeenCalledTimes(1);
    expect(rl2.output.end).toHaveBeenCalledTimes(1);

    expect(rl1).not.toEqual(rl2);
  });

  it('should close readline instance on rejected promise', async () => {
    inquirer.registerPrompt('stub', StubFailingPrompt);

    const promise = inquirer.prompt({
      type: 'stub',
      name: 'q1',
    });

    const rl1 = promise.ui.rl as InquirerReadline;
    vi.spyOn(rl1, 'close');
    vi.spyOn(rl1.output, 'end');

    await promise.catch(() => {
      expect(rl1.close).toHaveBeenCalledTimes(1);
      expect(rl1.output.end).toHaveBeenCalledTimes(1);
    });
  });

  it('should take a prompts array and return answers', async () => {
    const answers = await inquirer.prompt([
      {
        type: 'stub',
        name: 'q1',
      },
      {
        type: 'stub',
        name: 'q2',
      },
    ]);

    expect(answers).toEqual({
      q1: 'bar',
      q2: 'bar',
    });
  });

  it('should take a prompts nested object and return answers', async () => {
    const answers = await inquirer.prompt({
      q1: {
        type: 'stub',
        message: 'message',
      },
      q2: {
        type: 'stub',
        message: 'message',
        default: 'Foo',
      },
    });

    expect(answers).toEqual({
      q1: 'bar',
      q2: 'bar',
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

  it('should take a single prompt and return answer', async () => {
    const config = {
      type: 'stub',
      name: 'q1',
    };

    const answers = await inquirer.prompt(config);
    expect(answers).toEqual({ q1: 'bar' });
  });

  it('should parse `message` if passed as a function', async () => {
    const stubMessage = 'foo';
    class FakePrompt {
      constructor(question) {
        expect(question.message).toEqual(stubMessage);
      }

      run() {
        return Promise.resolve();
      }

      close() {}
    }
    inquirer.registerPrompt('stub', FakePrompt);

    const prompts = [
      {
        type: 'stub',
        name: 'name',
        message(answers) {
          expect(answers.name1).toEqual('bar');
          return stubMessage;
        },
      },
    ];

    await inquirer.prompt(prompts, { name1: 'bar' });
  });

  it('should run asynchronous `message`', async () => {
    const stubMessage = 'Stub message';
    class FakePrompt {
      question: any;

      constructor(question) {
        this.question = question;
        expect(question.message).toEqual(stubMessage);
      }

      run() {
        return Promise.resolve(this.question.answer);
      }

      close() {}
    }
    inquirer.registerPrompt('stub2', FakePrompt);

    const prompts = [
      {
        type: 'stub',
        name: 'name1',
        message: 'message',
        answer: 'bar',
      },
      {
        type: 'stub',
        name: 'name2',
        answer: 'foo',
        message(answers) {
          expect(answers.name1).toEqual('bar');
          const goOn = this.async();
          setTimeout(() => {
            goOn(null, stubMessage);
          }, 0);
        },
      },
    ];

    const answers = await inquirer.prompt(prompts);
    expect(answers['name1']).toEqual('bar');
    expect(answers['name2']).toEqual('foo');
  });

  it('should parse `default` if passed as a function', async () => {
    const prompts = [
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
        default(answers) {
          expect(answers.name1).toEqual('bar');
          return 'foo';
        },
      },
    ];

    await inquirer.prompt(prompts);
  });

  it('should run asynchronous `default`', async () => {
    let goesInDefault = false;
    const input2Default = 'foo';

    class Stub2Prompt {
      constructor(question) {
        expect(question.default).toEqual(input2Default);
      }

      run() {
        return Promise.resolve();
      }

      close() {}
    }
    inquirer.registerPrompt('stub2', Stub2Prompt);

    const prompts = [
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
          expect(answers.name1).toEqual('bar');
          const goOn = this.async();
          setTimeout(() => {
            goOn(null, input2Default);
          }, 0);
        },
      },
    ];

    await inquirer.prompt(prompts);
    expect(goesInDefault).toEqual(true);
  });

  it('should pass previous answers to the prompt constructor', async () => {
    class Stub2Prompt {
      constructor(question, rl, answers) {
        expect(answers['name1']).toEqual('bar');
      }

      run() {
        return Promise.resolve();
      }

      close() {}
    }
    inquirer.registerPrompt('stub2', Stub2Prompt);

    const prompts = [
      {
        type: 'stub',
        name: 'name1',
        message: 'message',
        answer: 'bar',
      },
      {
        type: 'stub2',
        name: 'name',
        message: 'message',
      },
    ];

    await inquirer.prompt(prompts);
  });

  it('should parse `choices` if passed as a function', async () => {
    const stubChoices = ['foo', 'bar'];

    class FakeSelect {
      constructor(question) {
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

    const prompts = [
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
          expect(answers.name1).toEqual('bar');
          return stubChoices;
        },
      },
    ];

    await inquirer.prompt(prompts);
  });

  it('should expose the Reactive interface', async () => {
    const spy = vi.fn();
    const prompts = [
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
    ];

    const promise = inquirer.prompt(prompts);
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

  it('takes an Observable as question', async () => {
    const prompts = new Observable<Question<Answers>>((subscriber) => {
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
    });

    const answers = await inquirer.prompt<Answers>(prompts);
    expect(answers['q1']).toEqual(true);
    expect(answers['q2']).toEqual(false);
  });

  it('should take a prompts array and answers and return answers', async () => {
    const answers = await inquirer.prompt(
      [
        {
          type: 'stub',
          name: 'q1',
          message: 'message',
          answer: true,
        },
      ],
      { prefilled: true },
    );
    expect(answers['prefilled']).toEqual(true);
    expect(answers['q1']).toEqual(true);
  });

  describe('hierarchical mode (`when`)', () => {
    it('should pass current answers to `when`', async () => {
      await inquirer.prompt([
        {
          type: 'stub',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'stub',
          name: 'q2',
          message: 'message',
          when(answers: Answers) {
            expect(answers).toBeTypeOf('object');
            expect(answers.q1).toEqual('bar');
            return true;
          },
        },
      ]);
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
      expect(answers['q2']).toEqual('bar');
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

      expect(answers['q2']).toEqual('bar');
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
      expect(answers['q2']).toEqual(undefined);
      expect(answers['q3']).toEqual('bar');
      expect(answers['q1']).toEqual('bar');
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
      expect(answers['q2']).toEqual(undefined);
      expect(answers['q3']).toEqual('bar');
      expect(answers['q1']).toEqual('bar');
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
          when() {
            goesInWhen = true;
            const goOn = this.async();
            setTimeout(() => {
              goOn(null, true);
            }, 0);
          },
        },
      ]);
      expect(goesInWhen).toEqual(true);
      expect(answers['q2']).toEqual('bar');
    });

    it('should get the value which set in `when` on returns false', async () => {
      const answers = await inquirer.prompt([
        {
          type: 'stub',
          name: 'q',
          message: 'message',
          when(answers: Answers) {
            answers.q = 'foo';
            return false;
          },
        },
      ]);
      expect(answers['q']).toEqual('foo');
    });

    it('should not run prompt if answer exists for question', async () => {
      const answers = await inquirer.prompt(
        [
          {
            type: 'input',
            name: 'prefilled',
            when: throwFunc.bind(undefined, 'when'),
            validate: throwFunc.bind(undefined, 'validate'),
            transformer: throwFunc.bind(undefined, 'transformer'),
            message: 'message',
            default: 'newValue',
          },
        ],
        { prefilled: 'prefilled' },
      );
      expect(answers['prefilled']).toEqual('prefilled');
    });

    it('should not run prompt if nested answer exists for question', async () => {
      const answers = await inquirer.prompt(
        [
          {
            type: 'input',
            name: 'prefilled.nested',
            when: throwFunc.bind(undefined, 'when'),
            validate: throwFunc.bind(undefined, 'validate'),
            transformer: throwFunc.bind(undefined, 'transformer'),
            filter: throwFunc.bind(undefined, 'filter'),
            message: 'message',
            default: 'newValue',
          },
        ],
        {
          prefilled: { nested: 'prefilled' },
        },
      );
      expect(answers['prefilled'].nested).toEqual('prefilled');
    });

    it('should run prompt if answer exists for question and askAnswered is set', async () => {
      const answers = await inquirer.prompt(
        [
          {
            askAnswered: true,
            type: 'stub',
            name: 'prefilled',
            message: 'message',
          },
        ],
        { prefilled: 'prefilled' },
      );
      expect(answers['prefilled']).toEqual('bar');
    });

    it('should run prompt if nested answer exists for question and askAnswered is set', async () => {
      const answers = await inquirer.prompt(
        [
          {
            askAnswered: true,
            type: 'stub',
            name: 'prefilled.nested',
            message: 'message',
            default: 'newValue',
          },
        ],
        {
          prefilled: { nested: 'prefilled' },
        },
      );
      expect(answers['prefilled'].nested).toEqual('bar');
    });
  });

  describe('#registerPrompt()', () => {
    it('register new prompt types', async () => {
      const questions = [{ type: 'foo', name: 'foo', message: 'something' }];
      class FakePrompt {
        constructor(question, rl, answers) {
          expect(question).toEqual(questions[0]);
          expect(answers).toEqual({});
        }

        run() {
          return Promise.resolve('bar');
        }

        close() {}
      }

      inquirer.registerPrompt('foo', FakePrompt);

      await expect(inquirer.prompt(questions)).resolves.toEqual({ foo: 'bar' });
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

  describe('Non-TTY checks', () => {
    let original;

    beforeEach(() => {
      original = process.stdin.isTTY;
      // @ts-expect-error monkey patching
      delete process.stdin.isTTY;
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
});
