var expect = require('chai').expect;
var _ = require('lodash');
var ReadlineStub = require('../../helpers/readline');
var fixtures = require('../../helpers/fixtures');

var NumberPrompt = require('../../../lib/prompts/number');

const ACCEPTABLE_ERROR = 0.001;

describe('`number` prompt', function() {
  beforeEach(function() {
    this.fixture = _.clone(fixtures.number);
    this.rl = new ReadlineStub();
    this.number = new NumberPrompt(this.fixture, this.rl);
  });

  it('should parse the largest number', function(done) {
    this.number.run().then(answer => {
      expect(answer).to.equal(Number.MAX_SAFE_INTEGER);
      done();
    });

    this.rl.emit('line', String(Number.MAX_SAFE_INTEGER));
  });

  it('should parse the smallest number', function(done) {
    this.number.run().then(answer => {
      expect(answer).to.equal(Number.MIN_SAFE_INTEGER);
      done();
    });

    this.rl.emit('line', String(Number.MIN_SAFE_INTEGER));
  });

  it('should parse an integer', function(done) {
    this.number.run().then(answer => {
      expect(answer).to.equal(42);
      done();
    });

    this.rl.emit('line', '42');
  });

  it('should parse negative numbers', function(done) {
    this.number.run().then(answer => {
      expect(answer).to.equal(-363);
      done();
    });

    this.rl.emit('line', '-363');
  });

  it('should parse a regular float', function(done) {
    this.number.run().then(answer => {
      expect(answer).to.be.closeTo(4353.43, ACCEPTABLE_ERROR);
      done();
    });

    this.rl.emit('line', '4353.43');
  });

  it('should parse a float with no digits before the decimal', function(done) {
    this.number.run().then(answer => {
      expect(answer).to.be.closeTo(0.01264, ACCEPTABLE_ERROR);
      done();
    });

    this.rl.emit('line', '.01264');
  });

  it('should parse a float with no digits after the decimal', function(done) {
    this.number.run().then(answer => {
      expect(answer).to.be.closeTo(1234.0, ACCEPTABLE_ERROR);
      done();
    });

    this.rl.emit('line', '1234.');
  });

  it('should parse a float with exponents', function(done) {
    this.number.run().then(answer => {
      expect(answer).to.be.closeTo(534e12, ACCEPTABLE_ERROR);
      done();
    });

    this.rl.emit('line', '534e12');
  });

  it('should parse any other string as NaN', function(done) {
    this.number.run().then(answer => {
      expect(answer).to.be.NaN; // eslint-disable-line no-unused-expressions
      done();
    });

    this.rl.emit('line', 'The cat');
  });

  it('should parse the empty string as NaN', function(done) {
    this.number.run().then(answer => {
      expect(answer).to.be.NaN; // eslint-disable-line no-unused-expressions
      done();
    });

    this.rl.emit('line', '');
  });

  it('should return default value if it is set on a bad input', function(done) {
    this.number.opt.default = 11;
    this.number.run().then(answer => {
      expect(answer).to.equal(11);
      done();
    });

    this.rl.emit('line', '');
  });
});
