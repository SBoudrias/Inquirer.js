import { beforeEach, describe, it, expect } from 'vitest';
import ReadlineStub from '../../helpers/readline.js';
import fixtures from '../../helpers/fixtures.js';

import NumberPrompt from '../../../lib/prompts/number.js';

const ACCEPTABLE_ERROR = 0.001;

describe('`number` prompt', () => {
  let fixture;
  let rl;
  let number;

  beforeEach(() => {
    fixture = { ...fixtures.number };
    rl = new ReadlineStub();
    number = new NumberPrompt(fixture, rl);
  });

  it('should parse the largest number', () =>
    new Promise((done) => {
      number.run().then((answer) => {
        expect(answer).toEqual(Number.MAX_SAFE_INTEGER);
        done();
      });

      rl.emit('line', String(Number.MAX_SAFE_INTEGER));
    }));

  it('should parse the smallest number', () =>
    new Promise((done) => {
      number.run().then((answer) => {
        expect(answer).toEqual(Number.MIN_SAFE_INTEGER);
        done();
      });

      rl.emit('line', String(Number.MIN_SAFE_INTEGER));
    }));

  it('should parse an integer', () =>
    new Promise((done) => {
      number.run().then((answer) => {
        expect(answer).toEqual(42);
        done();
      });

      rl.emit('line', '42');
    }));

  it('should parse a negative integer', () =>
    new Promise((done) => {
      number.run().then((answer) => {
        expect(answer).toEqual(-363);
        done();
      });

      rl.emit('line', '-363');
    }));

  it('should parse a positive float', () =>
    new Promise((done) => {
      number.run().then((answer) => {
        expect(answer).toBeCloseTo(4353.43, ACCEPTABLE_ERROR);
        done();
      });

      rl.emit('line', '4353.43');
    }));

  it('should parse a negative float', () =>
    new Promise((done) => {
      number.run().then((answer) => {
        expect(answer).toBeCloseTo(-4353.43, ACCEPTABLE_ERROR);
        done();
      });

      rl.emit('line', '-4353.43');
    }));

  it('should parse a float with no digits before the decimal', () =>
    new Promise((done) => {
      number.run().then((answer) => {
        expect(answer).toBeCloseTo(0.01264, ACCEPTABLE_ERROR);
        done();
      });

      rl.emit('line', '.01264');
    }));

  it('should parse a float with no digits after the decimal', () =>
    new Promise((done) => {
      number.run().then((answer) => {
        expect(answer).toBeCloseTo(1234.0, ACCEPTABLE_ERROR);
        done();
      });

      rl.emit('line', '1234.');
    }));

  it('should parse a float with exponents', () =>
    new Promise((done) => {
      number.run().then((answer) => {
        expect(answer).toBeCloseTo(534e12, ACCEPTABLE_ERROR);
        done();
      });

      rl.emit('line', '534e12');
    }));

  it('should parse any other string as NaN', () =>
    new Promise((done) => {
      number.run().then((answer) => {
        expect(answer).toBeNaN();
        done();
      });

      rl.emit('line', 'The cat');
    }));

  it('should parse the empty string as NaN', () =>
    new Promise((done) => {
      number.run().then((answer) => {
        expect(answer).toBeNaN();
        done();
      });

      rl.emit('line', '');
    }));

  it('should return default value if it is set on a bad input', () =>
    new Promise((done) => {
      number.opt.default = 11;
      number.run().then((answer) => {
        expect(answer).toEqual(11);
        done();
      });

      rl.input.emit('keypress', 'a', { name: 'a' });
      rl.emit('line');
    }));
});
