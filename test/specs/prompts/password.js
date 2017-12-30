var stripAnsi = require('strip-ansi');
var expect = require('chai').expect;
var _ = require('lodash');
var ReadlineStub = require('../../helpers/readline');
var fixtures = require('../../helpers/fixtures');

var Password = require('../../../lib/prompts/password');

function testMasking(rl, mask) {
  return function(answer) {
    expect(answer).to.equal('Inquirer');
    var expectOutput = expect(stripAnsi(rl.output.__raw__));
    if (mask) {
      expectOutput.to.contain(mask);
    } else {
      expectOutput.to.not.contain('********');
    }
  };
}

describe('`password` prompt', function() {
  beforeEach(function() {
    this.fixture = _.clone(fixtures.password);
    this.rl = new ReadlineStub();
  });

  it('should use raw value from the user without masking', function() {
    var password = new Password(this.fixture, this.rl);
    var promise = password.run().then(testMasking(this.rl, false));

    this.rl.emit('line', 'Inquirer');
    return promise;
  });

  it('should mask the input with "*" if the `mask` option was provided by the user was `true`', function() {
    this.fixture.mask = true;
    var password = new Password(this.fixture, this.rl);
    var promise = password.run().then(testMasking(this.rl, '********'));

    this.rl.emit('line', 'Inquirer');
    return promise;
  });

  it('should mask the input if a `mask` string was provided by the user', function() {
    this.fixture.mask = '#';
    var password = new Password(this.fixture, this.rl);
    var promise = password.run().then(testMasking(this.rl, '########'));

    this.rl.emit('line', 'Inquirer');
    return promise;
  });
});
