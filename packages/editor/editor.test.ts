import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';
import editor from './src/index.ts';

describe('editor prompt', () => {
  it('open editor after pressing enter', async () => {
    const answer = editor({
      message: 'Add a description',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(
      `"? Add a description Press <enter> to launch your preferred editor."`,
    );

    screen.keypress('enter');
    screen.type('value from editor');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual('value from editor');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('open editor immediately', async () => {
    const answer = editor({
      message: 'Add a description',
      waitForUserInput: false,
    });

    screen.type('value from editor');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual('value from editor');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('allow setting a default value & postfix', async () => {
    const answer = editor({
      message: 'Add a description',
      default: 'default description',
      postfix: '.md',
    });

    screen.keypress('enter');
    screen.type('value from editor');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual('value from editor');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('allow setting temp file options', async () => {
    const answer = editor({
      message: 'Add a description',
      file: {
        postfix: '.md',
        dir: '/tmp',
      },
    });

    screen.keypress('enter');
    screen.type('value from editor');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual('value from editor');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('handles validation', async () => {
    const answer = editor({
      message: 'Add a description',
      validate: (value: string) => {
        switch (value) {
          case '1': {
            return true;
          }
          case '2': {
            return '"2" is not an allowed value';
          }
          default: {
            return false;
          }
        }
      },
    });

    screen.keypress('enter');

    // Test default error message
    screen.type('3');
    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Add a description Press <enter> to launch your preferred editor.
      > You must provide a valid value"
    `);

    // Re-open editor and test user defined error message
    screen.keypress('enter');
    screen.type('2');
    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Add a description Press <enter> to launch your preferred editor.
      > "2" is not an allowed value"
    `);

    // Re-open editor and submit valid value
    screen.keypress('enter');
    screen.type('1');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('clear value on failed validation', async () => {
    const answer = editor({
      message: 'Add a description',
      validate: (value: string) => {
        switch (value) {
          case '1': {
            return true;
          }
          case '2': {
            return '"2" is not an allowed value';
          }
          default: {
            return false;
          }
        }
      },
      theme: {
        validationFailureMode: 'clear',
      },
    });

    screen.keypress('enter');
    screen.type('foo bar');
    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Add a description Press <enter> to launch your preferred editor.
      > You must provide a valid value"
    `);

    screen.keypress('enter');
    screen.type('1');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('goes back to default value on failed validation', async () => {
    const answer = editor({
      message: 'Add a description',
      default: 'default value',
      validate: (value: string) => {
        switch (value) {
          case '1': {
            return true;
          }
          case '2': {
            return '"2" is not an allowed value';
          }
          default: {
            return false;
          }
        }
      },
      theme: {
        validationFailureMode: 'clear',
      },
    });

    screen.keypress('enter');
    screen.type('foo bar');
    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Add a description Press <enter> to launch your preferred editor.
      > You must provide a valid value"
    `);

    screen.keypress('enter');
    screen.type('1');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });
});
