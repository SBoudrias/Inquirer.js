import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import list from './src/index.ts';

describe('list prompt', () => {
  it('handle simple use case', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter items',
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? Enter items"`);

    events.type('Item 1');
    expect(getScreen()).toMatchInlineSnapshot(`"? Enter items Item 1"`);

    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items
        Item 1
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    events.type('Item 2');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items
        Item 1
        Item 2
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Item 1', 'Item 2']);
  });

  it('handle default values', { timeout: 5000 }, async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter items',
      default: ['Default 1', 'Default 2'],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items
        Default 1
        Default 2
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    events.type('Item 3');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Default 1', 'Default 2', 'Item 3']);
  });

  it('handle navigation mode with tab', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter items',
    });

    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.type('Item 2');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    // Enter navigation mode
    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items
      ❯ Item 1
        Item 2
      ↹ edit • ↑↓ navigate • ⌫ delete • ⌃S submit"
    `);

    // Navigate down
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items
        Item 1
      ❯ Item 2
      ↹ edit • ↑↓ navigate • ⌫ delete • ⌃S submit"
    `);

    // Navigate up
    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items
      ❯ Item 1
        Item 2
      ↹ edit • ↑↓ navigate • ⌫ delete • ⌃S submit"
    `);

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Item 1', 'Item 2']);
  });

  it('return to edit mode from navigation mode', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter items',
    });

    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    // Enter navigation mode
    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items
      ❯ Item 1
      ↹ edit • ↑↓ navigate • ⌫ delete • ⌃S submit"
    `);

    // Exit navigation mode with tab
    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items
        Item 1
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    // Can add more items
    events.type('Item 2');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Item 1', 'Item 2']);
  });

  it('preserve input when switching to navigation mode', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter items',
    });

    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    // Start typing but don't submit
    events.type('Item');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items Item
        Item 1
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    // Enter navigation mode
    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items Item
      ❯ Item 1
      ↹ edit • ↑↓ navigate • ⌫ delete • ⌃S submit"
    `);

    // Exit navigation mode - input should be restored
    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items Item
        Item 1
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    // Continue typing
    events.type(' 2');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Item 1', 'Item 2']);
  });

  it('handle deleting items in navigation mode', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter items',
    });

    events.type('Item 1');
    events.keypress('enter');

    await Promise.resolve();
    await Promise.resolve();

    events.type('Item 2');
    events.keypress('enter');

    await Promise.resolve();
    await Promise.resolve();

    events.type('Item 3');
    events.keypress('enter');

    await Promise.resolve();
    await Promise.resolve();

    // Enter navigation mode
    events.keypress('tab');
    events.keypress('down');

    // Delete Item 2
    events.keypress('backspace');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items
        Item 1
      ❯ Item 3
      ↹ edit • ↑↓ navigate • ⌫ delete • ⌃S submit"
    `);

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Item 1', 'Item 3']);
  });

  it('delete all items returns to edit mode', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter items',
    });

    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress('tab');
    events.keypress('backspace');
    expect(getScreen()).toMatchInlineSnapshot(`"? Enter items"`);

    events.type('New Item');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['New Item']);
  });

  it('navigation bounds are respected', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter items',
    });

    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.type('Item 2');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress('tab');

    // Try to go up from first item
    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items
      ❯ Item 1
        Item 2
      ↹ edit • ↑↓ navigate • ⌫ delete • ⌃S submit"
    `);

    // Go to last item
    events.keypress('down');
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items
        Item 1
      ❯ Item 2
      ↹ edit • ↑↓ navigate • ⌫ delete • ⌃S submit"
    `);

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Item 1', 'Item 2']);
  });

  it('handle synchronous validation', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter numbers',
      validateEntry: (value: string) => /^\d+$/.test(value) || 'Must be a number',
    });

    events.type('abc');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter numbers abc
      > Must be a number"
    `);

    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.type('123');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter numbers
        123
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['123']);
  });

  it('handle asynchronous validation', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter valid items',
      validateEntry: (value: string) => {
        return new Promise<string | boolean>((resolve) => {
          if (value.length >= 3) {
            resolve(true);
          } else {
            resolve('Item must be at least 3 characters');
          }
        });
      },
    });

    events.type('ab');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter valid items ab
      > Item must be at least 3 characters"
    `);

    events.type('c');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter valid items
        abc
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['abc']);
  });

  it('can clear value when validation fails', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter numbers',
      validateEntry: (value: string) => /^\d+$/.test(value) || 'Must be a number',
      theme: {
        validationFailureMode: 'clear',
      },
    });

    events.type('abc');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter numbers
      > Must be a number"
    `);

    events.type('123');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter numbers
        123
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['123']);
  });

  it('handle pattern validation', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter alphanumeric values',
      pattern: /^[a-zA-Z0-9]+$/,
    });

    events.type('test@');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter alphanumeric values test@
      > Invalid input"
    `);

    events.keypress('backspace');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter alphanumeric values
        test
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['test']);
  });

  it('handle pattern validation with custom error message', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter alphanumeric values',
      pattern: /^[a-zA-Z0-9]+$/,
      patternError: 'Only letters and numbers allowed',
    });

    events.type('test@');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter alphanumeric values test@
      > Only letters and numbers allowed"
    `);

    events.keypress('backspace');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['test']);
  });

  it('handle unique validation', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter unique items',
      unique: true,
    });

    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.type('Item 2');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    // Try to add duplicate
    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
    "? Enter unique items Item 1
    > This entry is already in the list
      Item 1
      Item 2
    ↹ navigate • ⏎ add • ⌃S submit"
  `);

    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.type('Item 3');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Item 1', 'Item 2', 'Item 3']);
  });

  it('handle unique validation with custom error', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter unique items',
      unique: true,
      uniqueError: 'Duplicate entry detected',
    });

    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
    "? Enter unique items Item 1
    > Duplicate entry detected
      Item 1
    ↹ navigate • ⏎ add • ⌃S submit"
  `);

    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.keypress('backspace');
    events.type('Item 2');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Item 1', 'Item 2']);
  });

  it('handle list validation', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter items',
      validateList: (values: string[]) => {
        if (values.some((v) => v.includes('forbidden'))) {
          return 'List cannot contain forbidden items';
        }
        return true;
      },
    });

    events.type('good item');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    events.type('forbidden item');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(getScreen()).toMatchInlineSnapshot(`
    "? Enter items forbidden item
    > List cannot contain forbidden items
      good item
    ↹ navigate • ⏎ add • ⌃S submit"
  `);

    Array.from({ length: 'forbidden item'.length }).forEach(() =>
      events.keypress('backspace'),
    );
    events.type('another good item');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['good item', 'another good item']);
  });

  it('handle combined entry and list validation', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter numbers',
      validateEntry: (value: string) => /^\d+$/.test(value) || 'Must be a number',
      validateList: (values: string[]) => {
        const sum = values.reduce((acc, v) => acc + Number(v), 0);
        return sum <= 100 || 'Sum must not exceed 100';
      },
    });

    events.type('50');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    events.type('60');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(getScreen()).toMatchInlineSnapshot(`
    "? Enter numbers 60
    > Sum must not exceed 100
      50
    ↹ navigate • ⏎ add • ⌃S submit"
  `);

    events.keypress('backspace');
    events.keypress('backspace');
    events.type('40');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['50', '40']);
  });

  it('handle min validation', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter at least 2 items',
      min: 2,
    });

    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await Promise.resolve();

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter at least 2 items
      > Please provide at least 2 lines
        Item 1
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    events.type('Item 2');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Item 1', 'Item 2']);
  });

  it('handle max validation', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter at most 2 items',
      max: 2,
    });

    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.type('Item 2');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.type('Item 3');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter at most 2 items Item 3
      > Please provide no more than 2 lines
        Item 1
        Item 2
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Item 1', 'Item 2']);
  });

  it('empty list with min validation', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter at least 1 item',
      min: 1,
    });

    events.keypress({ name: 's', ctrl: true });
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
    "? Enter at least 1 item
    > Please provide at least 1 lines"
  `);

    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Item 1']);
  });

  it('handle transformer', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter items',
      transformer: (value: string, { isFinal }: { isFinal: boolean }) =>
        isFinal ? value.toUpperCase() : `[${value}]`,
    });

    events.type('item');
    expect(getScreen()).toMatchInlineSnapshot(`"? Enter items [item]"`);

    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter items []
        [item]
      ↹ navigate • ⏎ add • ⌃S submit"
    `);

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['item']);
  });

  it('is theme-able', async () => {
    const { answer, events, getScreen } = await render(list, {
      message: 'Enter items',
      theme: {
        prefix: 'Q:',
        style: {
          message: (text: string) => `${text} >>>`,
          error: (text: string) => `!! ${text} !!`,
          answer: (text: string) => `_${text}_`,
        },
      },
    });

    expect(getScreen()).toMatchInlineSnapshot(`"Q: Enter items >>>"`);

    events.type('Item 1');
    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();

    events.keypress({ name: 's', ctrl: true });
    await expect(answer).resolves.toEqual(['Item 1']);
  });
});
