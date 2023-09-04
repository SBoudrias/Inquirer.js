import { vi, expect, beforeEach, describe, it } from 'vitest';
import ReadlineStub from '../../helpers/readline.js';
import fixtures from '../../helpers/fixtures.js';

import List from '../../../lib/prompts/list.js';

describe('`list` prompt', () => {
  let fixture;
  let rl;
  // let list;

  beforeEach(() => {
    fixture = { ...fixtures.list };
    rl = new ReadlineStub();
    // list = new List(fixture, rl);
  });

  it('should default to first choice', () =>
    new Promise((done) => {
      const list = new List(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('foo');
        done();
      });

      rl.emit('line');
    }));

  it('should move selected cursor on keypress', () =>
    new Promise((done) => {
      const list = new List(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('bar');
        done();
      });

      rl.input.emit('keypress', '', { name: 'down' });
      rl.emit('line');
    }));

  it('should allow for arrow navigation', () =>
    new Promise((done) => {
      const list = new List(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('bar');
        done();
      });

      rl.input.emit('keypress', '', { name: 'down' });
      rl.input.emit('keypress', '', { name: 'down' });
      rl.input.emit('keypress', '', { name: 'up' });
      rl.emit('line');
    }));

  it('should allow for vi-style navigation', () =>
    new Promise((done) => {
      const list = new List(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('bar');
        done();
      });

      rl.input.emit('keypress', 'j', { name: 'j' });
      rl.input.emit('keypress', 'j', { name: 'j' });
      rl.input.emit('keypress', 'k', { name: 'k' });
      rl.emit('line');
    }));

  it('should allow for emacs-style navigation', () =>
    new Promise((done) => {
      const list = new List(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('bar');
        done();
      });

      rl.input.emit('keypress', 'n', { name: 'n', ctrl: true });
      rl.input.emit('keypress', 'n', { name: 'n', ctrl: true });
      rl.input.emit('keypress', 'p', { name: 'p', ctrl: true });
      rl.emit('line');
    }));

  describe('going out of boundaries', () => {
    let pressKey;

    beforeEach(() => {
      pressKey = function (dir, times) {
        for (let i = 0; i < times; i++) {
          rl.input.emit('keypress', '', { name: dir });
        }
        rl.emit('line');
      };
    });

    describe('when loop undefined / true', () => {
      it('loops to bottom when too far up', async () => {
        const list = new List(fixture, rl);
        const promise = list.run();
        pressKey('up', 2);
        const answer = await promise;
        expect(answer).toEqual('bar');
      });

      it('loops to top when too far down', async () => {
        const list = new List(fixture, rl);
        const promise = list.run();
        pressKey('down', 3);
        const answer = await promise;
        expect(answer).toEqual('foo');
      });
    });

    describe('when loop: false', () => {
      it('stays at top when too far up', async () => {
        const list = new List(Object.assign(fixture, { loop: false }), rl);
        const promise = list.run();
        pressKey('up', 2);
        const answer = await promise;
        expect(answer).toEqual('foo');
      });

      it('stays at bottom when too far down', async () => {
        const list = new List(Object.assign(fixture, { loop: false }), rl);
        const promise = list.run();
        pressKey('down', 3);
        const answer = await promise;
        expect(answer).toEqual('bum');
      });
    });
  });

  it('should require a choices array', () => {
    expect(() => new List({ name: 'foo', message: 'bar' })).toThrow(/choices/);
  });

  it('should allow a numeric default', () =>
    new Promise((done) => {
      fixture.default = 1;
      const list = new List(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('bar');
        done();
      });

      rl.emit('line');
    }));

  it('should work from a numeric default being the index', () =>
    new Promise((done) => {
      fixture.default = 1;
      const list = new List(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('bum');
        done();
      });

      rl.input.emit('keypress', '', { name: 'down' });
      rl.emit('line');
    }));

  it('should allow a string default being the value', () =>
    new Promise((done) => {
      fixture.default = 'bar';
      const list = new List(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('bar');
        done();
      });

      rl.emit('line');
    }));

  it('should work from a string default', () =>
    new Promise((done) => {
      fixture.default = 'bar';
      const list = new List(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('bum');
        done();
      });

      rl.input.emit('keypress', '', { name: 'down' });
      rl.emit('line');
    }));

  it("shouldn't allow an invalid string default to change position", () =>
    new Promise((done) => {
      fixture.default = 'babar';
      const list = new List(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('foo');
        done();
      });

      rl.emit('line');
    }));

  it("shouldn't allow an invalid index as default", () =>
    new Promise((done) => {
      fixture.default = 4;
      const list = new List(fixture, rl);

      list.run().then((answer) => {
        expect(answer).toEqual('foo');
        done();
      });

      rl.emit('line');
    }));

  it('should allow 1-9 shortcut key', () =>
    new Promise((done) => {
      const list = new List(fixture, rl);
      list.run().then((answer) => {
        expect(answer).toEqual('bar');
        done();
      });

      rl.input.emit('keypress', '2');
      rl.emit('line');
    }));

  it('pagination works with multiline choices', () =>
    new Promise((done) => {
      const multilineFixture = {
        message: 'message',
        name: 'name',
        choices: ['a\n\n', 'b\n\n'],
      };
      const list = new List(multilineFixture, rl);
      const spy = vi.spyOn(list.paginator, 'paginate');
      list.run().then((answer) => {
        const realIndexPosition1 = spy.mock.calls[0][1];
        const realIndexPosition2 = spy.mock.calls[1][1];

        // 'a\n\n': 0th index, but pagination at 2nd index position due to 2 extra newlines
        expect(realIndexPosition1).toEqual(2);
        // 'b\n\n': 1st index, but pagination at 5th index position due to 4 extra newlines
        expect(realIndexPosition2).toEqual(5);
        expect(answer).toEqual('b\n\n');
        done();
      });
      rl.input.emit('keypress', '', { name: 'down' });
      rl.emit('line');
    }));

  it('paginator uses non infinite version with loop:false', () => {
    const list = new List(
      {
        name: 'numbers',
        choices: [1, 2, 3],
        loop: false,
      },
      rl,
    );
    expect(list.paginator.isInfinite).equal(false);
  });

  it('should provide answers in the "filter" callback option', () =>
    new Promise((done) => {
      const answers = {};
      fixture.filter = function () {
        return true;
      };
      vi.spyOn(fixture, 'filter');

      const list = new List(fixture, rl, answers);

      list.run().then(() => {
        const spyCall = fixture.filter.mock.calls[0];
        expect(spyCall[1]).toEqual(answers);
        done();
      });

      rl.emit('line');
    }));
});
