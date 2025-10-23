import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import expand, { Separator } from './src/index.ts';

const overwriteChoices = [
  {
    key: 'y' as const,
    name: 'Overwrite',
    value: 'overwrite',
  },
  {
    key: 'a' as const,
    name: 'Overwrite this one and all next',
    value: 'overwrite_all',
  },
  {
    key: 'd' as const,
    name: 'Show diff',
    value: 'diff',
  },
  {
    key: 'x' as const,
    name: 'Abort',
    value: 'abort',
  },
];

const overwriteChoicesWithoutValue = overwriteChoices.map((choice) => ({
  key: choice.key,
  name: choice.name,
}));

const overwriteChoicesWithoutName = overwriteChoices.map((choice) => ({
  key: choice.key,
  value: choice.value,
}));

describe('expand prompt', () => {
  it('selects in collapsed mode', async () => {
    const { answer, events, getScreen } = await render(expand, {
      message: 'Overwrite this file?',
      choices: overwriteChoices,
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Overwrite this file? (yadxH)"');

    events.type('y');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? (yadxH) y
      >> Overwrite"
    `);

    events.keypress('backspace');
    events.type('a');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? (yadxH) a
      >> Overwrite this one and all next"
    `);

    events.keypress('backspace');
    events.type('d');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? (yadxH) d
      >> Show diff"
    `);

    events.keypress('backspace');
    events.type('x');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? (yadxH) x
      >> Abort"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Overwrite this file? Abort"`);

    await expect(answer).resolves.toEqual('abort');
  });

  it('selects in expanded mode', async () => {
    const { answer, events, getScreen } = await render(expand, {
      message: 'Overwrite this file?',
      choices: overwriteChoices,
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Overwrite this file? (yadxH)"');

    events.type('h');
    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? h
        y) Overwrite
        a) Overwrite this one and all next
        d) Show diff
        x) Abort"
    `);

    events.type('y');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? y
        y) Overwrite
        a) Overwrite this one and all next
        d) Show diff
        x) Abort
      >> Overwrite"
    `);

    events.keypress('backspace');
    events.type('a');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? a
        y) Overwrite
        a) Overwrite this one and all next
        d) Show diff
        x) Abort
      >> Overwrite this one and all next"
    `);

    events.keypress('backspace');
    events.type('d');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? d
        y) Overwrite
        a) Overwrite this one and all next
        d) Show diff
        x) Abort
      >> Show diff"
    `);

    events.keypress('backspace');
    events.type('x');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? x
        y) Overwrite
        a) Overwrite this one and all next
        d) Show diff
        x) Abort
      >> Abort"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Overwrite this file? Abort"`);

    await expect(answer).resolves.toEqual('abort');
  });

  it('supports separators', async () => {
    const { answer, events, getScreen } = await render(expand, {
      message: 'Overwrite this file?',
      choices: [
        {
          value: 'Yarn',
          key: 'y',
        },
        new Separator(),
        {
          value: 'npm',
          key: 'n',
        },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? Overwrite this file? (ynH)"`);

    events.type('h');
    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? h
        y) Yarn
       ──────────────
        n) npm"
    `);

    events.type('y');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? y
        y) Yarn
       ──────────────
        n) npm
      >> Yarn"
    `);

    events.keypress('backspace');
    events.type('n');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? n
        y) Yarn
       ──────────────
        n) npm
      >> npm"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Overwrite this file? npm"`);

    await expect(answer).resolves.toEqual('npm');
  });

  it('selects without value', async () => {
    const { answer, events, getScreen } = await render(expand, {
      message: 'Overwrite this file?',
      choices: overwriteChoicesWithoutValue,
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Overwrite this file? (yadxH)"');

    events.type('y');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? (yadxH) y
      >> Overwrite"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Overwrite this file? Overwrite"');

    await expect(answer).resolves.toEqual('Overwrite');
  });

  it('selects without name', async () => {
    const { answer, events, getScreen } = await render(expand, {
      message: 'Overwrite this file?',
      choices: overwriteChoicesWithoutName,
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Overwrite this file? (yadxH)"');

    events.type('y');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? (yadxH) y
      >> overwrite"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Overwrite this file? overwrite"');

    await expect(answer).resolves.toEqual('overwrite');
  });

  it('handles empty selection', async () => {
    const abortController = new AbortController();
    const { answer, events, getScreen } = await render(
      expand,
      {
        message: 'Overwrite this file?',
        choices: overwriteChoices,
      },
      { signal: abortController.signal },
    );

    expect(getScreen()).toMatchInlineSnapshot('"? Overwrite this file? (yadxH)"');

    // The help option is selected by default. so we'll go in expand mode first
    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file?
        y) Overwrite
        a) Overwrite this one and all next
        d) Show diff
        x) Abort"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file?
        y) Overwrite
        a) Overwrite this one and all next
        d) Show diff
        x) Abort
      > Please input a value"
    `);

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('handles non-existing selection', async () => {
    const abortController = new AbortController();
    const { answer, events, getScreen } = await render(
      expand,
      {
        message: 'Overwrite this file?',
        choices: overwriteChoices,
      },
      { signal: abortController.signal },
    );

    expect(getScreen()).toMatchInlineSnapshot('"? Overwrite this file? (yadxH)"');

    events.type('4');
    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file? (yadxH) 4
      > "4" isn't an available option"
    `);

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('selects without name', async () => {
    const { answer, events, getScreen } = await render(expand, {
      message: 'Overwrite this file?',
      choices: overwriteChoices,
      default: 'y',
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Overwrite this file? (Yadxh)"');

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Overwrite this file? Overwrite"`);

    await expect(answer).resolves.toEqual('overwrite');
  });

  it('can defaults to expanded', async () => {
    const abortController = new AbortController();
    const { answer, getScreen } = await render(
      expand,
      {
        message: 'Overwrite this file?',
        choices: overwriteChoices,
        expanded: true,
      },
      { signal: abortController.signal },
    );

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Overwrite this file?
        y) Overwrite
        a) Overwrite this one and all next
        d) Show diff
        x) Abort"
    `);

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });
});
