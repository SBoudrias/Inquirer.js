const { expect } = require('chai');
const _ = require('lodash');
const ReadlineStub = require('../../helpers/readline');
const fixtures = require('../../helpers/fixtures');

const Rawlist = require('../../../lib/prompts/rawlist');

describe('`rawlist` prompt', () => {
  beforeEach(function () {
    this.rl = new ReadlineStub();
    this.fixture = _.clone(fixtures.rawlist);
    this.rawlist = new Rawlist(this.fixture, this.rl);
  });

  it('should default to first choice', function (done) {
    this.rawlist.run().then((answer) => {
      expect(answer).to.equal('foo');
      done();
    });

    this.rl.emit('line');
  });

  it('should select given index', function (done) {
    this.rawlist.run().then((answer) => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.emit('line', '2');
  });

  it('should not allow invalid index', function () {
    const self = this;
    const promise = this.rawlist.run();

    this.rl.emit('line', 'blah');
    setTimeout(() => {
      self.rl.emit('line', '1');
    }, 10);

    return promise;
  });

  it('should require a choices array', () => {
    const mkPrompt = function () {
      return new Rawlist({ name: 'foo', message: 'bar' });
    };

    expect(mkPrompt).to.throw(/choices/);
  });

  it('should allow a default index', function (done) {
    this.fixture.default = 1;
    const list = new Rawlist(this.fixture, this.rl);

    list.run().then((answer) => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.emit('line');
  });

  it("shouldn't allow an invalid index as default", function (done) {
    this.fixture.default = 4;
    const list = new Rawlist(this.fixture, this.rl);

    list.run().then((answer) => {
      expect(answer).to.equal('foo');
      done();
    });

    this.rl.emit('line');
  });

  it('should allow string default being the value', function (done) {
    this.fixture.default = 'bum';
    const list = new Rawlist(this.fixture, this.rl);

    list.run().then((answer) => {
      expect(answer).to.equal('bum');
      done();
    });

    this.rl.emit('line');
  });

  it("shouldn't allow an invalid string default to change position", function (done) {
    this.fixture.default = 'bumby';
    const list = new Rawlist(this.fixture, this.rl);

    list.run().then((answer) => {
      expect(answer).to.equal('foo');
      done();
    });

    this.rl.emit('line');
  });

  it('should allow for arrow navigation', function (done) {
    this.rawlist.run().then((answer) => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.input.emit('keypress', '', { name: 'up' });
    this.rl.emit('line', this.rl.line);
  });

  it('should allow for arrow navigation after invalid input', function (done) {
    this.rawlist
      .run()
      .then((answer) => {
        expect(answer).to.equal('bar');
        done();
      })
      .catch(done);

    this.rl.emit('line', 'blah');
    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.input.emit('keypress', '', { name: 'up' });
    this.rl.emit('line', this.rl.line);
  });

  describe('going out of boundaries', () => {
    beforeEach(function () {
      this.pressKey = function (dir, times) {
        for (let i = 0; i < times; i++) {
          this.rl.input.emit('keypress', '', { name: dir });
        }
        this.rl.emit('line', this.rl.line);
      };
    });
    describe('when loop undefined / true', () => {
      it('loops to bottom when too far up', async function () {
        const promise = this.rawlist.run();
        this.pressKey('up', 2);
        const answer = await promise;
        expect(answer).to.equal('bar');
      });
      it('loops to top when too far down', async function () {
        const promise = this.rawlist.run();
        this.pressKey('down', 3);
        const answer = await promise;
        expect(answer).to.equal('foo');
      });
    });

    describe('when loop: false', () => {
      beforeEach(function () {
        this.rawlist = new Rawlist(_.assign(this.fixture, { loop: false }), this.rl);
      });
      it('stays at top when too far up', async function () {
        const promise = this.rawlist.run();
        this.pressKey('up', 2);
        const answer = await promise;
        expect(answer).to.equal('foo');
      });
      it('stays at bottom when too far down', async function () {
        const promise = this.rawlist.run();
        this.pressKey('down', 3);
        const answer = await promise;
        expect(answer).to.equal('bum');
      });
    });
  });
});
