var expect = require('chai').expect;
var _ = require('lodash');
var ReadlineStub = require('../../helpers/readline');
var fixtures = require('../../helpers/fixtures');

var Checkbox = require('../../../lib/prompts/checkbox');

describe('`checkbox` prompt', function() {
  beforeEach(function() {
    this.fixture = _.clone(fixtures.checkbox);
    this.rl = new ReadlineStub();
    this.checkbox = new Checkbox(this.fixture, this.rl);
  });

  it('should return a single selected choice in an array', function(done) {
    this.checkbox.run().then(answer => {
      expect(answer).to.be.an('array');
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 1');
      done();
    });
    this.rl.input.emit('keypress', ' ', { name: 'space' });
    this.rl.emit('line');
  });

  it('should return multiples selected choices in an array', function(done) {
    this.checkbox.run().then(answer => {
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

  it('should check defaults choices', function(done) {
    this.fixture.choices = [
      { name: '1', checked: true },
      { name: '2', checked: false },
      { name: '3', checked: false }
    ];
    this.checkbox = new Checkbox(this.fixture, this.rl);
    this.checkbox.run().then(answer => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('1');
      done();
    });
    this.rl.emit('line');
  });

  it('provide an array of checked choice to validate', function() {
    this.fixture.choices = [
      { name: '1', checked: true },
      { name: '2', checked: 1 },
      { name: '3', checked: false }
    ];
    this.fixture.validate = function(answer) {
      expect(answer).to.eql(['1', '2']);
      return true;
    };
    this.checkbox = new Checkbox(this.fixture, this.rl);
    var promise = this.checkbox.run();
    this.rl.emit('line');
    return promise;
  });

  it('should check defaults choices if given as array of values', function(done) {
    this.fixture.choices = [{ name: '1' }, { name: '2' }, { name: '3' }];
    this.fixture.default = ['1', '3'];
    this.checkbox = new Checkbox(this.fixture, this.rl);
    this.checkbox.run().then(answer => {
      expect(answer.length).to.equal(2);
      expect(answer[0]).to.equal('1');
      expect(answer[1]).to.equal('3');
      done();
    });
    this.rl.emit('line');
  });

  it('should toggle choice when hitting space', function(done) {
    this.checkbox.run().then(answer => {
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

  it('should allow for arrow navigation', function(done) {
    this.checkbox.run().then(answer => {
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

  it('should allow for vi-style navigation', function(done) {
    this.checkbox.run().then(answer => {
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

  it('should allow for emacs-style navigation', function(done) {
    this.checkbox.run().then(answer => {
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

  it('should allow 1-9 shortcut key', function(done) {
    this.checkbox.run().then(answer => {
      expect(answer.length).to.equal(1);
      expect(answer[0]).to.equal('choice 2');
      done();
    });

    this.rl.input.emit('keypress', '2');
    this.rl.emit('line');
  });

  it('should select all answers if <a> is pressed', function() {
    var promise = this.checkbox.run();

    this.rl.input.emit('keypress', 'a', { name: 'a' });
    this.rl.emit('line');

    return promise.then(answer => {
      expect(answer.length).to.equal(3);
    });
  });

  it('should select no answers if <a> is pressed a second time', function() {
    var promise = this.checkbox.run();

    this.rl.input.emit('keypress', 'a', { name: 'a' });
    this.rl.input.emit('keypress', 'a', { name: 'a' });
    this.rl.emit('line');

    return promise.then(answer => {
      expect(answer.length).to.equal(0);
    });
  });

  it('should select the inverse of the current selection when <i> is pressed', function() {
    var promise = this.checkbox.run();

    this.rl.input.emit('keypress', 'i', { name: 'i' });
    this.rl.emit('line');

    return promise.then(answer => {
      expect(answer.length).to.equal(3);
    });
  });

  describe('with disabled choices', function() {
    beforeEach(function() {
      this.fixture.choices.push({
        name: 'dis1',
        disabled: true
      });
      this.fixture.choices.push({
        name: 'dis2',
        disabled: 'uh oh'
      });
      this.checkbox = new Checkbox(this.fixture, this.rl);
    });

    it('output disabled choices and custom messages', function() {
      var promise = this.checkbox.run();
      this.rl.emit('line');
      return promise.then(() => {
        expect(this.rl.output.__raw__).to.contain('- dis1 (Disabled)');
        expect(this.rl.output.__raw__).to.contain('- dis2 (uh oh)');
      });
    });

    it('skip disabled choices', function(done) {
      this.checkbox.run().then(answer => {
        expect(answer[0]).to.equal('choice 1');
        done();
      });
      this.rl.input.emit('keypress', null, { name: 'down' });
      this.rl.input.emit('keypress', null, { name: 'down' });
      this.rl.input.emit('keypress', null, { name: 'down' });

      this.rl.input.emit('keypress', ' ', { name: 'space' });
      this.rl.emit('line');
    });

    it("uncheck defaults choices who're disabled", function(done) {
      this.fixture.choices = [
        { name: '1', checked: true, disabled: true },
        { name: '2' }
      ];
      this.checkbox = new Checkbox(this.fixture, this.rl);
      this.checkbox.run().then(answer => {
        expect(answer.length).to.equal(0);
        done();
      });
      this.rl.emit('line');
    });

    it('disabled can be a function', function() {
      this.fixture.choices = [
        {
          name: 'dis1',
          disabled: function(answers) {
            expect(answers.foo).to.equal('foo');
            return true;
          }
        }
      ];
      this.checkbox = new Checkbox(this.fixture, this.rl, { foo: 'foo' });
      var promise = this.checkbox.run();
      this.rl.emit('line');

      promise.then(() => {
        expect(this.rl.output.__raw__).to.contain('- dis1 (Disabled)');
      });
    });
  });
});
