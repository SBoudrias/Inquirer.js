import { beforeEach, describe, it, expect } from 'vitest';
import ReadlineStub from '../../helpers/readline.mjs';
import fixtures from '../../helpers/fixtures.mjs';

import Confirm from '../../../src/prompts/confirm.mjs';

describe('`confirm` prompt', () => {
  let fixture;
  let rl;
  let confirm;

  beforeEach(() => {
    fixture = { ...fixtures.confirm };
    rl = new ReadlineStub();
    // @ts-expect-error 2024-06-29
    confirm = new Confirm(fixture, rl);
  });

  it('should default to true', () =>
    new Promise<void>((done) => {
      confirm.run().then((answer) => {
        expect(rl.output.__raw__).toContain('Y/n');
        expect(answer).toEqual(true);
        done();
      });

      rl.emit('line', '');
    }));

  it('should allow a default `false` value', () =>
    new Promise<void>((done) => {
      fixture.default = false;
      // @ts-expect-error 2024-06-29
      const falseConfirm = new Confirm(fixture, rl);

      falseConfirm.run().then((answer) => {
        expect(rl.output.__raw__).toContain('y/N');
        expect(answer).toEqual(false);
        done();
      });

      rl.emit('line', '');
    }));

  it('should allow a default `true` value', () =>
    new Promise<void>((done) => {
      fixture.default = true;
      // @ts-expect-error 2024-06-29
      const falseConfirm = new Confirm(fixture, rl);

      falseConfirm.run().then((answer) => {
        expect(rl.output.__raw__).toContain('Y/n');
        expect(answer).toEqual(true);
        done();
      });

      rl.emit('line', '');
    }));

  it("should parse 'Y' value to boolean true", () =>
    new Promise<void>((done) => {
      confirm.run().then((answer) => {
        expect(answer).toEqual(true);
        done();
      });

      rl.emit('line', 'Y');
    }));

  it("should parse 'Yes' value to boolean true", () =>
    new Promise<void>((done) => {
      confirm.run().then((answer) => {
        expect(answer).toEqual(true);
        done();
      });

      rl.emit('line', 'Yes');
    }));

  it("should parse 'N' value to boolean false", () =>
    new Promise<void>((done) => {
      confirm.run().then((answer) => {
        expect(answer).toEqual(false);
        done();
      });

      rl.emit('line', 'N');
    }));

  it("should parse 'No' value to boolean false", () =>
    new Promise<void>((done) => {
      confirm.run().then((answer) => {
        expect(answer).toEqual(false);
        done();
      });

      rl.emit('line', 'No');
    }));

  it('should parse every other string value to default (unset)', () =>
    new Promise<void>((done) => {
      confirm.run().then((answer) => {
        expect(answer).toEqual(true);
        done();
      });

      rl.emit('line', 'bla bla foo');
    }));

  it('should parse every other string value to default (true)', () =>
    new Promise<void>((done) => {
      fixture.default = true;
      // @ts-expect-error 2024-06-29
      const trueConfirm = new Confirm(fixture, rl);

      trueConfirm.run().then((answer) => {
        expect(answer).toEqual(true);
        done();
      });

      rl.emit('line', 'bla bla foo');
    }));

  it('should parse every other string value to default (false)', () =>
    new Promise<void>((done) => {
      fixture.default = false;
      // @ts-expect-error 2024-06-29
      const falseConfirm = new Confirm(fixture, rl);

      falseConfirm.run().then((answer) => {
        expect(answer).toEqual(false);
        done();
      });

      rl.emit('line', 'bla bla foo');
    }));

  it('should tranform the output based on the boolean value', () =>
    new Promise<void>((done) => {
      fixture.transformer = (value) => (value ? '👍' : '👎');
      // @ts-expect-error 2024-06-29
      const confirmOutput = new Confirm(fixture, rl);
      confirmOutput
        .run()
        .then((answer) => {
          expect(answer).toEqual('👍');
          done();
        })
        .catch((error) => console.log(error));

      rl.emit('line', 'y');
    }));
});
