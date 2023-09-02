/**
 * Inquirer public API test
 */

import fs from 'node:fs';
import os from 'node:os';
import stream from 'node:stream';
import tty from 'node:tty';
import { vi, expect, beforeEach, afterEach, describe, it } from 'vitest';
import { Observable } from 'rxjs';

import inquirer from '../../lib/inquirer.js';
import { autosubmit } from '../helpers/events.js';

const ostype = os.type();

describe('inquirer.prompt', () => {
  let prompt;

  beforeEach(() => {
    prompt = inquirer.createPromptModule();
  });

  it("should close and create a new readline instances each time it's called", async () => {
    const promise = prompt({
      type: 'confirm',
      name: 'q1',
      message: 'message',
    });

    const rl1 = promise.ui.rl;
    vi.spyOn(rl1, 'close');
    vi.spyOn(rl1.output, 'end');
    rl1.emit('line');

    return promise.then(() => {
      expect(rl1.close).toHaveBeenCalledTimes(1);
      expect(rl1.output.end).toHaveBeenCalledTimes(1);

      const promise2 = prompt({
        type: 'confirm',
        name: 'q1',
        message: 'message',
      });

      const rl2 = promise2.ui.rl;
      vi.spyOn(rl2, 'close');
      vi.spyOn(rl2.output, 'end');
      rl2.emit('line');

      return promise2.then(() => {
        expect(rl2.close).toHaveBeenCalledTimes(1);
        expect(rl2.output.end).toHaveBeenCalledTimes(1);

        expect(rl1).not.toEqual(rl2);
      });
    });
  });

  it('should close readline instance on rejected promise', async () =>
    new Promise((done) => {
      prompt.registerPrompt('stub', () => {});

      const promise = prompt({
        type: 'stub',
        name: 'q1',
      });

      const rl1 = promise.ui.rl;
      vi.spyOn(rl1, 'close');
      vi.spyOn(rl1.output, 'end');

      promise.catch(() => {
        expect(rl1.close).toHaveBeenCalledTimes(1);
        expect(rl1.output.end).toHaveBeenCalledTimes(1);
        done();
      });
    }));

  it('should take a prompts array and return answers', async () => {
    const prompts = [
      {
        type: 'confirm',
        name: 'q1',
        message: 'message',
      },
      {
        type: 'confirm',
        name: 'q2',
        message: 'message',
        default: false,
      },
    ];

    const promise = prompt(prompts);
    autosubmit(promise.ui);

    return promise.then((answers) => {
      expect(answers.q1).toEqual(true);
      expect(answers.q2).toEqual(false);
    });
  });

  it('should take a prompts nested object and return answers', async () => {
    const prompts = {
      q1: {
        type: 'confirm',
        message: 'message',
      },
      q2: {
        type: 'input',
        message: 'message',
        default: 'Foo',
      },
    };

    const promise = prompt(prompts);
    autosubmit(promise.ui);
    const { q1, q2 } = await promise;
    expect(q1).toEqual(true);
    expect(q2).toEqual('Foo');
  });

  it('should take a prompts array with nested names', async () => {
    const prompts = [
      {
        type: 'confirm',
        name: 'foo.bar.q1',
        message: 'message',
      },
      {
        type: 'confirm',
        name: 'foo.q2',
        message: 'message',
        default: false,
      },
    ];

    const promise = prompt(prompts);
    autosubmit(promise.ui);

    return promise.then((answers) => {
      expect(answers).toEqual({
        foo: {
          bar: {
            q1: true,
          },
          q2: false,
        },
      });
    });
  });

  it('should take a single prompt and return answer', async () => {
    const config = {
      type: 'input',
      name: 'q1',
      message: 'message',
      default: 'bar',
    };

    const promise = prompt(config);

    promise.ui.rl.emit('line');
    const answers = await promise;
    expect(answers.q1).toEqual('bar');
  });

  it('should parse `message` if passed as a function', async () => {
    const stubMessage = 'foo';
    prompt.registerPrompt('stub', function (params) {
      this.run = vi.fn(() => Promise.resolve());
      expect(params.message).toEqual(stubMessage);
    });

    const msgFunc = function (answers) {
      expect(answers.name1).toEqual('bar');
      return stubMessage;
    };

    const prompts = [
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar',
      },
      {
        type: 'stub',
        name: 'name',
        message: msgFunc,
      },
    ];

    const promise = prompt(prompts);
    promise.ui.rl.emit('line');
    promise.ui.rl.emit('line');

    await promise;
    // Ensure we're not overwriting original prompt values.
    expect(prompts[1].message).toEqual(msgFunc);
  });

  it('should run asynchronous `messageasync `', () =>
    new Promise((done) => {
      const stubMessage = 'foo';
      prompt.registerPrompt('stub', function (params) {
        this.run = vi.fn(() => Promise.resolve());
        expect(params.message).toEqual(stubMessage);
        done();
      });

      const prompts = [
        {
          type: 'input',
          name: 'name1',
          message: 'message',
          default: 'bar',
        },
        {
          type: 'stub',
          name: 'name',
          message(answers) {
            expect(answers.name1).toEqual('bar');
            const goOn = this.async();
            setTimeout(() => {
              goOn(null, stubMessage);
            }, 0);
          },
        },
      ];

      const promise = prompt(prompts);
      promise.ui.rl.emit('line');
    }));

  it('should parse `default` if passed as a function', async () =>
    new Promise((done) => {
      const stubDefault = 'foo';
      prompt.registerPrompt('stub', function (params) {
        this.run = vi.fn(() => Promise.resolve());
        expect(params.default).toEqual(stubDefault);
        done();
      });

      const prompts = [
        {
          type: 'input',
          name: 'name1',
          message: 'message',
          default: 'bar',
        },
        {
          type: 'stub',
          name: 'name',
          message: 'message',
          default(answers) {
            expect(answers.name1).toEqual('bar');
            return stubDefault;
          },
        },
      ];

      const promise = prompt(prompts);
      promise.ui.rl.emit('line');
    }));

  it('should run asynchronous `default`', async () => {
    let goesInDefault = false;
    const input2Default = 'foo';
    const prompts = [
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar',
      },
      {
        type: 'input2',
        name: 'q2',
        message: 'message',
        default(answers) {
          goesInDefault = true;
          expect(answers.name1).toEqual('bar');
          const goOn = this.async();
          setTimeout(() => {
            goOn(null, input2Default);
          }, 0);
          setTimeout(() => {
            promise.ui.rl.emit('line');
          }, 10);
        },
      },
    ];

    const promise = prompt(prompts);
    promise.ui.rl.emit('line');

    const answers = await promise;
    expect(goesInDefault).toEqual(true);
    expect(answers.q2).toEqual(input2Default);
  });

  it('should pass previous answers to the prompt constructor', async () =>
    new Promise((done) => {
      prompt.registerPrompt('stub', function (params, rl, answers) {
        this.run = vi.fn(() => Promise.resolve());
        expect(answers.name1).toEqual('bar');
        done();
      });

      const prompts = [
        {
          type: 'input',
          name: 'name1',
          message: 'message',
          default: 'bar',
        },
        {
          type: 'stub',
          name: 'name',
          message: 'message',
        },
      ];

      const promise = prompt(prompts);
      promise.ui.rl.emit('line');
    }));

  it('should parse `choices` if passed as a function', async () =>
    new Promise((done) => {
      const stubChoices = ['foo', 'bar'];
      prompt.registerPrompt('stub', function (params) {
        this.run = vi.fn(() => Promise.resolve());
        expect(params.choices).toEqual(stubChoices);
        done();
      });

      const prompts = [
        {
          type: 'input',
          name: 'name1',
          message: 'message',
          default: 'bar',
        },
        {
          type: 'stub',
          name: 'name',
          message: 'message',
          choices(answers) {
            expect(answers.name1).toEqual('bar');
            return stubChoices;
          },
        },
      ];

      const promise = prompt(prompts);
      promise.ui.rl.emit('line');
    }));

  it('should returns a promise', async () =>
    new Promise((done) => {
      const config = {
        type: 'input',
        name: 'q1',
        message: 'message',
        default: 'bar',
      };

      const promise = prompt(config);
      promise.then((answers) => {
        expect(answers.q1).toEqual('bar');
        done();
      });

      promise.ui.rl.emit('line');
    }));

  it('should expose the Reactive interface', async () =>
    new Promise((done) => {
      const prompts = [
        {
          type: 'input',
          name: 'name1',
          message: 'message',
          default: 'bar',
        },
        {
          type: 'input',
          name: 'name',
          message: 'message',
          default: 'doe',
        },
      ];

      const promise = prompt(prompts);
      const spy = vi.fn();
      promise.ui.process.subscribe(
        spy,
        () => {},
        () => {
          expect(spy).toHaveBeenCalledWith({ name: 'name1', answer: 'bar' });
          expect(spy).toHaveBeenCalledWith({ name: 'name', answer: 'doe' });
          done();
        },
      );

      autosubmit(promise.ui);
    }));

  it('should expose the UI', async () =>
    new Promise((done) => {
      const promise = prompt([]);
      expect(promise.ui.answers).toBeTypeOf('object');
      done();
    }));

  it('takes an Observable as question', async () => {
    const prompts = Observable.create((obs) => {
      obs.next({
        type: 'confirm',
        name: 'q1',
        message: 'message',
      });
      setTimeout(() => {
        obs.next({
          type: 'confirm',
          name: 'q2',
          message: 'message',
          default: false,
        });
        obs.complete();
        promise.ui.rl.emit('line');
      }, 30);
    });

    const promise = prompt(prompts);
    promise.ui.rl.emit('line');

    return promise.then((answers) => {
      expect(answers.q1).toEqual(true);
      expect(answers.q2).toEqual(false);
    });
  });

  it('should take a prompts array and answers and return answers', async () => {
    const prompts = [
      {
        type: 'confirm',
        name: 'q1',
        message: 'message',
      },
    ];

    const promise = prompt(prompts, { prefiled: true });
    autosubmit(promise.ui);

    return promise.then((answers) => {
      expect(answers.prefiled).toEqual(true);
      expect(answers.q1).toEqual(true);
    });
  });

  it('should provide answers in filter callback for lists', async () =>
    new Promise((done) => {
      const filter = vi.fn(() => 'foo');

      const prompts = [
        {
          type: 'list',
          name: 'q1',
          default: 'foo',
          choices: ['foo', 'bar'],
          message: 'message',
          filter,
        },
      ];

      const promise = prompt(prompts);
      promise.ui.rl.emit('line');
      promise.then(() => {
        const spyCalls = filter.mock.calls[0];

        expect(spyCalls[0]).toEqual('foo');
        expect(spyCalls[1]).toBeTypeOf('object');
        done();
      });
    }));

  describe('hierarchical mode (`when`)', () => {
    it('should pass current answers to `when`', async () => {
      const prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message',
        },
        {
          name: 'q2',
          message: 'message',
          when(answers) {
            expect(answers).toBeTypeOf('object');
            expect(answers.q1).toEqual(true);
          },
        },
      ];

      const promise = prompt(prompts);

      autosubmit(promise.ui);
      return promise;
    });

    it('should run prompt if `when` returns true', async () => {
      let goesInWhen = false;
      const prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'input',
          name: 'q2',
          message: 'message',
          default: 'bar-var',
          when() {
            goesInWhen = true;
            return true;
          },
        },
      ];

      const promise = prompt(prompts);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(goesInWhen).toEqual(true);
        expect(answers.q2).toEqual('bar-var');
      });
    });

    it('should run prompt if `when` is true', async () => {
      const prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'input',
          name: 'q2',
          message: 'message',
          default: 'bar-var',
          when: true,
        },
      ];

      const promise = prompt(prompts);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.q2).toEqual('bar-var');
      });
    });

    it('should not run prompt if `when` returns false', async () => {
      let goesInWhen = false;
      const prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'confirm',
          name: 'q2',
          message: 'message',
          when() {
            goesInWhen = true;
            return false;
          },
        },
        {
          type: 'input',
          name: 'q3',
          message: 'message',
          default: 'foo',
        },
      ];

      const promise = prompt(prompts);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(goesInWhen).toEqual(true);
        expect(answers.q2).toEqual(undefined);
        expect(answers.q3).toEqual('foo');
        expect(answers.q1).toEqual(true);
      });
    });

    it('should not run prompt if `when` is false', async () => {
      const prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'confirm',
          name: 'q2',
          message: 'message',
          when: false,
        },
        {
          type: 'input',
          name: 'q3',
          message: 'message',
          default: 'foo',
        },
      ];

      const promise = prompt(prompts);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.q2).toEqual(undefined);
        expect(answers.q3).toEqual('foo');
        expect(answers.q1).toEqual(true);
      });
    });

    it('should run asynchronous `when`', async () => {
      let goesInWhen = false;
      const prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message',
        },
        {
          type: 'input',
          name: 'q2',
          message: 'message',
          default: 'foo-bar',
          when() {
            goesInWhen = true;
            const goOn = this.async();
            setTimeout(() => {
              goOn(null, true);
            }, 0);
            setTimeout(() => {
              promise.ui.rl.emit('line');
            }, 10);
          },
        },
      ];

      const promise = prompt(prompts);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(goesInWhen).toEqual(true);
        expect(answers.q2).toEqual('foo-bar');
      });
    });

    it('should get the value which set in `when` on returns false', async () => {
      const prompts = [
        {
          name: 'q',
          message: 'message',
          when(answers) {
            answers.q = 'foo';
            return false;
          },
        },
      ];

      const promise = prompt(prompts);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.q).toEqual('foo');
      });
    });

    it('should not run prompt if answer exists for question', async () => {
      const throwFunc = function (step) {
        throw new Error(`askAnswered Error ${step}`);
      };
      const prompts = [
        {
          type: 'input',
          name: 'prefiled',
          when: throwFunc.bind(undefined, 'when'),
          validate: throwFunc.bind(undefined, 'validate'),
          transformer: throwFunc.bind(undefined, 'transformer'),
          filter: throwFunc.bind(undefined, 'filter'),
          message: 'message',
          default: 'newValue',
        },
      ];

      const promise = prompt(prompts, { prefiled: 'prefiled' });
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.prefiled).toEqual('prefiled');
      });
    });

    it('should not run prompt if nested answer exists for question', async () => {
      const throwFunc = function (step) {
        throw new Error(`askAnswered Error ${step}`);
      };
      const prompts = [
        {
          type: 'input',
          name: 'prefiled.nested',
          when: throwFunc.bind(undefined, 'when'),
          validate: throwFunc.bind(undefined, 'validate'),
          transformer: throwFunc.bind(undefined, 'transformer'),
          filter: throwFunc.bind(undefined, 'filter'),
          message: 'message',
          default: 'newValue',
        },
      ];

      const promise = prompt(prompts, { prefiled: { nested: 'prefiled' } });
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.prefiled.nested).toEqual('prefiled');
      });
    });

    it('should run prompt if answer exists for question and askAnswered is set', async () => {
      const prompts = [
        {
          askAnswered: true,
          type: 'input',
          name: 'prefiled',
          message: 'message',
          default: 'newValue',
        },
      ];

      const promise = prompt(prompts, { prefiled: 'prefiled' });
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.prefiled).toEqual('newValue');
      });
    });

    it('should run prompt if nested answer exists for question and askAnswered is set', async () => {
      const prompts = [
        {
          askAnswered: true,
          type: 'input',
          name: 'prefiled.nested',
          message: 'message',
          default: 'newValue',
        },
      ];

      const promise = prompt(prompts, { prefiled: { nested: 'prefiled' } });
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.prefiled.nested).toEqual('newValue');
      });
    });
  });

  describe('#registerPrompt()', () => {
    it('register new prompt types', () =>
      new Promise((done) => {
        const questions = [{ type: 'foo', message: 'something' }];
        inquirer.registerPrompt('foo', function (question, rl, answers) {
          expect(question).toEqual(questions[0]);
          expect(answers).toEqual({});
          this.run = vi.fn(() => Promise.resolve());
          done();
        });

        inquirer.prompt(questions);
      }));

    it('overwrite default prompt types', () =>
      new Promise((done) => {
        const questions = [{ type: 'confirm', message: 'something' }];
        inquirer.registerPrompt('confirm', function () {
          this.run = vi.fn(() => Promise.resolve());
          done();
        });

        inquirer.prompt(questions);
        inquirer.restoreDefaultPrompts();
      }));
  });

  describe('#restoreDefaultPrompts()', () => {
    it('restore default prompts', async () => {
      const ConfirmPrompt = inquirer.prompt.prompts.confirm;
      inquirer.registerPrompt('confirm', () => {});
      inquirer.restoreDefaultPrompts();
      expect(ConfirmPrompt).toEqual(inquirer.prompt.prompts.confirm);
    });
  });

  // See: https://github.com/SBoudrias/Inquirer.js/pull/326
  it('does not throw exception if cli-width reports width of 0', async () => {
    const original = process.stdout.getWindowSize;
    process.stdout.getWindowSize = function () {
      return [0];
    };

    const localPrompt = inquirer.createPromptModule();

    const prompts = [
      {
        type: 'confirm',
        name: 'q1',
        message: 'message',
      },
    ];

    const promise = localPrompt(prompts);
    promise.ui.rl.emit('line');

    return promise.then((answers) => {
      process.stdout.getWindowSize = original;
      expect(answers.q1).toEqual(true);
    });
  });

  describe('Non-TTY checks', () => {
    let original;

    beforeEach(() => {
      original = process.stdin.isTTY;
      delete process.stdin.isTTY;
    });

    afterEach(() => {
      process.stdin.isTTY = original;
    });

    it('Throw an exception when run in non-tty', async () => {
      const localPrompt = inquirer.createPromptModule({ skipTTYChecks: false });

      const prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message',
        },
      ];

      const promise = localPrompt(prompts);

      return promise
        .then(() => {
          // Failure
          expect(true).toEqual(false);
        })
        .catch((error) => {
          expect(error.isTtyError).toEqual(true);
        });
    });

    it("Don't throw an exception when run in non-tty by defaultasync ", () =>
      new Promise((done) => {
        const localPrompt = inquirer.createPromptModule();
        const prompts = [
          {
            type: 'confirm',
            name: 'q1',
            message: 'message',
          },
          {
            type: 'confirm',
            name: 'q2',
            message: 'message',
          },
        ];

        const promise = localPrompt(prompts);
        autosubmit(promise.ui);
        promise
          .then(() => {
            done();
          })
          .catch((error) => {
            console.log(error);
            expect(error.isTtyError).toEqual(false);
          });
      }));

    it("Don't throw an exception when run in non-tty and skipTTYChecks is trueasync ", () =>
      new Promise((done) => {
        const localPrompt = inquirer.createPromptModule({ skipTTYChecks: true });
        const prompts = [
          {
            type: 'confirm',
            name: 'q1',
            message: 'message',
          },
          {
            type: 'confirm',
            name: 'q2',
            message: 'message',
          },
        ];

        const promise = localPrompt(prompts);
        autosubmit(promise.ui);
        promise
          .then(() => {
            done();
          })
          .catch((error) => {
            console.log(error);
            expect(error.isTtyError).toEqual(false);
          });
      }));

    it("Don't throw an exception when run in non-tty and custom input is providedasync ", () =>
      new Promise((done) => {
        const localPrompt = inquirer.createPromptModule({
          input: new stream.Readable({
            // We must have a default read implementation
            // for this to work, if not it will error out
            // with the following error message during testing
            // Uncaught Error [ERR_METHOD_NOT_IMPLEMENTED]: The _read() method is not implemented
            read() {},
          }),
        });
        const prompts = [
          {
            type: 'confirm',
            name: 'q1',
            message: 'message',
          },
          {
            type: 'confirm',
            name: 'q2',
            message: 'message',
          },
        ];

        const promise = localPrompt(prompts);
        autosubmit(promise.ui);
        promise
          .then(() => {
            done();
          })
          .catch((error) => {
            console.log(error);
            expect(error.isTtyError).toEqual(false);
          });
      }));

    it('Throw an exception when run in non-tty and custom input is provided with skipTTYChecks: false', async () => {
      const localPrompt = inquirer.createPromptModule({
        input: new stream.Readable(),
        skipTTYChecks: false,
      });

      const prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message',
        },
      ];

      const promise = localPrompt(prompts);

      return promise
        .then(() => {
          // Failure
          expect(true).toEqual(false);
        })
        .catch((error) => {
          expect(error.isTtyError).toEqual(true);
        });
    });

    const itSkipWindows =
      ostype === 'Windows_NT' || process.env.GITHUB_ACTIONS ? it.skip : it;
    itSkipWindows('No exception when using tty other than process.stdin', async () => {
      const input = new tty.ReadStream(fs.openSync('/dev/tty', 'r+'));

      // Uses manually opened tty as input instead of process.stdin
      const localPrompt = inquirer.createPromptModule({
        input,
        skipTTYChecks: false,
      });

      const prompts = [
        {
          type: 'input',
          name: 'q1',
          default: 'foo',
          message: 'message',
        },
      ];

      const promise = localPrompt(prompts);
      promise.ui.rl.emit('line');

      // Release the input tty socket
      input.unref();

      return promise.then((answers) => {
        expect(answers).toEqual({ q1: 'foo' });
      });
    });
  });
});
