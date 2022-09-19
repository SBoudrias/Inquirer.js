import chai, { expect } from 'chai';
import chaiString from 'chai-string';
import ReadlineStub from '../../helpers/readline.js';
import fixtures from '../../helpers/fixtures.js';

import Input from '../../../lib/prompts/input.js';

chai.use(chaiString);

describe('`input` prompt', () => {
  beforeEach(function () {
    this.fixture = { ...fixtures.input };
    this.rl = new ReadlineStub();
  });

  it('should use raw value from the user', function (done) {
    const input = new Input(this.fixture, this.rl);

    input.run().then((answer) => {
      expect(answer).to.equal('Inquirer');
      done();
    });

    this.rl.emit('line', 'Inquirer');
  });

  it('should output filtered value', function () {
    this.fixture.filter = function () {
      return 'pass';
    };

    const prompt = new Input(this.fixture, this.rl);
    const promise = prompt.run();
    this.rl.emit('line', '');

    return promise.then(() => {
      expect(this.rl.output.__raw__).to.contain('pass');
    });
  });

  it('should apply the provided transform to the value', function (done) {
    this.fixture.transformer = function (value) {
      return value.split('').reverse().join('');
    };

    const prompt = new Input(this.fixture, this.rl);
    prompt.run();

    this.rl.line = 'Inquirer';
    this.rl.input.emit('keypress');

    setTimeout(() => {
      expect(this.rl.output.__raw__).to.contain('reriuqnI');
      done();
    }, 10);
  });

  it('should use the answers object in the provided transformer', function (done) {
    this.fixture.transformer = function (value, answers) {
      return answers.capitalize ? value.toUpperCase() : value;
    };

    const answers = {
      capitalize: true,
    };

    const prompt = new Input(this.fixture, this.rl, answers);
    prompt.run();

    this.rl.line = 'inquirer';
    this.rl.input.emit('keypress');

    setTimeout(() => {
      expect(this.rl.output.__raw__).to.contain('INQUIRER');
      done();
    }, 200);
  });

  it('should use the flags object in the provided transformer', function (done) {
    this.fixture.transformer = function (value, answers, flags) {
      const text = answers.capitalize ? value.toUpperCase() : value;
      if (flags.isFinal) return text + '!';
      return text;
    };

    const answers = {
      capitalize: true,
    };

    const prompt = new Input(this.fixture, this.rl, answers);
    prompt.run();

    this.rl.line = 'inquirer';
    this.rl.input.emit('keypress');
    setTimeout(() => {
      expect(this.rl.output.__raw__).to.contain('INQUIRER');
      done();
    }, 200);
  });

  it('should clear default on input', function (done) {
    const defaultValue = 'default-string';
    const input = new Input(
      {
        ...this.fixture,
        default: defaultValue,
      },
      this.rl
    );

    input.run();

    this.rl.line = 'inquirer';
    this.rl.input.emit('keypress');
    setTimeout(() => {
      expect(this.rl.output.__raw__).to.have.entriesCount(defaultValue, 1);
      done();
    }, 200);
  });
});
