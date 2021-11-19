/**
 * Test Prompt public APIs
 */

const { expect } = require('chai');
const fixtures = require('../helpers/fixtures');
const ReadlineStub = require('../helpers/readline');
const inquirer = require('../../lib/inquirer');
const { autosubmit } = require('../helpers/events');

// Define prompts and their public API
const prompts = [
  {
    name: 'input',
    apis: ['filter', 'validate', 'default', 'message', 'requiredValues'],
  },
  {
    name: 'confirm',
    apis: ['message', 'requiredValues'],
  },
  {
    name: 'rawlist',
    apis: ['filter', 'message', 'choices', 'requiredValues'],
  },
  {
    name: 'list',
    apis: ['filter', 'message', 'choices', 'requiredValues'],
  },
  {
    name: 'expand',
    apis: ['requiredValues', 'message'],
  },
  {
    name: 'checkbox',
    apis: ['requiredValues', 'message', 'choices', 'filter', 'validate'],
  },
  {
    name: 'password',
    apis: ['requiredValues', 'message', 'filter', 'validate', 'default'],
  },
];

// Define tests
const tests = {
  filter() {
    describe('filter API', () => {
      it('should filter the user input', function (done) {
        this.fixture.filter = function () {
          return 'pass';
        };

        const prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run().then((answer) => {
          expect(answer).to.equal('pass');
          done();
        });

        this.rl.emit('line', '');
      });

      it('should allow filter function to be asynchronous', function (done) {
        this.fixture.filter = function () {
          const done = this.async();
          setTimeout(() => {
            done(null, 'pass');
          }, 0);
        };

        const prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run().then((answer) => {
          expect(answer).to.equal('pass');
          done();
        });

        this.rl.emit('line', '');
      });

      it('should handle errors produced in async filters', function () {
        let called = 0;
        const { rl } = this;

        this.fixture.filter = function () {
          called++;
          const cb = this.async();

          if (called === 2) {
            return cb(null, 'pass');
          }

          rl.emit('line');
          return cb(new Error('fail'));
        };

        const prompt = new this.Prompt(this.fixture, this.rl);
        const promise = prompt.run();

        this.rl.emit('line');
        return promise;
      });

      it('should pass previous answers to the prompt filter function', () => {
        const prompt = inquirer.createPromptModule();
        const questions = [
          {
            type: 'confirm',
            name: 'q1',
            message: 'message',
          },
          {
            type: 'confirm',
            name: 'q2',
            message: 'message',
            filter(input, answers) {
              expect(answers.q1).to.equal(true);
              return input;
            },
            default: false,
          },
        ];

        const promise = prompt(questions);
        autosubmit(promise.ui);

        return promise.then((answers) => {
          expect(answers.q1).to.equal(true);
          expect(answers.q2).to.equal(false);
        });
      });
    });
  },

  validate() {
    describe('validate API', () => {
      it('should reject input if boolean false is returned', function () {
        let called = 0;

        this.fixture.validate = () => {
          called++;
          // Make sure returning false won't continue
          if (called === 2) {
            return true;
          }

          this.rl.emit('line');
          return false;
        };

        const prompt = new this.Prompt(this.fixture, this.rl);
        const promise = prompt.run();

        this.rl.emit('line');
        return promise;
      });

      it('should reject input if a string is returned', function (done) {
        const self = this;
        let called = 0;
        const errorMessage = 'uh oh, error!';

        this.fixture.validate = function () {
          called++;
          // Make sure returning false won't continue
          if (called === 2) {
            done();
            return;
          }

          self.rl.emit('line');
          return errorMessage;
        };

        const prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run();

        this.rl.emit('line');
      });

      it('should reject input if a Promise is returned which rejects', function (done) {
        const self = this;
        let called = 0;
        const errorMessage = 'uh oh, error!';

        this.fixture.validate = function () {
          called++;
          // Make sure returning false won't continue
          if (called === 2) {
            done();
            return;
          }

          self.rl.emit('line');
          return Promise.reject(errorMessage);
        };

        const prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run();

        this.rl.emit('line');
      });

      it('should accept input if boolean true is returned', function () {
        let called = 0;

        this.fixture.validate = function () {
          called++;
          return true;
        };

        const prompt = new this.Prompt(this.fixture, this.rl);
        const promise = prompt.run().then(() => {
          expect(called).to.equal(1);
        });

        this.rl.emit('line');
        return promise;
      });

      it('should allow validate function to be asynchronous', function () {
        const self = this;
        let called = 0;

        this.fixture.validate = function () {
          const done = this.async();
          setTimeout(() => {
            called++;
            // Make sure returning false won't continue
            if (called === 2) {
              done(null, true);
            } else {
              self.rl.emit('line');
            }

            done(false);
          }, 0);
        };

        const prompt = new this.Prompt(this.fixture, this.rl);
        const promise = prompt.run();

        this.rl.emit('line');
        return promise;
      });

      it('should allow validate function to return a Promise', function () {
        this.fixture.validate = function () {
          return Promise.resolve(true);
        };

        const prompt = new this.Prompt(this.fixture, this.rl);
        const promise = prompt.run();

        this.rl.emit('line');
        return promise;
      });

      it('should pass previous answers to the prompt validation function', () => {
        const prompt = inquirer.createPromptModule();
        const questions = [
          {
            type: 'confirm',
            name: 'q1',
            message: 'message',
          },
          {
            type: 'confirm',
            name: 'q2',
            message: 'message',
            validate(input, answers) {
              expect(answers.q1).to.equal(true);
              return true;
            },
            default: false,
          },
        ];

        const promise = prompt(questions);
        autosubmit(promise.ui);

        return promise.then((answers) => {
          expect(answers.q1).to.equal(true);
          expect(answers.q2).to.equal(false);
        });
      });
    });
  },

  default() {
    describe('default API', () => {
      it('should allow a default value', function (done) {
        this.fixture.default = 'pass';

        const prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run().then((answer) => {
          expect(this.rl.output.__raw__).to.contain('(pass)');
          expect(answer).to.equal('pass');
          done();
        });

        this.rl.emit('line', '');
      });

      it('should allow a falsy default value', function (done) {
        this.fixture.default = 0;

        const prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run().then((answer) => {
          expect(this.rl.output.__raw__).to.contain('(0)');
          expect(answer).to.equal(0);
          done();
        });

        this.rl.emit('line', '');
      });
    });
  },

  message() {
    describe('message API', () => {
      it('should print message on screen', function () {
        this.fixture.message = 'Foo bar bar foo bar';

        const prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run();

        expect(this.rl.output.__raw__).to.contain(this.fixture.message);
      });
      it('should default to name for message', function () {
        this.fixture.name = 'testfoobarbarfoobar';
        delete this.fixture.message;

        const prompt = new this.Prompt(this.fixture, this.rl);
        prompt.run();

        expect(this.rl.output.__raw__).to.contain(this.fixture.name + ':');
      });
    });
  },

  choices() {
    describe('choices API', () => {
      it('should print choices to screen', function () {
        const prompt = new this.Prompt(this.fixture, this.rl);
        const { choices } = prompt.opt;

        prompt.run();

        choices.filter(inquirer.Separator.exclude).forEach((choice) => {
          expect(this.rl.output.__raw__).to.contain(choice.name);
        });
      });
    });
  },

  requiredValues() {
    describe('Missing value', () => {
      it('`name` should throw', function () {
        expect(() => {
          delete this.fixture.name;
          return new this.Prompt(this.fixture, this.rl);
        }).to.throw(/name/);
      });
    });
  },
};

// Run tests
describe('Prompt public APIs', () => {
  prompts.forEach((detail) => {
    describe('on ' + detail.name + ' prompt', () => {
      beforeEach(function () {
        this.fixture = { ...fixtures[detail.name] };
        this.Prompt = inquirer.prompt.prompts[detail.name];
        this.rl = new ReadlineStub();
      });

      detail.apis.forEach((apiName) => {
        tests[apiName](detail.name);
      });
    });
  });
});
