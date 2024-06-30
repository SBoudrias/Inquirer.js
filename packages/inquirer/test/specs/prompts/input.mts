import { describe, it, beforeEach, expect } from 'vitest';
import ReadlineStub from '../../helpers/readline.mjs';
import fixtures from '../../helpers/fixtures.mjs';
import Input from '../../../src/prompts/input.mjs';

describe('`input` prompt', () => {
  let fixture;
  let rl;

  beforeEach(function () {
    fixture = { ...fixtures.input };
    rl = new ReadlineStub();
  });

  it('should use raw value from the user', () =>
    new Promise<void>((done) => {
      const input = new Input(fixture, rl);

      input.run().then((answer) => {
        expect(answer).toEqual('Inquirer');
        done();
      });

      rl.emit('line', 'Inquirer');
    }));

  it('should output filtered value', function () {
    fixture.filter = function () {
      return 'pass';
    };

    const prompt = new Input(fixture, rl);
    const promise = prompt.run();
    rl.emit('line', '');

    return promise.then(() => {
      expect(rl.output.__raw__).toContain('pass');
    });
  });

  it('should apply the provided transform to the value', () =>
    new Promise<void>((done) => {
      fixture.transformer = function (value) {
        return [...value].reverse().join('');
      };

      const prompt = new Input(fixture, rl);
      prompt.run();

      rl.line = 'Inquirer';
      rl.input.emit('keypress');

      setTimeout(() => {
        expect(rl.output.__raw__).toContain('reriuqnI');
        done();
      }, 10);
    }));

  it('should use the answers object in the provided transformer', () =>
    new Promise<void>((done) => {
      fixture.transformer = function (value, answers) {
        return answers.capitalize ? value.toUpperCase() : value;
      };

      const answers = {
        capitalize: true,
      };

      const prompt = new Input(fixture, rl, answers);
      prompt.run();

      rl.line = 'inquirer';
      rl.input.emit('keypress');

      setTimeout(() => {
        expect(rl.output.__raw__).toContain('INQUIRER');
        done();
      }, 200);
    }));

  it('should use the flags object in the provided transformer', () =>
    new Promise<void>((done) => {
      fixture.transformer = function (value, answers, flags) {
        const text = answers.capitalize ? value.toUpperCase() : value;
        if (flags.isFinal) return text + '!';
        return text;
      };

      const answers = {
        capitalize: true,
      };

      const prompt = new Input(fixture, rl, answers);
      prompt.run();

      rl.line = 'inquirer';
      rl.input.emit('keypress');
      setTimeout(() => {
        expect(rl.output.__raw__).toContain('INQUIRER');
        done();
      }, 200);
    }));

  it('should clear default on input', () =>
    new Promise<void>((done) => {
      const defaultValue = 'default-string';
      const input = new Input(
        {
          ...fixture,
          default: defaultValue,
        },
        rl,
      );

      input.run();

      rl.line = 'inquirer';
      rl.input.emit('keypress');
      setTimeout(() => {
        expect(rl.output.__raw__).toContain(defaultValue);
        done();
      }, 200);
    }));
});
