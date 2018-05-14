/**
 * Inquirer public API test
 */

var expect = require('chai').expect;
var sinon = require('sinon');
var _ = require('lodash');
var { Observable } = require('rxjs');
var inquirer = require('../../lib/inquirer');
var autosubmit = require('../helpers/events').autosubmit;

describe('inquirer.prompt', function() {
  beforeEach(function() {
    this.prompt = inquirer.createPromptModule();
  });

  it("should close and create a new readline instances each time it's called", function() {
    var ctx = this;
    var rl1;

    var promise = this.prompt({
      type: 'confirm',
      name: 'q1',
      message: 'message'
    });

    rl1 = promise.ui.rl;
    rl1.emit('line');

    return promise.then(() => {
      expect(rl1.close.called).to.equal(true);
      expect(rl1.output.end.called).to.equal(true);

      var rl2;
      var promise2 = ctx.prompt({
        type: 'confirm',
        name: 'q1',
        message: 'message'
      });

      rl2 = promise2.ui.rl;
      rl2.emit('line');

      return promise2.then(() => {
        expect(rl2.close.called).to.equal(true);
        expect(rl2.output.end.called).to.equal(true);

        expect(rl1).to.not.equal(rl2);
      });
    });
  });

  it('should take a prompts array and return answers', function() {
    var prompts = [
      {
        type: 'confirm',
        name: 'q1',
        message: 'message'
      },
      {
        type: 'confirm',
        name: 'q2',
        message: 'message',
        default: false
      }
    ];

    var promise = this.prompt(prompts);
    autosubmit(promise.ui);

    return promise.then(answers => {
      expect(answers.q1).to.equal(true);
      expect(answers.q2).to.equal(false);
    });
  });

  it('should take a prompts array with nested names', function() {
    var prompts = [
      {
        type: 'confirm',
        name: 'foo.bar.q1',
        message: 'message'
      },
      {
        type: 'confirm',
        name: 'foo.q2',
        message: 'message',
        default: false
      }
    ];

    var promise = this.prompt(prompts);
    autosubmit(promise.ui);

    return promise.then(answers => {
      expect(answers).to.deep.equal({
        foo: {
          bar: {
            q1: true
          },
          q2: false
        }
      });
    });
  });

  it('should take a single prompt and return answer', function() {
    var prompt = {
      type: 'input',
      name: 'q1',
      message: 'message',
      default: 'bar'
    };

    var promise = this.prompt(prompt);

    promise.ui.rl.emit('line');
    return promise.then(answers => {
      expect(answers.q1).to.equal('bar');
    });
  });

  it('should parse `message` if passed as a function', function() {
    var stubMessage = 'foo';
    this.prompt.registerPrompt('stub', function(params) {
      this.opt = {
        when: function() {
          return true;
        }
      };
      this.run = sinon.stub().returns(Promise.resolve());
      expect(params.message).to.equal(stubMessage);
    });

    var msgFunc = function(answers) {
      expect(answers.name1).to.equal('bar');
      return stubMessage;
    };

    var prompts = [
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'stub',
        name: 'name',
        message: msgFunc
      }
    ];

    var promise = this.prompt(prompts);
    promise.ui.rl.emit('line');
    promise.ui.rl.emit('line');
    return promise.then(() => {
      // Ensure we're not overwriting original prompt values.
      expect(prompts[1].message).to.equal(msgFunc);
    });
  });

  it('should run asynchronous `message`', function(done) {
    var stubMessage = 'foo';
    this.prompt.registerPrompt('stub', function(params) {
      this.opt = {
        when: function() {
          return true;
        }
      };
      this.run = sinon.stub().returns(Promise.resolve());
      expect(params.message).to.equal(stubMessage);
      done();
    });

    var prompts = [
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'stub',
        name: 'name',
        message: function(answers) {
          expect(answers.name1).to.equal('bar');
          var goOn = this.async();
          setTimeout(() => {
            goOn(null, stubMessage);
          }, 0);
        }
      }
    ];

    var promise = this.prompt(prompts, function() {});
    promise.ui.rl.emit('line');
  });

  it('should parse `default` if passed as a function', function(done) {
    var stubDefault = 'foo';
    this.prompt.registerPrompt('stub', function(params) {
      this.opt = {
        when: function() {
          return true;
        }
      };
      this.run = sinon.stub().returns(Promise.resolve());
      expect(params.default).to.equal(stubDefault);
      done();
    });

    var prompts = [
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'stub',
        name: 'name',
        message: 'message',
        default: function(answers) {
          expect(answers.name1).to.equal('bar');
          return stubDefault;
        }
      }
    ];

    var promise = this.prompt(prompts, function() {});
    promise.ui.rl.emit('line');
  });

  it('should run asynchronous `default`', function() {
    var goesInDefault = false;
    var input2Default = 'foo';
    var promise;
    var prompts = [
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'input2',
        name: 'q2',
        message: 'message',
        default: function(answers) {
          goesInDefault = true;
          expect(answers.name1).to.equal('bar');
          var goOn = this.async();
          setTimeout(() => {
            goOn(null, input2Default);
          }, 0);
          setTimeout(() => {
            promise.ui.rl.emit('line');
          }, 10);
        }
      }
    ];

    promise = this.prompt(prompts);
    promise.ui.rl.emit('line');

    return promise.then(answers => {
      expect(goesInDefault).to.equal(true);
      expect(answers.q2).to.equal(input2Default);
    });
  });

  it('should pass previous answers to the prompt constructor', function(done) {
    this.prompt.registerPrompt('stub', function(params, rl, answers) {
      this.run = sinon.stub().returns(Promise.resolve());
      expect(answers.name1).to.equal('bar');
      done();
    });

    var prompts = [
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'stub',
        name: 'name',
        message: 'message'
      }
    ];

    var promise = this.prompt(prompts);
    promise.ui.rl.emit('line');
  });

  it('should parse `choices` if passed as a function', function(done) {
    var stubChoices = ['foo', 'bar'];
    this.prompt.registerPrompt('stub', function(params) {
      this.run = sinon.stub().returns(Promise.resolve());
      this.opt = {
        when: function() {
          return true;
        }
      };
      expect(params.choices).to.equal(stubChoices);
      done();
    });

    var prompts = [
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'stub',
        name: 'name',
        message: 'message',
        choices: function(answers) {
          expect(answers.name1).to.equal('bar');
          return stubChoices;
        }
      }
    ];

    var promise = this.prompt(prompts, function() {});
    promise.ui.rl.emit('line');
  });

  it('should returns a promise', function(done) {
    var prompt = {
      type: 'input',
      name: 'q1',
      message: 'message',
      default: 'bar'
    };

    var promise = this.prompt(prompt);
    promise.then(answers => {
      expect(answers.q1).to.equal('bar');
      done();
    });

    promise.ui.rl.emit('line');
  });

  it('should expose the Reactive interface', function(done) {
    var prompts = [
      {
        type: 'input',
        name: 'name1',
        message: 'message',
        default: 'bar'
      },
      {
        type: 'input',
        name: 'name',
        message: 'message',
        default: 'doe'
      }
    ];

    var promise = this.prompt(prompts);
    var spy = sinon.spy();
    promise.ui.process.subscribe(
      spy,
      function() {},
      function() {
        sinon.assert.calledWith(spy, { name: 'name1', answer: 'bar' });
        sinon.assert.calledWith(spy, { name: 'name', answer: 'doe' });
        done();
      }
    );

    autosubmit(promise.ui);
  });

  it('should expose the UI', function(done) {
    var promise = this.prompt([], function() {});
    expect(promise.ui.answers).to.be.an('object');
    done();
  });

  it('takes an Observable as question', function() {
    var promise;
    var prompts = Observable.create(function(obs) {
      obs.next({
        type: 'confirm',
        name: 'q1',
        message: 'message'
      });
      setTimeout(() => {
        obs.next({
          type: 'confirm',
          name: 'q2',
          message: 'message',
          default: false
        });
        obs.complete();
        promise.ui.rl.emit('line');
      }, 30);
    });

    promise = this.prompt(prompts);
    promise.ui.rl.emit('line');

    return promise.then(answers => {
      expect(answers.q1).to.equal(true);
      expect(answers.q2).to.equal(false);
    });
  });

  describe('hierarchical mode (`when`)', function() {
    it('should pass current answers to `when`', function() {
      var prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message'
        },
        {
          name: 'q2',
          message: 'message',
          when: function(answers) {
            expect(answers).to.be.an('object');
            expect(answers.q1).to.equal(true);
          }
        }
      ];

      var promise = this.prompt(prompts);

      autosubmit(promise.ui);
      return promise;
    });

    it('should run prompt if `when` returns true', function() {
      var goesInWhen = false;
      var prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message'
        },
        {
          type: 'input',
          name: 'q2',
          message: 'message',
          default: 'bar-var',
          when: function() {
            goesInWhen = true;
            return true;
          }
        }
      ];

      var promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(goesInWhen).to.equal(true);
        expect(answers.q2).to.equal('bar-var');
      });
    });

    it('should run prompt if `when` is true', function() {
      var prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message'
        },
        {
          type: 'input',
          name: 'q2',
          message: 'message',
          default: 'bar-var',
          when: true
        }
      ];

      var promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(answers.q2).to.equal('bar-var');
      });
    });

    it('should not run prompt if `when` returns false', function() {
      var goesInWhen = false;
      var prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message'
        },
        {
          type: 'confirm',
          name: 'q2',
          message: 'message',
          when: function() {
            goesInWhen = true;
            return false;
          }
        },
        {
          type: 'input',
          name: 'q3',
          message: 'message',
          default: 'foo'
        }
      ];

      var promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(goesInWhen).to.equal(true);
        expect(answers.q2).to.equal(undefined);
        expect(answers.q3).to.equal('foo');
        expect(answers.q1).to.equal(true);
      });
    });

    it('should not run prompt if `when` is false', function() {
      var prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message'
        },
        {
          type: 'confirm',
          name: 'q2',
          message: 'message',
          when: false
        },
        {
          type: 'input',
          name: 'q3',
          message: 'message',
          default: 'foo'
        }
      ];

      var promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(answers.q2).to.equal(undefined);
        expect(answers.q3).to.equal('foo');
        expect(answers.q1).to.equal(true);
      });
    });

    it('should run asynchronous `when`', function() {
      var promise;
      var goesInWhen = false;
      var prompts = [
        {
          type: 'confirm',
          name: 'q1',
          message: 'message'
        },
        {
          type: 'input',
          name: 'q2',
          message: 'message',
          default: 'foo-bar',
          when: function() {
            goesInWhen = true;
            var goOn = this.async();
            setTimeout(() => {
              goOn(null, true);
            }, 0);
            setTimeout(() => {
              promise.ui.rl.emit('line');
            }, 10);
          }
        }
      ];

      promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(goesInWhen).to.equal(true);
        expect(answers.q2).to.equal('foo-bar');
      });
    });

    it('should get the value which set in `when` on returns false', function() {
      var prompts = [
        {
          name: 'q',
          message: 'message',
          when: function(answers) {
            answers.q = 'foo';
            return false;
          }
        }
      ];

      var promise = this.prompt(prompts);
      autosubmit(promise.ui);

      return promise.then(answers => {
        expect(answers.q).to.equal('foo');
      });
    });
  });

  describe('#registerPrompt()', function() {
    it('register new prompt types', function(done) {
      var questions = [{ type: 'foo', message: 'something' }];
      inquirer.registerPrompt('foo', function(question, rl, answers) {
        expect(question).to.eql(questions[0]);
        expect(answers).to.eql({});
        this.run = sinon.stub().returns(Promise.resolve());
        done();
      });

      inquirer.prompt(questions, _.noop);
    });

    it('overwrite default prompt types', function(done) {
      var questions = [{ type: 'confirm', message: 'something' }];
      inquirer.registerPrompt('confirm', function() {
        this.run = sinon.stub().returns(Promise.resolve());
        done();
      });

      inquirer.prompt(questions, _.noop);
      inquirer.restoreDefaultPrompts();
    });
  });

  describe('#restoreDefaultPrompts()', function() {
    it('restore default prompts', function() {
      var ConfirmPrompt = inquirer.prompt.prompts.confirm;
      inquirer.registerPrompt('confirm', _.noop);
      inquirer.restoreDefaultPrompts();
      expect(ConfirmPrompt).to.equal(inquirer.prompt.prompts.confirm);
    });
  });

  // See: https://github.com/SBoudrias/Inquirer.js/pull/326
  it('does not throw exception if cli-width reports width of 0', function() {
    var original = process.stdout.getWindowSize;
    process.stdout.getWindowSize = function() {
      return [0];
    };
    var prompt = inquirer.createPromptModule();

    var prompts = [
      {
        type: 'confirm',
        name: 'q1',
        message: 'message'
      }
    ];

    var promise = prompt(prompts);
    promise.ui.rl.emit('line');

    return promise.then(answers => {
      process.stdout.getWindowSize = original;
      expect(answers.q1).to.equal(true);
    });
  });
});
