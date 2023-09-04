/**
 * Test Prompt public APIs
 */

import { beforeEach, describe, it, expect } from 'vitest';
import fixtures from '../helpers/fixtures.js';
import ReadlineStub from '../helpers/readline.js';
import inquirer from '../../lib/inquirer.js';
import { autosubmit } from '../helpers/events.js';

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
  filter(ctx) {
    describe('filter API', () => {
      it('should filter the user input', () =>
        new Promise((done) => {
          ctx.fixture.filter = function () {
            return 'pass';
          };

          const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
          prompt.run().then((answer) => {
            expect(answer).toEqual('pass');
            done();
          });

          ctx.rl.emit('line', '');
        }));

      it('should allow filter function to be asynchronous', () =>
        new Promise((resolve) => {
          ctx.fixture.filter = function () {
            const done = this.async();
            setTimeout(() => {
              done(null, 'pass');
            }, 0);
          };

          const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
          prompt.run().then((answer) => {
            expect(answer).toEqual('pass');
            resolve();
          });

          ctx.rl.emit('line', '');
        }));

      it('should handle errors produced in async filters', () => {
        let called = 0;
        const { rl } = ctx;

        ctx.fixture.filter = function () {
          called++;
          const cb = this.async();

          if (called === 2) {
            return cb(null, 'pass');
          }

          rl.emit('line');
          return cb(new Error('fail'));
        };

        const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
        const promise = prompt.run();

        ctx.rl.emit('line');
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
              expect(answers.q1).toEqual(true);
              return input;
            },
            default: false,
          },
        ];

        const promise = prompt(questions);
        autosubmit(promise.ui);

        return promise.then((answers) => {
          expect(answers.q1).toEqual(true);
          expect(answers.q2).toEqual(false);
        });
      });
    });
  },

  validate(ctx) {
    describe('validate API', () => {
      it('should reject input if boolean false is returned', () => {
        let called = 0;

        ctx.fixture.validate = () => {
          called++;
          // Make sure returning false won't continue
          if (called === 2) {
            return true;
          }

          ctx.rl.emit('line');
          return false;
        };

        const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
        const promise = prompt.run();

        ctx.rl.emit('line');
        return promise;
      });

      it('should reject input if a string is returned', (done) => {
        let called = 0;
        const errorMessage = 'uh oh, error!';

        ctx.fixture.validate = function () {
          called++;
          // Make sure returning false won't continue
          if (called === 2) {
            done();
            return;
          }

          ctx.rl.emit('line');
          return errorMessage;
        };

        const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
        prompt.run();

        ctx.rl.emit('line');
      });

      it('should reject input if a Promise is returned which rejects', (done) => {
        let called = 0;
        const errorMessage = 'uh oh, error!';

        ctx.fixture.validate = function () {
          called++;
          // Make sure returning false won't continue
          if (called === 2) {
            done();
            return;
          }

          ctx.rl.emit('line');
          return Promise.reject(errorMessage);
        };

        const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
        prompt.run();

        ctx.rl.emit('line');
      });

      it('should accept input if boolean true is returned', () => {
        let called = 0;

        ctx.fixture.validate = function () {
          called++;
          return true;
        };

        const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
        const promise = prompt.run().then(() => {
          expect(called).toEqual(1);
        });

        ctx.rl.emit('line');
        return promise;
      });

      it('should allow validate function to be asynchronous', () => {
        let called = 0;

        ctx.fixture.validate = function () {
          const done = this.async();
          setTimeout(() => {
            called++;
            // Make sure returning false won't continue
            if (called === 2) {
              done(null, true);
            } else {
              ctx.rl.emit('line');
            }

            done(false);
          }, 0);
        };

        const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
        const promise = prompt.run();

        ctx.rl.emit('line');
        return promise;
      });

      it('should allow validate function to return a Promise', () => {
        ctx.fixture.validate = function () {
          return Promise.resolve(true);
        };

        const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
        const promise = prompt.run();

        ctx.rl.emit('line');
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
              expect(answers.q1).toEqual(true);
              return true;
            },
            default: false,
          },
        ];

        const promise = prompt(questions);
        autosubmit(promise.ui);

        return promise.then((answers) => {
          expect(answers.q1).toEqual(true);
          expect(answers.q2).toEqual(false);
        });
      });
    });
  },

  default(ctx) {
    describe('default API', () => {
      it('should allow a default value', () =>
        new Promise((done) => {
          ctx.fixture.default = 'pass';

          const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
          prompt.run().then((answer) => {
            expect(ctx.rl.output.__raw__).toContain('(pass)');
            expect(answer).toEqual('pass');
            done();
          });

          ctx.rl.emit('line', '');
        }));

      it('should allow a falsy default value', () =>
        new Promise((done) => {
          ctx.fixture.default = 0;

          const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
          prompt.run().then((answer) => {
            expect(ctx.rl.output.__raw__).toContain('(0)');
            expect(answer).toEqual(0);
            done();
          });

          ctx.rl.emit('line', '');
        }));
    });
  },

  message(ctx) {
    describe('message API', () => {
      it('should print message on screen', () => {
        ctx.fixture.message = 'Foo bar bar foo bar';

        const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
        prompt.run();

        expect(ctx.rl.output.__raw__).toContain(ctx.fixture.message);
      });
      it('should default to name for message', () => {
        ctx.fixture.name = 'testfoobarbarfoobar';
        delete ctx.fixture.message;

        const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
        prompt.run();

        expect(ctx.rl.output.__raw__).toContain(ctx.fixture.name + ':');
      });
    });
  },

  choices(ctx) {
    describe('choices API', () => {
      it('should print choices to screen', () => {
        const prompt = new ctx.Prompt(ctx.fixture, ctx.rl);
        const { choices } = prompt.opt;

        prompt.run();

        choices.filter(inquirer.Separator.exclude).forEach((choice) => {
          expect(ctx.rl.output.__raw__).toContain(choice.name);
        });
      });
    });
  },

  requiredValues(ctx) {
    describe('Missing value', () => {
      it('`name` should throw', () => {
        expect(() => {
          delete ctx.fixture.name;
          return new ctx.Prompt(ctx.fixture, ctx.rl);
        }).toThrow(/name/);
      });
    });
  },
};

// Run tests
describe('Prompt public APIs', () => {
  prompts.forEach((detail) => {
    describe('on ' + detail.name + ' prompt', () => {
      const ctx = {};

      beforeEach(() => {
        ctx.fixture = { ...fixtures[detail.name] };
        ctx.Prompt = inquirer.prompt.prompts[detail.name];
        ctx.rl = new ReadlineStub();
      });

      detail.apis.forEach((apiName) => {
        tests[apiName](ctx);
      });
    });
  });
});
