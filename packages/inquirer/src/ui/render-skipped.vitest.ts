import { styleText } from 'node:util';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeTheme, Separator } from '@inquirer/core';
import { renderSkippedQuestion } from './render-skipped.ts';

afterEach(() => {
  vi.unstubAllEnvs();
});

function getDefaultIdlePrefix(): string {
  const { prefix } = makeTheme();
  return typeof prefix === 'string' ? prefix : prefix['idle'];
}

describe('renderSkippedQuestion', () => {
  it('wraps the rendered question line in dim styling', () => {
    vi.stubEnv('FORCE_COLOR', '1');

    const line = renderSkippedQuestion({
      type: 'confirm',
      message: 'Is it sweet?',
      value: true,
    });

    expect(line).toBe(
      styleText(
        'dim',
        `${getDefaultIdlePrefix()} ${styleText('bold', 'Is it sweet?')} ${styleText('cyan', 'Yes')}`,
      ),
    );
  });

  it('omits the answer section when no value is present', () => {
    vi.stubEnv('FORCE_COLOR', '1');

    const line = renderSkippedQuestion({
      type: 'input',
      message: 'Favorite fruit?',
    });

    expect(line).toBe(
      styleText(
        'dim',
        `${getDefaultIdlePrefix()} ${styleText('bold', 'Favorite fruit?')}`,
      ),
    );
  });

  describe('theme support', () => {
    it('supports a string prefix and an empty string prefix', () => {
      vi.stubEnv('FORCE_COLOR', '0');

      expect(
        renderSkippedQuestion({
          type: 'input',
          message: 'Name?',
          value: 'Ada',
          theme: { prefix: '>' },
        }),
      ).toBe('> Name? Ada');

      expect(
        renderSkippedQuestion({
          type: 'input',
          message: 'Name?',
          value: 'Ada',
          theme: { prefix: '' },
        }),
      ).toBe('Name? Ada');
    });

    it('uses prefix.skipped when provided, falling back to prefix.idle', () => {
      vi.stubEnv('FORCE_COLOR', '0');

      expect(
        renderSkippedQuestion({
          type: 'input',
          message: 'Name?',
          theme: { prefix: { idle: '>', skipped: '-' } },
        }),
      ).toBe('- Name?');

      expect(
        renderSkippedQuestion({
          type: 'input',
          message: 'Name?',
          theme: { prefix: { idle: '>' } },
        }),
      ).toBe('> Name?');
    });

    it('passes status "skipped" to theme.style.message and applies theme.style.answer', () => {
      vi.stubEnv('FORCE_COLOR', '0');
      const styleMessage = vi.fn((text: string, status: string) => `[${status}] ${text}`);
      const styleAnswer = vi.fn((text: string) => `<${text}>`);

      const line = renderSkippedQuestion({
        type: 'input',
        message: 'Name?',
        value: 'Ada',
        theme: {
          style: {
            message: styleMessage,
            answer: styleAnswer,
          },
        },
      });

      expect(styleMessage).toHaveBeenCalledWith('Name?', 'skipped');
      expect(styleAnswer).toHaveBeenCalledWith('Ada');
      expect(line).toBe('? [skipped] Name? <Ada>');
    });
  });

  describe('prompt type formatting', () => {
    it('formats confirm booleans using default and custom keywords or transformer', () => {
      vi.stubEnv('FORCE_COLOR', '0');

      expect(
        renderSkippedQuestion({
          type: 'confirm',
          message: 'Sweet?',
          value: true,
        }),
      ).toBe('? Sweet? Yes');

      expect(
        renderSkippedQuestion({
          type: 'confirm',
          message: 'Sweet?',
          value: false,
        }),
      ).toBe('? Sweet? No');

      expect(
        renderSkippedQuestion({
          type: 'confirm',
          message: 'Sucré?',
          value: false,
          theme: { keywords: { yes: 'Oui', no: 'Non' } },
        }),
      ).toBe('? Sucré? Non');

      expect(
        renderSkippedQuestion({
          type: 'confirm',
          message: 'Sweet?',
          value: true,
          transformer: (value: boolean) => (value ? 'Yup' : 'Nope'),
        }),
      ).toBe('? Sweet? Yup');

      expect(
        renderSkippedQuestion({
          type: 'confirm',
          message: 'Sweet?',
          value: 'custom',
        }),
      ).toBe('? Sweet? custom');

      expect(
        renderSkippedQuestion({
          type: 'confirm',
          message: 'Sweet?',
        }),
      ).toBe('? Sweet?');
    });

    it('masks password values and never displays plaintext passwords', () => {
      vi.stubEnv('FORCE_COLOR', '0');

      expect(
        renderSkippedQuestion({
          type: 'password',
          message: 'Secret?',
          value: 'hunter2',
          mask: true,
        }),
      ).toBe('? Secret? *******');

      expect(
        renderSkippedQuestion({
          type: 'password',
          message: 'Secret?',
          value: 'abc',
          mask: '#',
        }),
      ).toBe('? Secret? ###');

      expect(
        renderSkippedQuestion({
          type: 'password',
          message: 'Secret?',
          value: 'hunter2',
        }),
      ).toBe('? Secret?');

      expect(
        renderSkippedQuestion({
          type: 'password',
          message: 'Secret?',
          mask: true,
        }),
      ).toBe('? Secret?');
    });

    it('resolves choice labels for select, rawlist, and expand prompts', () => {
      vi.stubEnv('FORCE_COLOR', '0');

      const choices = [
        new Separator(),
        'plain',
        { name: 'Red Apple', value: 'apple', short: 'Apple' },
        { name: 'Yellow Banana', value: 'banana' },
        { value: 'raw-only' },
        { name: 'Name Only' },
      ];

      expect(
        renderSkippedQuestion({
          type: 'select',
          message: 'Fruit?',
          value: 'apple',
          choices,
        }),
      ).toBe('? Fruit? Apple');

      expect(
        renderSkippedQuestion({
          type: 'select',
          message: 'Fruit?',
          value: 'banana',
          choices,
        }),
      ).toBe('? Fruit? Yellow Banana');

      expect(
        renderSkippedQuestion({
          type: 'rawlist',
          message: 'Fruit?',
          value: 'plain',
          choices,
        }),
      ).toBe('? Fruit? plain');

      expect(
        renderSkippedQuestion({
          type: 'select',
          message: 'Fruit?',
          value: 'raw-only',
          choices,
        }),
      ).toBe('? Fruit? raw-only');

      expect(
        renderSkippedQuestion({
          type: 'select',
          message: 'Fruit?',
          value: 'Name Only',
          choices,
        }),
      ).toBe('? Fruit? Name Only');

      expect(
        renderSkippedQuestion({
          type: 'select',
          message: 'Fruit?',
          value: 'unmatched',
          choices,
        }),
      ).toBe('? Fruit? unmatched');

      expect(
        renderSkippedQuestion({
          type: 'select',
          message: 'Fruit?',
          value: 'apple',
        }),
      ).toBe('? Fruit? apple');

      expect(
        renderSkippedQuestion({
          type: 'expand',
          message: 'Conflict?',
          value: 'y',
          choices: [
            new Separator(),
            { key: 'y', name: 'Overwrite', value: 'overwrite' },
            { key: 'n', name: 'Skip', value: 'skip' },
          ],
        }),
      ).toBe('? Conflict? Overwrite');
    });

    it('formats checkbox values from default array or checked choices', () => {
      vi.stubEnv('FORCE_COLOR', '0');

      const choices = [
        new Separator(),
        { name: 'Pepperoni', value: 'pep', short: 'Pep', checked: true },
        { name: 'Mushroom', value: 'mush', checked: false },
        { name: 'Olives', value: 'olives', checked: true },
      ];

      expect(
        renderSkippedQuestion({
          type: 'checkbox',
          message: 'Toppings?',
          value: ['pep', 'mush'],
          choices,
        }),
      ).toBe('? Toppings? Pep, Mushroom');

      expect(
        renderSkippedQuestion({
          type: 'checkbox',
          message: 'Toppings?',
          value: ['a', 'b'],
        }),
      ).toBe('? Toppings? a, b');

      expect(
        renderSkippedQuestion({
          type: 'checkbox',
          message: 'Toppings?',
          choices,
        }),
      ).toBe('? Toppings? Pep, Olives');

      expect(
        renderSkippedQuestion({
          type: 'checkbox',
          message: 'Toppings?',
          value: 'single',
        }),
      ).toBe('? Toppings? single');

      expect(
        renderSkippedQuestion({
          type: 'checkbox',
          message: 'Toppings?',
        }),
      ).toBe('? Toppings?');
    });

    it('formats input, number, and custom prompt values', () => {
      vi.stubEnv('FORCE_COLOR', '0');

      expect(
        renderSkippedQuestion({
          type: 'number',
          message: 'Count?',
          value: 0,
        }),
      ).toBe('? Count? 0');

      expect(
        renderSkippedQuestion({
          type: 'input',
          message: 'Tag?',
          value: 'v1',
          transformer: (val: string, opts: { isFinal: boolean }) =>
            opts.isFinal ? val.toUpperCase() : val,
        }),
      ).toBe('? Tag? V1');

      expect(
        renderSkippedQuestion({
          type: 'input',
          message: 'Empty?',
          value: '',
        }),
      ).toBe('? Empty?');

      expect(
        renderSkippedQuestion({
          type: 'custom',
          message: 'Items?',
          value: ['x', 'y'],
        }),
      ).toBe('? Items? x, y');

      expect(
        renderSkippedQuestion({
          type: 'custom',
          message: 'Meta?',
          value: { a: 1 },
        }),
      ).toBe('? Meta? {"a":1}');
    });
  });
});
