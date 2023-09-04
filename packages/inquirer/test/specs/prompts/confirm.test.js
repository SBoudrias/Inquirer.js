import { beforeEach, describe, it, expect } from 'vitest';
import ReadlineStub from '../../helpers/readline.js';
import fixtures from '../../helpers/fixtures.js';

import Confirm from '../../../lib/prompts/confirm.js';

describe('`confirm` prompt', () => {
  let fixture;
  let rl;
  let confirm;

  beforeEach(() => {
    fixture = { ...fixtures.confirm };
    rl = new ReadlineStub();
    confirm = new Confirm(fixture, rl);
  });

  it('should default to true', () =>
    new Promise((done) => {
      confirm.run().then((answer) => {
        expect(rl.output.__raw__).toContain('Y/n');
        expect(answer).toEqual(true);
        done();
      });

      rl.emit('line', '');
    }));

  it('should allow a default `false` value', () =>
    new Promise((done) => {
      fixture.default = false;
      const falseConfirm = new Confirm(fixture, rl);

      falseConfirm.run().then((answer) => {
        expect(rl.output.__raw__).toContain('y/N');
        expect(answer).toEqual(false);
        done();
      });

      rl.emit('line', '');
    }));

  it('should allow a default `true` value', () =>
    new Promise((done) => {
      fixture.default = true;
      const falseConfirm = new Confirm(fixture, rl);

      falseConfirm.run().then((answer) => {
        expect(rl.output.__raw__).toContain('Y/n');
        expect(answer).toEqual(true);
        done();
      });

      rl.emit('line', '');
    }));

  it("should parse 'Y' value to boolean true", () =>
    new Promise((done) => {
      confirm.run().then((answer) => {
        expect(answer).toEqual(true);
        done();
      });

      rl.emit('line', 'Y');
    }));

  it("should parse 'Yes' value to boolean true", () =>
    new Promise((done) => {
      confirm.run().then((answer) => {
        expect(answer).toEqual(true);
        done();
      });

      rl.emit('line', 'Yes');
    }));

  it("should parse 'N' value to boolean false", () =>
    new Promise((done) => {
      confirm.run().then((answer) => {
        expect(answer).toEqual(false);
        done();
      });

      rl.emit('line', 'N');
    }));

  it("should parse 'No' value to boolean false", () =>
    new Promise((done) => {
      confirm.run().then((answer) => {
        expect(answer).toEqual(false);
        done();
      });

      rl.emit('line', 'No');
    }));

  it('should parse every other string value to default (unset)', () =>
    new Promise((done) => {
      confirm.run().then((answer) => {
        expect(answer).toEqual(true);
        done();
      });

      rl.emit('line', 'bla bla foo');
    }));

  it('should parse every other string value to default (true)', () =>
    new Promise((done) => {
      fixture.default = true;
      const trueConfirm = new Confirm(fixture, rl);

      trueConfirm.run().then((answer) => {
        expect(answer).toEqual(true);
        done();
      });

      rl.emit('line', 'bla bla foo');
    }));

  it('should parse every other string value to default (false)', () =>
    new Promise((done) => {
      fixture.default = false;
      const falseConfirm = new Confirm(fixture, rl);

      falseConfirm.run().then((answer) => {
        expect(answer).toEqual(false);
        done();
      });

      rl.emit('line', 'bla bla foo');
    }));

  it('should tranform the output based on the boolean value', () =>
    new Promise((done) => {
      fixture.transformer = (value) => (value ? '👍' : '👎');
      const confirmOutput = new Confirm(fixture, rl);
      confirmOutput
        .run()
        .then((answer) => {
          expect(answer).toEqual('👍');
          done();
        })
        .catch((err) => console.log(err));

      rl.emit('line', 'y');
    }));
});
