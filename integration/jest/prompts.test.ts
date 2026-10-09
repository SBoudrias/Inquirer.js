/// <reference types="jest" />
import { screen } from '@inquirer/testing/jest';

// Each @inquirer/<prompt> package is individually auto-mocked by the
// adapter. jest.requireMock() executes the factory and returns the wrapped
// module, typed as the real module namespace; its `.default` is then driven
// through the shared screen, one package per test. (`.default` is read as
// an explicit property access rather than a default import: the factory
// result carries no __esModule marker, so a default import would
// double-wrap under a CJS transform.)

describe('@inquirer/testing/jest adapter individual prompt mocks', () => {
  it('wraps @inquirer/input', async () => {
    const input =
      jest.requireMock<typeof import('@inquirer/input')>('@inquirer/input').default;

    const answer = input({ message: 'Name?' });
    expect(screen.getScreen()).toBe('? Name?');

    screen.type('John');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('John');
  });

  it('wraps @inquirer/select', async () => {
    const select =
      jest.requireMock<typeof import('@inquirer/select')>('@inquirer/select').default;

    const answer = select({
      message: 'Pick one',
      choices: [{ value: 'a' }, { value: 'b' }],
    });

    screen.keypress({ name: 'down' });
    screen.keypress({ name: 'enter' });

    await expect(answer).resolves.toBe('b');
  });

  it('wraps @inquirer/confirm', async () => {
    const confirm =
      jest.requireMock<typeof import('@inquirer/confirm')>('@inquirer/confirm').default;

    const answer = confirm({ message: 'Proceed?' });
    screen.keypress('enter');

    await expect(answer).resolves.toBe(true);
  });

  it('wraps @inquirer/checkbox', async () => {
    const checkbox =
      jest.requireMock<typeof import('@inquirer/checkbox')>('@inquirer/checkbox').default;

    const answer = checkbox({
      message: 'Pick any',
      choices: [{ value: 'a' }, { value: 'b' }],
    });

    screen.keypress('space');
    screen.keypress({ name: 'down' });
    screen.keypress('space');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual(['a', 'b']);
  });

  it('wraps @inquirer/password', async () => {
    const password =
      jest.requireMock<typeof import('@inquirer/password')>('@inquirer/password').default;

    const answer = password({ message: 'Secret?', mask: '*' });

    screen.type('hunter2');
    expect(screen.getScreen()).not.toContain('hunter2');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('hunter2');
  });

  it('wraps @inquirer/expand', async () => {
    const expand =
      jest.requireMock<typeof import('@inquirer/expand')>('@inquirer/expand').default;

    const answer = expand({
      message: 'Action?',
      choices: [
        { key: 'y', name: 'Yes', value: 'yes' },
        { key: 'n', name: 'No', value: 'no' },
      ],
    });

    screen.type('y');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('yes');
  });

  it('wraps @inquirer/rawlist', async () => {
    const rawlist =
      jest.requireMock<typeof import('@inquirer/rawlist')>('@inquirer/rawlist').default;

    const answer = rawlist({
      message: 'Pick one',
      choices: [
        { name: 'first', value: 'one' },
        { name: 'second', value: 'two' },
      ],
    });

    screen.type('2');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('two');
  });

  it('wraps @inquirer/number', async () => {
    const number =
      jest.requireMock<typeof import('@inquirer/number')>('@inquirer/number').default;

    const answer = number({ message: 'Age?' });

    screen.type('42');
    screen.keypress('enter');

    await expect(answer).resolves.toBe(42);
  });

  it('wraps @inquirer/search', async () => {
    const search =
      jest.requireMock<typeof import('@inquirer/search')>('@inquirer/search').default;

    const answer = search({
      message: 'Find',
      source: () => Promise.resolve([{ value: 'target', name: 'target' }]),
    });

    screen.type('t');
    await screen.next(); // wait for the async results to render
    screen.keypress('enter');

    await expect(answer).resolves.toBe('target');
  });

  it('wraps @inquirer/editor', async () => {
    const editor =
      jest.requireMock<typeof import('@inquirer/editor')>('@inquirer/editor').default;

    const answer = editor({ message: 'Bio?' });

    screen.keypress('enter'); // open the (captured) editor
    screen.type('content');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('content');
  });
});
