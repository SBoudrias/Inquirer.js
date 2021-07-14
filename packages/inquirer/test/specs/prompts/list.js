const { expect } = require('chai');
const _ = require('lodash');
const ReadlineStub = require('../../helpers/readline');
const fixtures = require('../../helpers/fixtures');
const sinon = require('sinon');

const List = require('../../../lib/prompts/list');

describe('`list` prompt', () => {
  beforeEach(function () {
    this.fixture = _.clone(fixtures.list);
    this.rl = new ReadlineStub();
    this.list = new List(this.fixture, this.rl);
  });

  it('should default to first choice', function (done) {
    this.list.run().then((answer) => {
      expect(answer).to.equal('foo');
      done();
    });

    this.rl.emit('line');
  });

  it('should move selected cursor on keypress', function (done) {
    this.list.run().then((answer) => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.emit('line');
  });

  it('should allow for arrow navigation', function (done) {
    this.list.run().then((answer) => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.input.emit('keypress', '', { name: 'up' });
    this.rl.emit('line');
  });

  it('should allow for vi-style navigation', function (done) {
    this.list.run().then((answer) => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.input.emit('keypress', 'j', { name: 'j' });
    this.rl.input.emit('keypress', 'j', { name: 'j' });
    this.rl.input.emit('keypress', 'k', { name: 'k' });
    this.rl.emit('line');
  });

  it('should allow for emacs-style navigation', function (done) {
    this.list.run().then((answer) => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.input.emit('keypress', 'n', { name: 'n', ctrl: true });
    this.rl.input.emit('keypress', 'n', { name: 'n', ctrl: true });
    this.rl.input.emit('keypress', 'p', { name: 'p', ctrl: true });
    this.rl.emit('line');
  });

  describe('going out of boundaries', () => {
    beforeEach(function () {
      this.pressKey = function (dir, times) {
        for (let i = 0; i < times; i++) {
          this.rl.input.emit('keypress', '', { name: dir });
        }
        this.rl.emit('line');
      };
    });
    describe('when loop undefined / true', () => {
      it('loops to bottom when too far up', async function () {
        const promise = this.list.run();
        this.pressKey('up', 2);
        const answer = await promise;
        expect(answer).to.equal('bar');
      });
      it('loops to top when too far down', async function () {
        const promise = this.list.run();
        this.pressKey('down', 3);
        const answer = await promise;
        expect(answer).to.equal('foo');
      });
    });

    describe('when loop: false', () => {
      beforeEach(function () {
        this.list = new List(_.assign(this.fixture, { loop: false }), this.rl);
      });
      it('stays at top when too far up', async function () {
        const promise = this.list.run();
        this.pressKey('up', 2);
        const answer = await promise;
        expect(answer).to.equal('foo');
      });
      it('stays at bottom when too far down', async function () {
        const promise = this.list.run();
        this.pressKey('down', 3);
        const answer = await promise;
        expect(answer).to.equal('bum');
      });
    });
  });

  it('should require a choices array', () => {
    expect(() => new List({ name: 'foo', message: 'bar' })).to.throw(/choices/);
  });

  it('should allow a numeric default', function (done) {
    this.fixture.default = 1;
    const list = new List(this.fixture, this.rl);

    list.run().then((answer) => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.emit('line');
  });

  it('should work from a numeric default being the index', function (done) {
    this.fixture.default = 1;
    const list = new List(this.fixture, this.rl);

    list.run().then((answer) => {
      expect(answer).to.equal('bum');
      done();
    });

    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.emit('line');
  });

  it('should allow a string default being the value', function (done) {
    this.fixture.default = 'bar';
    const list = new List(this.fixture, this.rl);

    list.run().then((answer) => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.emit('line');
  });

  it('should work from a string default', function (done) {
    this.fixture.default = 'bar';
    const list = new List(this.fixture, this.rl);

    list.run().then((answer) => {
      expect(answer).to.equal('bum');
      done();
    });

    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.emit('line');
  });

  it("shouldn't allow an invalid string default to change position", function (done) {
    this.fixture.default = 'babar';
    const list = new List(this.fixture, this.rl);

    list.run().then((answer) => {
      expect(answer).to.equal('foo');
      done();
    });

    this.rl.emit('line');
  });

  it("shouldn't allow an invalid index as default", function (done) {
    this.fixture.default = 4;
    const list = new List(this.fixture, this.rl);

    list.run().then((answer) => {
      expect(answer).to.equal('foo');
      done();
    });

    this.rl.emit('line');
  });

  it('should allow 1-9 shortcut key', function (done) {
    this.list.run().then((answer) => {
      expect(answer).to.equal('bar');
      done();
    });

    this.rl.input.emit('keypress', '2');
    this.rl.emit('line');
  });

  it('pagination works with multiline choices', function (done) {
    const multilineFixture = {
      message: 'message',
      name: 'name',
      choices: ['a\n\n', 'b\n\n'],
    };
    const list = new List(multilineFixture, this.rl);
    const spy = sinon.spy(list.paginator, 'paginate');
    list.run().then((answer) => {
      const realIndexPosition1 = spy.firstCall.args[1];
      const realIndexPosition2 = spy.secondCall.args[1];

      // 'a\n\n': 0th index, but pagination at 2nd index position due to 2 extra newlines
      expect(realIndexPosition1).to.equal(2);
      // 'b\n\n': 1st index, but pagination at 5th index position due to 4 extra newlines
      expect(realIndexPosition2).to.equal(5);
      expect(answer).to.equal('b\n\n');
      done();
    });
    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.emit('line');
  });

  it('paginator uses non infinite version with loop:false', function () {
    const list = new List(
      {
        name: 'numbers',
        choices: [1, 2, 3],
        loop: false,
      },
      this.rl
    );
    expect(list.paginator.isInfinite).equal(false);
  });

  it('should provide answers in the "filter" callback option', function (done) {
    const answers = {};
    this.fixture.filter = function () {
      return true;
    };
    sinon.spy(this.fixture, 'filter');

    const list = new List(this.fixture, this.rl, answers);

    list.run().then(() => {
      const spyCall = this.fixture.filter.getCall(0);
      expect(spyCall.args[1]).to.equal(answers);
      done();
    });

    this.rl.emit('line');
  });
});
