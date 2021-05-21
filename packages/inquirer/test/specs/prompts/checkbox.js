const { expect } = require('chai');
const _ = require('lodash');
const ReadlineStub = require('../../helpers/readline');
const fixtures = require('../../helpers/fixtures');
const sinon = require('sinon');

const Checkbox = require('../../../lib/prompts/checkbox');

describe('`checkbox` prompt', () => {
  beforeEach(function () {
    this.fixture = _.clone(fixtures.checkbox);
    this.rl = new ReadlineStub();
    this.checkbox = new Checkbox(this.fixture, this.rl);
  });

  it('should return a single selected choice in an array', function (done) {
    this.checkbox.run().then((answer) => {
      expect(answer).to.be.an('array');
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 1');
      done();
    });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should return multiples selected choices in an array', function (done) {
    this.checkbox.run().then((answer) => {
      expect(answer).to.be.an('array');
      expect(answer.length).to.equal(2);
      expect(answer[0]).to.equal('choice 1');
      expect(answer[1]).to.equal('choice 2');
      done();
    });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.input.emit('keypress', null, { name: 'down' });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should check defaults choices', function (done) {
    this.fixture.choices = [
      { name: '1', checked: true },
      { name: '2', checked: false },
      { name: '3', checked: false },
    ];
    this.checkbox = new Checkbox(this.fixture, this.rl);
    this.checkbox.run().then((answer) => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('1');
      done();
    });
    this.rl.emit('line');
  });

  it('provide an array of checked choice to validate', function () {
    this.fixture.choices = [
      { name: '1', checked: true },
      { name: '2', checked: 1 },
      { name: '3', checked: false },
    ];
    this.fixture.validate = function (answer) {
      expect(answer).to.eql(['1', '2']);
      return true;
    };

    this.checkbox = new Checkbox(this.fixture, this.rl);
    const promise = this.checkbox.run();
    this.rl.emit('line');
    return promise;
  });

  it('should check defaults choices if given as array of values', function (done) {
    this.fixture.choices = [{ name: '1' }, { name: '2' }, { name: '3' }];
    this.fixture.default = ['1', '3'];
    this.checkbox = new Checkbox(this.fixture, this.rl);
    this.checkbox.run().then((answer) => {
      expect(answer.length).to.equal(2);
      expect(answer[0]).to.equal('1');
      expect(answer[1]).to.equal('3');
      done();
    });
    this.rl.emit('line');
  });

  it('should toggle choice when hitting space', function (done) {
    this.checkbox.run().then((answer) => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 1');
      done();
    });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.input.emit('keypress', null, { name: 'down' });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should allow for arrow navigation', function (done) {
    this.checkbox.run().then((answer) => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 2');
      done();
    });

    this.rl.input.emit('keypress', null, { name: 'down' });
    this.rl.input.emit('keypress', null, { name: 'down' });
    this.rl.input.emit('keypress', null, { name: 'up' });

    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should allow for vi-style navigation', function (done) {
    this.checkbox.run().then((answer) => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 2');
      done();
    });

    this.rl.input.emit('keypress', 'j', { name: 'j' });
    this.rl.input.emit('keypress', 'j', { name: 'j' });
    this.rl.input.emit('keypress', 'k', { name: 'k' });

    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should allow for emacs-style navigation', function (done) {
    this.checkbox.run().then((answer) => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 2');
      done();
    });

    this.rl.input.emit('keypress', 'n', { name: 'n', ctrl: true });
    this.rl.input.emit('keypress', 'n', { name: 'n', ctrl: true });
    this.rl.input.emit('keypress', 'p', { name: 'p', ctrl: true });

    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should allow 1-9 shortcut key', function (done) {
    this.checkbox.run().then((answer) => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 2');
      done();
    });

    this.rl.input.emit('keypress', '2');
    this.rl.emit('line');
  });

  it('should select all answers if <a> is pressed', function () {
    const promise = this.checkbox.run();

    this.rl.input.emit('keypress', 'a', { name: 'a' });
    this.rl.emit('line');

    return promise.then((answer) => {
      expect(answer.length).to.equal(3);
    });
  });

  it('should select no answers if <a> is pressed a second time', function () {
    const promise = this.checkbox.run();

    this.rl.input.emit('keypress', 'a', { name: 'a' });
    this.rl.input.emit('keypress', 'a', { name: 'a' });
    this.rl.emit('line');

    return promise.then((answer) => {
      expect(answer.length).to.equal(0);
    });
  });

  it('should select the inverse of the current selection when <i> is pressed', function () {
    const promise = this.checkbox.run();

    this.rl.input.emit('keypress', 'i', { name: 'i' });
    this.rl.emit('line');

    return promise.then((answer) => {
      expect(answer.length).to.equal(3);
    });
  });

  it('pagination works with multiline choices', function (done) {
    const multilineFixture = {
      message: 'message',
      name: 'name',
      choices: ['a\n\n', 'b\n\n'],
    };
    const list = new Checkbox(multilineFixture, this.rl);
    const spy = sinon.spy(list.paginator, 'paginate');
    list.run().then((answer) => {
      const realIndexPosition1 = spy.firstCall.args[1];
      const realIndexPosition2 = spy.secondCall.args[1];

      // 'a\n\n': 0th index, but pagination at 2nd index position due to 2 extra newlines
      expect(realIndexPosition1).to.equal(2);
      // 'b\n\n': 1st index, but pagination at 5th index position due to 4 extra newlines
      expect(realIndexPosition2).to.equal(5);
      expect(answer[0]).to.equal('b\n\n');
      done();
    });
    this.rl.input.emit('keypress', '', { name: 'down' });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  describe('with disabled choices', () => {
    beforeEach(function () {
      this.fixture.choices.push({
        name: 'dis1',
        disabled: true,
      });
      this.fixture.choices.push({
        name: 'dis2',
        disabled: 'uh oh',
      });
      this.checkbox = new Checkbox(this.fixture, this.rl);
    });

    it('output disabled choices and custom messages', function () {
      const promise = this.checkbox.run();
      this.rl.emit('line');
      return promise.then(() => {
        expect(this.rl.output.__raw__).to.contain('- dis1 (Disabled)');
        expect(this.rl.output.__raw__).to.contain('- dis2 (uh oh)');
      });
    });

    it('skip disabled choices', function (done) {
      this.checkbox.run().then((answer) => {
        expect(answer[0]).to.equal('choice 1');
        done();
      });
      this.rl.input.emit('keypress', null, { name: 'down' });
      this.rl.input.emit('keypress', null, { name: 'down' });
      this.rl.input.emit('keypress', null, { name: 'down' });

      this.rl.input.emit('keypress', ' ', { name: 'space' });
      this.rl.emit('line');
    });

    it("uncheck defaults choices who're disabled", function (done) {
      this.fixture.choices = [
        { name: '1', checked: true, disabled: true },
        { name: '2' },
      ];
      this.checkbox = new Checkbox(this.fixture, this.rl);
      this.checkbox.run().then((answer) => {
        expect(answer.length).to.equal(0);
        done();
      });
      this.rl.emit('line');
    });

    it('disabled can be a function', function () {
      this.fixture.choices = [
        {
          name: 'dis1',
          disabled(answers) {
            expect(answers.foo).to.equal('foo');
            return true;
          },
        },
      ];
      this.checkbox = new Checkbox(this.fixture, this.rl, { foo: 'foo' });
      const promise = this.checkbox.run();
      this.rl.emit('line');

      promise.then(() => {
        expect(this.rl.output.__raw__).to.contain('- dis1 (Disabled)');
      });
    });
  });

  describe('going out of boundaries', () => {
    describe('when loop undefined / true', () => {
      it('loops to bottom when too far up', async function () {
        const promise = this.checkbox.run();

        this.rl.input.emit('keypress', null, { name: 'up' });
        this.rl.input.emit('keypress', null, { name: 'up' });

        this.rl.input.emit('keypress', ' ', { name: 'space' });
        this.rl.emit('line');

        const answer = await promise;
        expect(answer.length).to.equal(1);
        expect(answer[0]).to.equal('choice 2');
      });
      it('loops to top when too far down', async function () {
        const promise = this.checkbox.run();

        this.rl.input.emit('keypress', null, { name: 'down' });
        this.rl.input.emit('keypress', null, { name: 'down' });
        this.rl.input.emit('keypress', null, { name: 'down' });

        this.rl.input.emit('keypress', ' ', { name: 'space' });
        this.rl.emit('line');

        const answer = await promise;
        expect(answer.length).to.equal(1);
        expect(answer[0]).to.equal('choice 1');
      });
    });

    describe('when loop: false', () => {
      beforeEach(function () {
        this.checkbox = new Checkbox(_.assign(this.fixture, { loop: false }), this.rl);
      });
      it('stays at top when too far up', async function () {
        const promise = this.checkbox.run();

        this.rl.input.emit('keypress', null, { name: 'up' });
        this.rl.input.emit('keypress', null, { name: 'up' });

        this.rl.input.emit('keypress', ' ', { name: 'space' });
        this.rl.emit('line');

        const answer = await promise;
        expect(answer.length).to.equal(1);
        expect(answer[0]).to.equal('choice 1');
      });
      it('stays at bottom when too far down', async function () {
        const promise = this.checkbox.run();

        this.rl.input.emit('keypress', null, { name: 'down' });
        this.rl.input.emit('keypress', null, { name: 'down' });
        this.rl.input.emit('keypress', null, { name: 'down' });

        this.rl.input.emit('keypress', ' ', { name: 'space' });
        this.rl.emit('line');

        const answer = await promise;
        expect(answer.length).to.equal(1);
        expect(answer[0]).to.equal('choice 3');
      });
    });
  });
});
