import stripAnsi from 'strip-ansi';
import { beforeEach, describe, it, expect } from 'vitest';
import ReadlineStub from '../../helpers/readline.mjs';
import fixtures from '../../helpers/fixtures.mjs';

import Password from '../../../src/prompts/password.mjs';

function testMasking(rl, mask) {
  return function (answer) {
    expect(answer).toEqual('Inquirer');
    const expectOutput = expect(stripAnsi(rl.output.__raw__));
    if (mask) {
      expectOutput.toContain(mask);
    } else {
      expectOutput.not.toContain('********');
    }
  };
}

describe('`password` prompt', () => {
  let fixture;
  let rl;

  beforeEach(() => {
    fixture = { ...fixtures.password };
    rl = new ReadlineStub();
  });

  it('should use raw value from the user without masking', () => {
    const password = new Password(fixture, rl);
    const promise = password.run().then(testMasking(rl, false));

    rl.emit('line', 'Inquirer');
    return promise;
  });

  it('should mask the input with "*" if the `mask` option was provided by the user was `true`', () => {
    fixture.mask = true;
    const password = new Password(fixture, rl);
    const promise = password.run().then(testMasking(rl, '********'));

    rl.emit('line', 'Inquirer');
    return promise;
  });

  it('should mask the input if a `mask` string was provided by the user', () => {
    fixture.mask = '#';
    const password = new Password(fixture, rl);
    const promise = password.run().then(testMasking(rl, '########'));

    rl.emit('line', 'Inquirer');
    return promise;
  });

  it('Preserves default', () => {
    fixture.default = 'Inquirer';
    const password = new Password(fixture, rl);
    const promise = password.run().then((answer) => expect(answer).toEqual('Inquirer'));
    rl.emit('line', '');
    return promise;
  });

  it('Clears default on keypress', () => {
    fixture.default = 'Inquirer';
    const password = new Password(fixture, rl);
    const promise = password.run().then((answer) => expect(answer).toEqual(''));
    // @ts-expect-error 2024-06-29
    password.onKeypress({ name: 'backspace' });
    rl.emit('line', '');
    return promise;
  });

  // See: https://github.com/SBoudrias/Inquirer.js/issues/1022
  it('should not display input during async validation', () => {
    let output = '';
    let renderCount = 0;

    fixture.validate = () =>
      new Promise((resolve) => {
        const id = setInterval(() => {
          // Make sure we render at least once.
          if (renderCount > 1) {
            clearInterval(id);
            resolve(true);
          }
        }, 10);
      });

    const password = new Password(fixture, rl);
    const input = 'wvAq82yVujm5S9pf';

    // Override screen.render to capture all output
    // @ts-expect-error 2024-06-29
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
      expect(output).not.toContain(input);
      expect(answer).toEqual(input);
    });

    rl.emit('line', input);

    return promise;
  });
});
