import { beforeEach, describe, it } from 'vitest';
import { expect } from 'chai';
import ReadlineStub from '../../helpers/readline.js';
import fixtures from '../../helpers/fixtures.js';

import Rawlist from '../../../lib/prompts/rawlist.js';

describe('`rawlist` prompt', () => {
  let rl;
  let fixture;
  let rawlist;

  beforeEach(() => {
    rl = new ReadlineStub();
    fixture = { ...fixtures.rawlist };
    rawlist = new Rawlist(fixture, rl);
  });

  it('should default to first choice', () =>
    new Promise((done) => {
      rawlist.run().then((answer) => {
        expect(answer).to.equal('foo');
        done();
      });

      rl.emit('line');
    }));

  it('should select given index', () =>
    new Promise((done) => {
      rawlist.run().then((answer) => {
        expect(answer).to.equal('bar');
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
      return new Rawlist({ name: 'foo', message: 'bar' });
    };

    expect(mkPrompt).to.throw(/choices/);
  });

  it('should allow a default index', () =>
    new Promise((done) => {
      fixture.default = 1;
      const list = new Rawlist(fixture, rl);

      list.run().then((answer) => {
        expect(answer).to.equal('bar');
        done();
      });

      rl.emit('line');
    }));

  it("shouldn't allow an invalid index as default", () =>
    new Promise((done) => {
      fixture.default = 4;
      const list = new Rawlist(fixture, rl);

      list.run().then((answer) => {
        expect(answer).to.equal('foo');
        done();
      });

      rl.emit('line');
    }));

  it('should allow string default being the value', () =>
    new Promise((done) => {
      fixture.default = 'bum';
      const list = new Rawlist(fixture, rl);

      list.run().then((answer) => {
        expect(answer).to.equal('bum');
        done();
      });

      rl.emit('line');
    }));

  it("shouldn't allow an invalid string default to change position", () =>
    new Promise((done) => {
      fixture.default = 'bumby';
      const list = new Rawlist(fixture, rl);

      list.run().then((answer) => {
        expect(answer).to.equal('foo');
        done();
      });

      rl.emit('line');
    }));

  it('should allow for arrow navigation', () =>
    new Promise((done) => {
      rawlist.run().then((answer) => {
        expect(answer).to.equal('bar');
        done();
      });

      rl.input.emit('keypress', '', { name: 'down' });
      rl.input.emit('keypress', '', { name: 'down' });
      rl.input.emit('keypress', '', { name: 'up' });
      rl.emit('line', rl.line);
    }));

  it('should allow for arrow navigation after invalid input', () =>
    new Promise((done) => {
      rawlist
        .run()
        .then((answer) => {
          expect(answer).to.equal('bar');
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
        expect(answer).to.equal('bar');
      });

      it('loops to top when too far down', async () => {
        const promise = rawlist.run();
        pressKey('down', 3);
        const answer = await promise;
        expect(answer).to.equal('foo');
      });
    });

    describe('when loop: false', () => {
      beforeEach(() => {
        rawlist = new Rawlist(Object.assign(fixture, { loop: false }), rl);
      });

      it('stays at top when too far up', async () => {
        const promise = rawlist.run();
        pressKey('up', 2);
        const answer = await promise;
        expect(answer).to.equal('foo');
      });

      it('stays at bottom when too far down', async () => {
        const promise = rawlist.run();
        pressKey('down', 3);
        const answer = await promise;
        expect(answer).to.equal('bum');
      });
    });
  });
});
