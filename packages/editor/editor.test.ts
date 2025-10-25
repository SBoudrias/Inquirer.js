import { describe, it, expect, afterEach, vi } from 'vitest';
import { render } from '@inquirer/testing';
import { editAsync } from '@inquirer/external-editor';
import editor from './src/index.ts';

vi.mock('@inquirer/external-editor');
afterEach(() => {
  vi.mocked(editAsync).mockClear();
});

async function editorAction(error: undefined | Error, value?: string) {
  const { lastCall } = vi.mocked(editAsync).mock;
  if (!lastCall) throw new Error("editor wasn't open");

  // Bugfix: The callback error value is nullable.
  const editCallback = lastCall[1] as (
    error: undefined | Error,
    value: string,
  ) => void | Promise<void>;
  await editCallback(error, value ?? '');
}

describe('editor prompt', () => {
  it('open editor after pressing enter', async () => {
    const { answer, events, getScreen } = await render(editor, {
      message: 'Add a description',
    });

    expect(getScreen()).toMatchInlineSnapshot(
      `"? Add a description Press <enter> to launch your preferred editor."`,
    );
    expect(editAsync).not.toHaveBeenCalled();

    events.keypress('enter');
    expect(editAsync).toHaveBeenLastCalledWith('', expect.any(Function), {
      postfix: '.txt',
    });

    await editorAction(undefined, 'value from editor');

    await expect(answer).resolves.toEqual('value from editor');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('open editor immediately', async () => {
    const { answer, getScreen } = await render(editor, {
      message: 'Add a description',
      waitForUserInput: false,
    });
    expect(editAsync).toHaveBeenLastCalledWith('', expect.any(Function), {
      postfix: '.txt',
    });

    await editorAction(undefined, 'value from editor');

    await expect(answer).resolves.toEqual('value from editor');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('allow setting a default value & postfix', async () => {
    const { answer, events, getScreen } = await render(editor, {
      message: 'Add a description',
      default: 'default description',
      postfix: '.md',
    });

    expect(editAsync).not.toHaveBeenCalled();

    events.keypress('enter');
    expect(editAsync).toHaveBeenLastCalledWith(
      'default description',
      expect.any(Function),
      {
        postfix: '.md',
      },
    );

    await editorAction(undefined, 'value from editor');

    await expect(answer).resolves.toEqual('value from editor');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('allow setting temp file options', async () => {
    const { answer, events, getScreen } = await render(editor, {
      message: 'Add a description',
      file: {
        postfix: '.md',
        dir: '/tmp',
      },
    });

    expect(editAsync).not.toHaveBeenCalled();

    events.keypress('enter');
    expect(editAsync).toHaveBeenLastCalledWith('', expect.any(Function), {
      postfix: '.md',
      dir: '/tmp',
    });

    await editorAction(undefined, 'value from editor');

    await expect(answer).resolves.toEqual('value from editor');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('handles validation', async () => {
    const { answer, events, getScreen } = await render(editor, {
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

    expect(editAsync).not.toHaveBeenCalled();
    events.keypress('enter');

    // Test default error message
    const editPromise = editorAction(undefined, '3');
    events.type('foo'); // Ignored events while validation runs
    await editPromise;
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Add a description Press <enter> to launch your preferred editor.
      > You must provide a valid value"
    `);

    expect(editAsync).toHaveBeenCalledOnce();
    events.keypress('enter');
    expect(editAsync).toHaveBeenCalledTimes(2);
    // Previous answer is passed in the second time for editing
    expect(editAsync).toHaveBeenLastCalledWith('3', expect.any(Function), {
      postfix: '.txt',
    });

    // Test user defined error message
    await editorAction(undefined, '2');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Add a description Press <enter> to launch your preferred editor.
      > "2" is not an allowed value"
    `);

    events.keypress('enter');
    expect(editAsync).toHaveBeenCalledTimes(3);

    await editorAction(undefined, '1');
    await expect(answer).resolves.toEqual('1');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('clear value on failed validation', async () => {
    const { answer, events, getScreen } = await render(editor, {
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

    expect(editAsync).not.toHaveBeenCalled();
    events.keypress('enter');

    expect(editAsync).toHaveBeenCalledOnce();
    expect(editAsync).toHaveBeenLastCalledWith('', expect.any(Function), {
      postfix: '.txt',
    });
    await editorAction(undefined, 'foo bar');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Add a description Press <enter> to launch your preferred editor.
      > You must provide a valid value"
    `);

    events.keypress('enter');
    expect(editAsync).toHaveBeenCalledTimes(2);
    // Because we clear, the second call goes back to an empty string
    expect(editAsync).toHaveBeenLastCalledWith('', expect.any(Function), {
      postfix: '.txt',
    });

    await editorAction(undefined, '1');
    await expect(answer).resolves.toEqual('1');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('goes back to default value on failed validation', async () => {
    const { answer, events, getScreen } = await render(editor, {
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

    expect(editAsync).not.toHaveBeenCalled();
    events.keypress('enter');

    expect(editAsync).toHaveBeenCalledOnce();
    expect(editAsync).toHaveBeenLastCalledWith('default value', expect.any(Function), {
      postfix: '.txt',
    });
    await editorAction(undefined, 'foo bar');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Add a description Press <enter> to launch your preferred editor.
      > You must provide a valid value"
    `);

    events.keypress('enter');
    expect(editAsync).toHaveBeenCalledTimes(2);
    // Because we clear, the second call goes back to the default value
    expect(editAsync).toHaveBeenLastCalledWith('default value', expect.any(Function), {
      postfix: '.txt',
    });

    await editorAction(undefined, '1');
    await expect(answer).resolves.toEqual('1');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('surfaces external-editor errors', async () => {
    const { answer, events, getScreen } = await render(editor, {
      message: 'Add a description',
    });

    expect(editAsync).not.toHaveBeenCalled();
    events.keypress('enter');

    await editorAction(new Error('$EDITOR failed!'), '');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Add a description Press <enter> to launch your preferred editor.
      > Error: $EDITOR failed!"
    `);

    expect(editAsync).toHaveBeenCalledOnce();
    events.keypress('enter');
    expect(editAsync).toHaveBeenCalledTimes(2);

    // Test user defined error message
    await editorAction(undefined, 'new value');

    await expect(answer).resolves.toEqual('new value');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });
});
