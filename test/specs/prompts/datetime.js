var expect = require('chai').expect;
var _ = require('lodash');
var ReadlineStub = require('../../helpers/readline');
var fixtures = require('../../helpers/fixtures');

require('datejs');
var DateTime = require('../../../lib/prompts/datetime');

describe('`datetime` prompt', function () {
  beforeEach(function () {
    this.fixture = _.clone(fixtures.datetime);
    this.rl = new ReadlineStub();
    this.datetime = new DateTime(this.fixture, this.rl);
  });

  it('should output a valid date', function (done) {
    this.datetime.run().then(function (answer) {
      expect(answer).to.be.a('Date');
      expect(answer.equals(Date.parse('1/1/2000 9:00AM'))).to.be.true;
      done();
    });

    this.rl.emit('line');
  });

  it('should allow incrementing fields', function (done) {
    this.datetime.run().then(function (answer) {
      expect(answer).to.be.a('Date');
      expect(answer.equals(Date.parse('2/1/2000 9:00AM'))).to.be.true;
      done();
    });

    this.rl.input.emit('keypress', '', {name: 'up'});
    this.rl.emit('line');
  });

  it('should allow decrementing fields', function (done) {
    this.datetime.run().then(function (answer) {
      expect(answer).to.be.a('Date');
      expect(answer.equals(Date.parse('1/1/2000 9:00AM'))).to.be.true;
      done();
    });

    this.rl.input.emit('keypress', '', {name: 'up'});
    this.rl.input.emit('keypress', '', {name: 'down'});
    this.rl.emit('line');
  });

  it('should allow changing fields', function (done) {
    this.datetime.run().then(function (answer) {
      expect(answer).to.be.a('Date');
      expect(answer.equals(Date.parse('1/2/2000 9:00AM'))).to.be.true;
      done();
    });

    this.rl.input.emit('keypress', '', {name: 'right'});
    this.rl.input.emit('keypress', '', {name: 'up'});
    this.rl.emit('line');
  });

  it('should allow returning to fields', function (done) {
    this.datetime.run().then(function (answer) {
      expect(answer).to.be.a('Date');
      expect(answer.equals(Date.parse('1/1/2000 9:00PM'))).to.be.true;
      done();
    });

    this.rl.input.emit('keypress', '', {name: 'right'});
    this.rl.input.emit('keypress', '', {name: 'right'});
    this.rl.input.emit('keypress', '', {name: 'right'});
    this.rl.input.emit('keypress', '', {name: 'right'});
    this.rl.input.emit('keypress', '', {name: 'right'});
    this.rl.input.emit('keypress', '', {name: 'left'});
    this.rl.input.emit('keypress', '', {name: 'right'});
    this.rl.input.emit('keypress', '', {name: 'up'});
    this.rl.emit('line');
  });

  it('should allow numerical entry', function (done) {
    this.datetime.run().then(function (answer) {
      expect(answer).to.be.a('Date');
      console.log(answer);
      expect(answer.equals(Date.parse('1/1/2017 9:00AM'))).to.be.true;
      done();
    });

    this.rl.input.emit('keypress', '', {name: 'right'});
    this.rl.input.emit('keypress', '', {name: 'right'});
    this.rl.input.emit('keypress', '1');
    this.rl.input.emit('keypress', '7');
    this.rl.emit('line');
  });
});
