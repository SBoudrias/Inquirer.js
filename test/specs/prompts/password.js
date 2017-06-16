var stripAnsi = require('strip-ansi');
var expect = require('chai').expect;
var _ = require('lodash');
var ReadlineStub = require('../../helpers/readline');
var fixtures = require('../../helpers/fixtures');

var Password = require('../../../lib/prompts/password');

function validationFixture(input) {
  if (input !== 'Passw0rd') {
    return 'invalid password';
  }

  return true;
}

function testMasking(rl, mask) {
  return function (answer) {
    expect(answer).to.equal('Inquirer');
    var expectOutput = expect(stripAnsi(rl.output.__raw__));
    if (mask) {
      expectOutput.to.contain(mask);
    } else {
      expectOutput.to.not.contain('********');
    }
  };
}

function testError(rl, errorMessage) {
  return new Promise(function (resolve) {
    rl.emit('line', 'Inquirer');

    setTimeout(function () {
      var expectOutput = expect(stripAnsi(rl.output.__raw__));
      expectOutput.to.contain(errorMessage);
      resolve();
    }, 25);
  });
}

function testNoError(rl, password) {
  return new Promise(function (resolve) {
    rl.input.emit('keypress', 'a', {name: 'a'});
    rl.input.emit('keypress', 'b', {name: 'b'});

    setTimeout(function () {
      expect(password.error).to.equal(null);
      resolve();
    }, 25);
  });
}

describe('`password` prompt', function () {
  beforeEach(function () {
    this.fixture = _.clone(fixtures.password);
    this.rl = new ReadlineStub();
  });

  it('should use raw value from the user without masking', function () {
    var password = new Password(this.fixture, this.rl);
    var promise = password.run().then(testMasking(this.rl, false));

    this.rl.emit('line', 'Inquirer');
    return promise;
  });

  it('should mask the input with "*" if the `mask` option was provided by the user was `true`', function () {
    this.fixture.mask = true;
    var password = new Password(this.fixture, this.rl);
    var promise = password.run().then(testMasking(this.rl, '********'));

    this.rl.emit('line', 'Inquirer');
    return promise;
  });

  it('should mask the input if a `mask` string was provided by the user', function () {
    this.fixture.mask = '#';
    var password = new Password(this.fixture, this.rl);
    var promise = password.run().then(testMasking(this.rl, '########'));

    this.rl.emit('line', 'Inquirer');
    return promise;
  });

  it('should display an error on validation error', function () {
    this.fixture.validate = validationFixture;

    new Password(this.fixture, this.rl).run();

    return testError(this.rl, 'invalid password');
  });

  it('should remove an error on keypress without mask', function () {
    this.fixture.validate = validationFixture;

    var rl = this.rl;
    var password = new Password(this.fixture, this.rl);
    password.run();

    return testError(rl, 'invalid password')
      .then(function () {
        return testNoError(rl, password);
      });
  });

  it('should remove an error on keypress with mask', function () {
    this.fixture.mask = '*';
    this.fixture.validate = validationFixture;

    var rl = this.rl;
    var password = new Password(this.fixture, this.rl);
    password.run();

    return testError(rl, 'invalid password')
      .then(function () {
        return testNoError(rl, password);
      });
  });
});
