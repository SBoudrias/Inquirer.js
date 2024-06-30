import { beforeEach, describe, it, expect } from 'vitest';
import ReadlineStub from '../../helpers/readline.mjs';
import fixtures from '../../helpers/fixtures.mjs';
import Rawlist from '../../../src/prompts/rawlist.mjs';

describe('`rawlist` prompt', () => {
  let rl;
  let fixture;
  let rawlist;

  beforeEach(() => {
    rl = new ReadlineStub();
    fixture = { ...fixtures.rawlist };
    // @ts-expect-error 2024-06-29
    rawlist = new Rawlist(fixture, rl);
  });

  it('should default to first choice', () =>
    new Promise<void>((done) => {
      rawlist.run().then((answer) => {
        expect(answer).toEqual('foo');
        done();
      });

      rl.emit('line');
    }));

  it('should select given index', () =>
    new Promise<void>((done) => {
      rawlist.run().then((answer) => {
        expect(answer).toEqual('bar');
        done();
      });

      rl.emit('line', '2');
    }));

  it('should not allow invalid index', () => {
    const promise = rawlist.run();

    rl.emit('line', 'blah');
    setTimeout(() => {
      rl.emit('line', '1');
    }, 10);

    return promise;
  });

  it('should require a choices array', () => {
    const mkPrompt = function () {
      // @ts-expect-error 2024-06-29
      return new Rawlist({ name: 'foo', message: 'bar' });
    };

    expect(mkPrompt).toThrow(/choices/);
  });

  it('should allow a default index', () =>
    new Promise<void>((done) => {
      fixture.default = 1;
      // @ts-expect-error 2024-06-29
      const list = new Rawlist(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('bar');
        done();
      });

      rl.emit('line');
    }));

  it("shouldn't allow an invalid index as default", () =>
    new Promise<void>((done) => {
      fixture.default = 4;
      // @ts-expect-error 2024-06-29
      const list = new Rawlist(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('foo');
        done();
      });

      rl.emit('line');
    }));

  it('should allow string default being the value', () =>
    new Promise<void>((done) => {
      fixture.default = 'bum';
      // @ts-expect-error 2024-06-29
      const list = new Rawlist(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('bum');
        done();
      });

      rl.emit('line');
    }));

  it("shouldn't allow an invalid string default to change position", () =>
    new Promise<void>((done) => {
      fixture.default = 'bumby';
      // @ts-expect-error 2024-06-29
      const list = new Rawlist(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('foo');
        done();
      });

      rl.emit('line');
    }));

  it('should allow for arrow navigation', () =>
    new Promise<void>((done) => {
      rawlist.run().then((answer) => {
        expect(answer).toEqual('bar');
        done();
      });

      rl.input.emit('keypress', '', { name: 'down' });
      rl.input.emit('keypress', '', { name: 'down' });
      rl.input.emit('keypress', '', { name: 'up' });
      rl.emit('line', rl.line);
    }));

  it('should allow for arrow navigation after invalid input', () =>
    new Promise<void>((done) => {
      rawlist
        .run()
        .then((answer) => {
          expect(answer).toEqual('bar');
          done();
        })
        .catch(done);

      rl.emit('line', 'blah');
      rl.input.emit('keypress', '', { name: 'down' });
      rl.input.emit('keypress', '', { name: 'down' });
      rl.input.emit('keypress', '', { name: 'up' });
      rl.emit('line', rl.line);
    }));

  describe('going out of boundaries', () => {
    let pressKey;

    beforeEach(() => {
      pressKey = function (dir, times) {
        for (let i = 0; i < times; i++) {
          rl.input.emit('keypress', '', { name: dir });
        }
        rl.emit('line', rl.line);
      };
    });

    describe('when loop undefined / true', () => {
      it('loops to bottom when too far up', async () => {
        const promise = rawlist.run();
        pressKey('up', 2);
        const answer = await promise;
        expect(answer).toEqual('bar');
      });

      it('loops to top when too far down', async () => {
        const promise = rawlist.run();
        pressKey('down', 3);
        const answer = await promise;
        expect(answer).toEqual('foo');
      });
    });

    describe('when loop: false', () => {
      beforeEach(() => {
        // @ts-expect-error 2024-06-29
        rawlist = new Rawlist(Object.assign(fixture, { loop: false }), rl);
      });

      it('stays at top when too far up', async () => {
        const promise = rawlist.run();
        pressKey('up', 2);
        const answer = await promise;
        expect(answer).toEqual('foo');
      });

      it('stays at bottom when too far down', async () => {
        const promise = rawlist.run();
        pressKey('down', 3);
        const answer = await promise;
        expect(answer).toEqual('bum');
      });
    });
  });
});
