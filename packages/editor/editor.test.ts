import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@inquirer/testing';
import { editAsync } from '@inquirer/external-editor';
import editor from './src/index.ts';

vi.mock('@inquirer/external-editor');

let resolveEdit: (value: string) => void;
let rejectEdit: (error: Error) => void;

beforeEach(() => {
  vi.mocked(editAsync).mockImplementation(
    (_text, _options) =>
      new Promise<string>((resolve, reject) => {
        resolveEdit = resolve;
        rejectEdit = reject;
      }),
  );
});

afterEach(() => {
  vi.mocked(editAsync).mockClear();
});

async function editorAction(error: undefined | Error, value?: string) {
  if (error) {
    rejectEdit(error);
  } else {
    resolveEdit(value ?? '');
  }
  // Two yields: first lets the .then()/.catch() fire (up to the first await
  // inside), second lets synchronous validate results continue.
  await Promise.resolve();
  await Promise.resolve();
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
    expect(editAsync).toHaveBeenLastCalledWith('', { postfix: '.txt' });

    await editorAction(undefined, 'value from editor');

    await expect(answer).resolves.toEqual('value from editor');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('open editor immediately', async () => {
    const { answer, getScreen } = await render(editor, {
      message: 'Add a description',
      waitForUserInput: false,
    });
    expect(editAsync).toHaveBeenLastCalledWith('', { postfix: '.txt' });

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
    expect(editAsync).toHaveBeenLastCalledWith('default description', {
      postfix: '.md',
    });

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
    expect(editAsync).toHaveBeenLastCalledWith('', {
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
    expect(editAsync).toHaveBeenLastCalledWith('3', { postfix: '.txt' });

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
    expect(editAsync).toHaveBeenLastCalledWith('', { postfix: '.txt' });
    await editorAction(undefined, 'foo bar');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Add a description Press <enter> to launch your preferred editor.
      > You must provide a valid value"
    `);

    events.keypress('enter');
    expect(editAsync).toHaveBeenCalledTimes(2);
    // Because we clear, the second call goes back to an empty string
    expect(editAsync).toHaveBeenLastCalledWith('', { postfix: '.txt' });

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
    expect(editAsync).toHaveBeenLastCalledWith('default value', { postfix: '.txt' });
    await editorAction(undefined, 'foo bar');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Add a description Press <enter> to launch your preferred editor.
      > You must provide a valid value"
    `);

    events.keypress('enter');
    expect(editAsync).toHaveBeenCalledTimes(2);
    // Because we clear, the second call goes back to the default value
    expect(editAsync).toHaveBeenLastCalledWith('default value', { postfix: '.txt' });

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

  it('displays custom waitingMessage', async () => {
    const { answer, events, getScreen } = await render(editor, {
      message: 'Add a description',
      theme: {
        style: {
          waitingMessage: (enterKey: string) => `Hit ${enterKey} to continue`,
        },
      },
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Add a description Hit <enter> to continue"
    `);

    expect(editAsync).not.toHaveBeenCalled();

    events.keypress('enter');
    expect(editAsync).toHaveBeenCalledOnce();

    await editorAction(undefined, 'test value with waiting message');

    await expect(answer).resolves.toEqual('test value with waiting message');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });

  it('displays custom loadingMessage', async () => {
    let resolveValidation: () => void;
    const { answer, events, getScreen } = await render(editor, {
      message: 'Add a description',
      theme: {
        style: {
          loadingMessage: () => 'Loading...',
        },
      },
      validate: () =>
        new Promise<boolean>((resolve) => {
          resolveValidation = () => resolve(true);
        }),
    });

    expect(editAsync).not.toHaveBeenCalled();
    events.keypress('enter');

    // Trigger the editor callback; validation starts and loadingMessage should appear
    const editPromise = editorAction(undefined, 'test value with loading message');
    events.type('foo'); // Ignored events while validation runs
    await editPromise;
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Add a description Loading..."
    `);

    resolveValidation!();

    await expect(answer).resolves.toEqual('test value with loading message');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Add a description"`);
  });
});
