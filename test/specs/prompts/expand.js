var expect = require('chai').expect;
var _ = require('lodash');
var ReadlineStub = require('../../helpers/readline');
var fixtures = require('../../helpers/fixtures');

var Expand = require('../../../lib/prompts/expand');

describe('`expand` prompt', function() {
  beforeEach(function() {
    this.fixture = _.clone(fixtures.expand);
    this.rl = new ReadlineStub();
    this.expand = new Expand(this.fixture, this.rl);
  });

  it('should throw if `key` is missing', function() {
    expect(() => {
      this.fixture.choices = ['a', 'a'];
      return new Expand(this.fixture, this.rl);
    }).to.throw(/Format error/);
  });

  it('should throw if `key` is duplicate', function() {
    expect(() => {
      this.fixture.choices = [{ key: 'a', name: 'foo' }, { key: 'a', name: 'foo' }];
      return new Expand(this.fixture, this.rl);
    }).to.throw(/Duplicate key error/);
  });

  it('should throw if `key` is `h`', function() {
    expect(() => {
      this.fixture.choices = [{ key: 'h', name: 'foo' }];
      return new Expand(this.fixture, this.rl);
    }).to.throw(/Reserved key error/);
  });

  it('should allow false as a value', function() {
    var promise = this.expand.run();

    this.rl.emit('line', 'd');
    return promise.then(answer => {
      expect(answer).to.equal(false);
    });
  });

  it('pass the value as answer, and display short on the prompt', function() {
    this.fixture.choices = [
      { key: 'a', name: 'A Name', value: 'a value', short: 'ShortA' },
      { key: 'b', name: 'B Name', value: 'b value', short: 'ShortB' }
    ];
    var prompt = new Expand(this.fixture, this.rl);
    var promise = prompt.run();
    this.rl.emit('line', 'b');

    return promise.then(answer => {
      expect(answer).to.equal('b value');
      expect(this.rl.output.__raw__).to.match(/ShortB/);
    });
  });

  it('should use a string the `default` value', function(done) {
    this.fixture.default = 'chile';
    this.expand = new Expand(this.fixture, this.rl);

    this.expand.run().then(answer => {
      expect(answer).to.equal('chile');
      done();
    });
    this.rl.emit('line');
  });

  it('should use the `default` argument value', function(done) {
    this.fixture.default = 1;
    this.expand = new Expand(this.fixture, this.rl);

    this.expand.run().then(answer => {
      expect(answer).to.equal('bar');
      done();
    });
    this.rl.emit('line');
  });

  it('should return the user input', function(done) {
    this.expand.run().then(answer => {
      expect(answer).to.equal('bar');
      done();
    });
    this.rl.emit('line', 'b');
  });

  it('should strip the user input', function(done) {
    this.expand.run().then(answer => {
      expect(answer).to.equal('bar');
      done();
    });
    this.rl.emit('line', ' b ');
  });

  it('should have help option', function(done) {
    this.expand.run().then(answer => {
      expect(this.rl.output.__raw__).to.match(/a\) acab/);
      expect(this.rl.output.__raw__).to.match(/b\) bar/);
      expect(answer).to.equal('chile');
      done();
    });
    this.rl.emit('line', 'h');
    this.rl.emit('line', 'c');
  });

  it('should not allow invalid command', function() {
    var self = this;
    var promise = this.expand.run();

    this.rl.emit('line', 'blah');
    setTimeout(() => {
      self.rl.emit('line', 'a');
    }, 10);
    return promise;
  });

  it('should display and capitalize the default choice `key`', function() {
    this.fixture.default = 1;
    this.expand = new Expand(this.fixture, this.rl);

    this.expand.run();
    expect(this.rl.output.__raw__).to.contain('(aBcdh)');
  });

  it('should display and capitalize the default choice by name value', function() {
    this.fixture.default = 'chile';
    this.expand = new Expand(this.fixture, this.rl);

    this.expand.run();
    expect(this.rl.output.__raw__).to.contain('(abCdh)');
  });

  it('should display and capitalize the default choice H (Help) `key` if no string default matched', function() {
    this.fixture.default = 'chile!';
    this.expand = new Expand(this.fixture, this.rl);

    this.expand.run();
    expect(this.rl.output.__raw__).to.contain('(abcdH)');
  });

  it('should display and capitalize the default choice H (Help) `key` if none provided', function() {
    delete this.fixture.default;
    this.expand = new Expand(this.fixture, this.rl);
    this.expand.run();

    expect(this.rl.output.__raw__).to.contain('(abcdH)');
  });

  it("should 'autocomplete' the user input", function(done) {
    this.expand = new Expand(this.fixture, this.rl);
    this.expand.run();
    this.rl.line = 'a';
    this.rl.emit('keypress');
    setTimeout(() => {
      expect(this.rl.output.__raw__).to.contain('acab');
      done();
    }, 10);
  });
});
