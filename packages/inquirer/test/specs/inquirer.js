/**
 * Inquirer public API test
 */

import fs from 'fs';
import os from 'os';
import stream from 'stream';
import tty from 'tty';
import { expect } from 'chai';
import sinon from 'sinon';
import { Observable } from 'rxjs';

import * as inquirer from '../../lib/inquirer';
import { autosubmit } from '../helpers/events';

const ostype = os.type();

describe('inquirer.prompt', () => {
  let mocha;

  before(function () {
    mocha = this;
  });

  beforeEach(function () {
    this.prompt = inquirer.createPromptModule();
  });

  it("should close and create a new readline instances each time it's called", function () {
    const ctx = this;

    const promise = this.prompt({
      type: 'confirm',
      name: 'q1',
      message: 'message',
    });

    const rl1 = promise.ui.rl;
    rl1.emit('line');

    return promise.then(() => {
      expect(rl1.close.called).to.equal(true);
      expect(rl1.output.end.called).to.equal(true);

      const promise2 = ctx.prompt({
        type: 'confirm',
        name: 'q1',
        message: 'message',
      });

      const rl2 = promise2.ui.rl;
      rl2.emit('line');

      return promise2.then(() => {
        expect(rl2.close.called).to.equal(true);
        expect(rl2.output.end.called).to.equal(true);

        expect(rl1).to.not.equal(rl2);
      });
    });
  });

  it('should close readline instance on rejected promise', function (done) {
    this.prompt.registerPrompt('stub', function () {
      this.run = () => Promise.reject(new Error('test error'));
    });

    const promise = this.prompt({
      type: 'stub',
      name: 'q1',
    });

    const rl1 = promise.ui.rl;

    promise.catch(() => {
      expect(rl1.close.called).to.equal(true);
      expect(rl1.output.end.called).to.equal(true);
      done();
    });
  });

  it('should take a prompts array and return answers', function () {
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

    const promise = this.prompt(prompts);
    autosubmit(promise.ui);

    return promise.then((answers) => {
      expect(answers.q1).to.equal(true);
      expect(answers.q2).to.equal(false);
    });
  });

  it('should take a prompts nested object and return answers', async function () {
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

    const promise = this.prompt(prompts);
    autosubmit(promise.ui);
    const { q1, q2 } = await promise;
    expect(q1).to.equal(true);
    expect(q2).to.equal('Foo');
  });

  it('should take a prompts array with nested names', function () {
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

    const promise = this.prompt(prompts);
    autosubmit(promise.ui);

    return promise.then((answers) => {
      expect(answers).to.deep.equal({
        foo: {
          bar: {
            q1: true,
          },
          q2: false,
        },
      });
    });
  });

  it('should take a single prompt and return answer', function () {
    const prompt = {
      type: 'input',
      name: 'q1',
      message: 'message',
      default: 'bar',
    };

    const promise = this.prompt(prompt);

    promise.ui.rl.emit('line');
    return promise.then((answers) => {
      expect(answers.q1).to.equal('bar');
    });
  });

  it('should parse `message` if passed as a function', function () {
    const stubMessage = 'foo';
    this.prompt.registerPrompt('stub', function (params) {
      this.opt = {
        when() {
          return true;
        },
      };
      this.run = sinon.stub().returns(Promise.resolve());
      expect(params.message).to.equal(stubMessage);
    });

    const msgFunc = function (answers) {
      expect(answers.name1).to.equal('bar');
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

    const promise = this.prompt(prompts);
    promise.ui.rl.emit('line');
    promise.ui.rl.emit('line');
    return promise.then(() => {
      // Ensure we're not overwriting original prompt values.
      expect(prompts[1].message).to.equal(msgFunc);
    });
  });

  it('should run asynchronous `message`', function (done) {
    const stubMessage = 'foo';
    this.prompt.registerPrompt('stub', function (params) {
      this.opt = {
        when() {
          return true;
        },
      };
      this.run = sinon.stub().returns(Promise.resolve());
      expect(params.message).to.equal(stubMessage);
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
          expect(answers.name1).to.equal('bar');
          const goOn = this.async();
          setTimeout(() => {
            goOn(null, stubMessage);
          }, 0);
        },
      },
    ];

    const promise = this.prompt(prompts);
    promise.ui.rl.emit('line');
  });

  it('should parse `default` if passed as a function', function (done) {
    const stubDefault = 'foo';
    this.prompt.registerPrompt('stub', function (params) {
      this.opt = {
        when() {
          return true;
        },
      };
      this.run = sinon.stub().returns(Promise.resolve());
      expect(params.default).to.equal(stubDefault);
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
          expect(answers.name1).to.equal('bar');
          return stubDefault;
        },
      },
    ];

    const promise = this.prompt(prompts);
    promise.ui.rl.emit('line');
  });

  it('should run asynchronous `default`', function () {
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
          expect(answers.name1).to.equal('bar');
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

    const promise = this.prompt(prompts);
    promise.ui.rl.emit('line');

    return promise.then((answers) => {
      expect(goesInDefault).to.equal(true);
      expect(answers.q2).to.equal(input2Default);
    });
  });

  it('should pass previous answers to the prompt constructor', function (done) {
    this.prompt.registerPrompt('stub', function (params, rl, answers) {
      this.run = sinon.stub().returns(Promise.resolve());
      expect(answers.name1).to.equal('bar');
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

    const promise = this.prompt(prompts);
    promise.ui.rl.emit('line');
  });

  it('should parse `choices` if passed as a function', function (done) {
    const stubChoices = ['foo', 'bar'];
    this.prompt.registerPrompt('stub', function (params) {
      this.run = sinon.stub().returns(Promise.resolve());
      this.opt = {
        when() {
          return true;
        },
      };
      expect(params.choices).to.equal(stubChoices);
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
          expect(answers.name1).to.equal('bar');
          return stubChoices;
        },
      },
    ];

    const promise = this.prompt(prompts);
    promise.ui.rl.emit('line');
  });

  it('should returns a promise', function (done) {
    const prompt = {
      type: 'input',
      name: 'q1',
      message: 'message',
      default: 'bar',
    };

    const promise = this.prompt(prompt);
    promise.then((answers) => {
      expect(answers.q1).to.equal('bar');
      done();
    });

    promise.ui.rl.emit('line');
  });

  it('should expose the Reactive interface', function (done) {
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

    const promise = this.prompt(prompts);
    const spy = sinon.spy();
    promise.ui.process.subscribe(
      spy,
      () => {},
      () => {
        sinon.assert.calledWith(spy, { name: 'name1', answer: 'bar' });
        sinon.assert.calledWith(spy, { name: 'name', answer: 'doe' });
        done();
      }
    );

    autosubmit(promise.ui);
  });

  it('should expose the UI', function (done) {
    const promise = this.prompt([]);
    expect(promise.ui.answers).to.be.an('object');
    done();
  });

  it('takes an Observable as question', function () {
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

    const promise = this.prompt(prompts);
    promise.ui.rl.emit('line');

    return promise.then((answers) => {
      expect(answers.q1).to.equal(true);
      expect(answers.q2).to.equal(false);
    });
  });

  it('should take a prompts array and answers and return answers', function () {
    const prompts = [
      {
        type: 'confirm',
        name: 'q1',
        message: 'message',
      },
    ];

    const answers = { prefiled: true };
    const promise = this.prompt(prompts, answers);
    autosubmit(promise.ui);

    return promise.then((answers) => {
      expect(answers.prefiled).to.equal(true);
      expect(answers.q1).to.equal(true);
    });
  });

  it('should provide answers in filter callback for lists', function (done) {
    const filter = sinon.stub();
    filter.returns('foo');

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

    const promise = this.prompt(prompts);
    promise.ui.rl.emit('line');
    promise.then(() => {
      const spyCall = filter.getCall(0);

      expect(spyCall.args[0]).to.equal('foo');
      expect(spyCall.args[1]).to.be.an('object');
      done();
    });
  });

  describe('hierarchical mode (`when`)', () => {
    it('should pass current answers to `when`', function () {
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
            expect(answers).to.be.an('object');
            expect(answers.q1).to.equal(true);
          },
        },
      ];

      const promise = this.prompt(prompts);

      autosubmit(promise.ui);
      return promise;
    });

    it('should run prompt if `when` returns true', function () {
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

      const promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(goesInWhen).to.equal(true);
        expect(answers.q2).to.equal('bar-var');
      });
    });

    it('should run prompt if `when` is true', function () {
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

      const promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.q2).to.equal('bar-var');
      });
    });

    it('should not run prompt if `when` returns false', function () {
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

      const promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(goesInWhen).to.equal(true);
        expect(answers.q2).to.equal(undefined);
        expect(answers.q3).to.equal('foo');
        expect(answers.q1).to.equal(true);
      });
    });

    it('should not run prompt if `when` is false', function () {
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

      const promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.q2).to.equal(undefined);
        expect(answers.q3).to.equal('foo');
        expect(answers.q1).to.equal(true);
      });
    });

    it('should run asynchronous `when`', function () {
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

      const promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(goesInWhen).to.equal(true);
        expect(answers.q2).to.equal('foo-bar');
      });
    });

    it('should get the value which set in `when` on returns false', function () {
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

      const promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.q).to.equal('foo');
      });
    });

    it('should not run prompt if answer exists for question', function () {
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

      const answers = { prefiled: 'prefiled' };
      const promise = this.prompt(prompts, answers);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.prefiled).to.equal('prefiled');
      });
    });

    it('should not run prompt if nested answer exists for question', function () {
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

      const answers = { prefiled: { nested: 'prefiled' } };
      const promise = this.prompt(prompts, answers);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.prefiled.nested).to.equal('prefiled');
      });
    });

    it('should run prompt if answer exists for question and askAnswered is set', function () {
      const prompts = [
        {
          askAnswered: true,
          type: 'input',
          name: 'prefiled',
          message: 'message',
          default: 'newValue',
        },
      ];

      const answers = { prefiled: 'prefiled' };
      const promise = this.prompt(prompts, answers);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.prefiled).to.equal('newValue');
      });
    });

    it('should run prompt if nested answer exists for question and askAnswered is set', function () {
      const prompts = [
        {
          askAnswered: true,
          type: 'input',
          name: 'prefiled.nested',
          message: 'message',
          default: 'newValue',
        },
      ];

      const answers = { prefiled: { nested: 'prefiled' } };
      const promise = this.prompt(prompts, answers);
      autosubmit(promise.ui);

      return promise.then((answers) => {
        expect(answers.prefiled.nested).to.equal('newValue');
      });
    });
  });

  describe('#registerPrompt()', () => {
    it('register new prompt types', (done) => {
      const questions = [{ type: 'foo', message: 'something' }];
      inquirer.registerPrompt('foo', function (question, rl, answers) {
        expect(question).to.eql(questions[0]);
        expect(answers).to.eql({});
        this.run = sinon.stub().returns(Promise.resolve());
        done();
      });

      inquirer.prompt(questions);
    });

    it('overwrite default prompt types', (done) => {
      const questions = [{ type: 'confirm', message: 'something' }];
      inquirer.registerPrompt('confirm', function () {
        this.run = sinon.stub().returns(Promise.resolve());
        done();
      });

      inquirer.prompt(questions);
      inquirer.restoreDefaultPrompts();
    });
  });

  describe('#restoreDefaultPrompts()', () => {
    it('restore default prompts', () => {
      const ConfirmPrompt = inquirer.prompt.prompts.confirm;
      inquirer.registerPrompt('confirm', () => {});
      inquirer.restoreDefaultPrompts();
      expect(ConfirmPrompt).to.equal(inquirer.prompt.prompts.confirm);
    });
  });

  // See: https://github.com/SBoudrias/Inquirer.js/pull/326
  it('does not throw exception if cli-width reports width of 0', () => {
    const original = process.stdout.getWindowSize;
    process.stdout.getWindowSize = function () {
      return [0];
    };

    const prompt = inquirer.createPromptModule();

    const prompts = [
      {
        type: 'confirm',
        name: 'q1',
        message: 'message',
      },
    ];

    const promise = prompt(prompts);
    promise.ui.rl.emit('line');

    return promise.then((answers) => {
      process.stdout.getWindowSize = original;
      expect(answers.q1).to.equal(true);
    });
  });

  describe('Non-TTY checks', () => {
    let original;

    before(() => {
      original = process.stdin.isTTY;
      delete process.stdin.isTTY;
    });

    after(() => {
      process.stdin.isTTY = original;
    });

    it('Throw an exception when run in non-tty', () => {
      const prompt = inquirer.createPromptModule({ skipTTYChecks: false });

      const prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message',
        },
      ];

      const promise = prompt(prompts);

      return promise
        .then(() => {
          // Failure
          expect(true).to.equal(false);
        })
        .catch((error) => {
          expect(error.isTtyError).to.equal(true);
        });
    });

    it("Don't throw an exception when run in non-tty by default", (done) => {
      const prompt = inquirer.createPromptModule();
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

      const promise = prompt(prompts);
      autosubmit(promise.ui);
      promise
        .then(() => {
          done();
        })
        .catch((error) => {
          console.log(error);
          expect(error.isTtyError).to.equal(false);
        });
    });

    it("Don't throw an exception when run in non-tty and skipTTYChecks is true", (done) => {
      const prompt = inquirer.createPromptModule({ skipTTYChecks: true });
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

      const promise = prompt(prompts);
      autosubmit(promise.ui);
      promise
        .then(() => {
          done();
        })
        .catch((error) => {
          console.log(error);
          expect(error.isTtyError).to.equal(false);
        });
    });

    it("Don't throw an exception when run in non-tty and custom input is provided", (done) => {
      const prompt = inquirer.createPromptModule({
        input: new stream.Readable({
          // We must have a default read implementation
          // for this to work, if not it will error out
          // with the following error message during testing
          // Uncaught Error [ERR_METHOD_NOT_IMPLEMENTED]: The _read() method is not implemented
          read: () => {},
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

      const promise = prompt(prompts);
      autosubmit(promise.ui);
      promise
        .then(() => {
          done();
        })
        .catch((error) => {
          console.log(error);
          expect(error.isTtyError).to.equal(false);
        });
    });

    it('Throw an exception when run in non-tty and custom input is provided with skipTTYChecks: false', () => {
      const prompt = inquirer.createPromptModule({
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

      const promise = prompt(prompts);

      return promise
        .then(() => {
          // Failure
          expect(true).to.equal(false);
        })
        .catch((error) => {
          expect(error.isTtyError).to.equal(true);
        });
    });

    it('No exception when using tty other than process.stdin', () => {
      // Manually opens a new tty
      if (ostype === 'Windows_NT' || process.env.GITHUB_ACTIONS) {
        mocha.skip();
      } else {
        const input = new tty.ReadStream(fs.openSync('/dev/tty', 'r+'));

        // Uses manually opened tty as input instead of process.stdin
        const prompt = inquirer.createPromptModule({
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

        const promise = prompt(prompts);
        promise.ui.rl.emit('line');

        // Release the input tty socket
        input.unref();

        return promise.then((answers) => {
          expect(answers).to.deep.equal({ q1: 'foo' });
        });
      }
    });
  });
});
