const stripAnsi = require('strip-ansi');
const { expect } = require('chai');
const ReadlineStub = require('../../helpers/readline');
const fixtures = require('../../helpers/fixtures');

const Password = require('../../../lib/prompts/password');

function testMasking(rl, mask) {
  return function (answer) {
    expect(answer).to.equal('Inquirer');
    const expectOutput = expect(stripAnsi(rl.output.__raw__));
    if (mask) {
      expectOutput.to.contain(mask);
    } else {
      expectOutput.to.not.contain('********');
    }
  };
}

describe('`password` prompt', () => {
  beforeEach(function () {
    this.fixture = { ...fixtures.password };
    this.rl = new ReadlineStub();
  });

  it('should use raw value from the user without masking', function () {
    const password = new Password(this.fixture, this.rl);
    const promise = password.run().then(testMasking(this.rl, false));

    this.rl.emit('line', 'Inquirer');
    return promise;
  });

  it('should mask the input with "*" if the `mask` option was provided by the user was `true`', function () {
    this.fixture.mask = true;
    const password = new Password(this.fixture, this.rl);
    const promise = password.run().then(testMasking(this.rl, '********'));

    this.rl.emit('line', 'Inquirer');
    return promise;
  });

  it('should mask the input if a `mask` string was provided by the user', function () {
    this.fixture.mask = '#';
    const password = new Password(this.fixture, this.rl);
    const promise = password.run().then(testMasking(this.rl, '########'));

    this.rl.emit('line', 'Inquirer');
    return promise;
  });

  it('Preserves default', function () {
    this.fixture.default = 'Inquirer';
    const password = new Password(this.fixture, this.rl);
    const promise = password.run().then((answer) => expect(answer).to.equal('Inquirer'));
    this.rl.emit('line', '');
    return promise;
  });

  it('Clears default on keypress', function () {
    this.fixture.default = 'Inquirer';
    const password = new Password(this.fixture, this.rl);
    const promise = password.run().then((answer) => expect(answer).to.equal(''));
    password.onKeypress({ name: 'backspace' });
    this.rl.emit('line', '');
    return promise;
  });

  // See: https://github.com/SBoudrias/Inquirer.js/issues/1022
  it('should not display input during async validation', function () {
    let output = '';
    let renderCount = 0;

    this.fixture.validate = () =>
      new Promise((resolve) => {
        const id = setInterval(() => {
          // Make sure we render at least once.
          if (renderCount > 1) {
            clearInterval(id);
            resolve(true);
          }
        }, 10);
      });

    const password = new Password(this.fixture, this.rl);
    const input = 'wvAq82yVujm5S9pf';

    // Override screen.render to capture all output
    const { screen } = password;
    const { render } = screen;
    screen.render = (...args) => {
      output += stripAnsi(args.join(''));
      renderCount += 1;
      return render.call(screen, ...args);
    };

    /* This test should fail if you uncomment this line: */
    // password.getSpinningValue = (value) => value;

    const promise = password.run().then((answer) => {
      expect(output).to.not.contain(input);
      expect(answer).to.equal(input);
    });

    this.rl.emit('line', input);

    return promise;
  });
});
