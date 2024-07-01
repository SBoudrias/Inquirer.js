import { describe, it, expect } from 'vitest';

import inquirer from '../../../src/index.mjs';
import Choices from '../../../src/objects/choices.mjs';
import Choice from '../../../src/objects/choice.mjs';
import Separator from '../../../src/objects/separator.mts';

describe('Choices collection', () => {
  it('should create Choice object from array member', () => {
    const choices = new Choices(['bar', { name: 'foo' }]);
    expect(choices.getChoice(0)).toBeInstanceOf(Choice);
    expect(choices.getChoice(1)).toBeInstanceOf(Choice);
  });

  it('should support for number', () => {
    const choices = new Choices([1, 2, 3, 4]);
    expect(choices.getChoice(0)?.value).toEqual(1);
  });

  it('should not process Separator object', () => {
    const sep = new inquirer.Separator();
    const choices = new Choices(['Bar', sep]);
    expect(choices.get(0)).to.have.property('name', 'Bar');
    expect(choices.get(1)).toEqual(sep);
  });

  it('should provide access to length information', () => {
    const choices = new Choices(['Bar', new inquirer.Separator(), 'foo']);
    expect(choices.length).toEqual(3);
    expect(choices.realLength).toEqual(2);

    choices.length = 1;
    expect(choices.length).toEqual(1);
    expect(choices.get(1)).toEqual(undefined);
    expect(() => {
      choices.realLength = 0;
    }).toThrow();
  });

  it('should allow plucking choice content', () => {
    const choices = new Choices([
      { name: 'n', key: 'foo' },
      { name: 'a', key: 'lab' },
    ]);
    expect(choices.pluck('key')).toEqual(['foo', 'lab']);
  });

  it('should allow filtering value with where', () => {
    const choices = new Choices([
      { name: 'n', key: 'foo' },
      { name: 'a', key: 'lab' },
    ]);
    expect(choices.where({ key: 'lab' })).toEqual([
      {
        name: 'a',
        value: 'a',
        short: 'a',
        key: 'lab',
        disabled: false,
      },
    ]);
  });

  it('should façade forEach', () => {
    const raw = ['a', 'b', 'c'];
    const choices = new Choices(raw);
    choices.forEach((val, i) => {
      expect((val as Choice).name).toEqual(raw[i]);
    });
  });

  it('should façade filter', () => {
    const choices = new Choices(['a', 'b', 'c']);
    const filtered = choices.filter(
      (val) => !Separator.isSeparator(val) && val.name === 'a',
    ) as Choice[];
    expect(filtered.length).toEqual(1);
    expect(filtered[0].name).toEqual('a');
  });

  it('should façade push and update the realChoices internally', () => {
    const choices = new Choices(['a', { name: 'b', disabled: true }]);
    choices.push('b', new inquirer.Separator());
    expect(choices.length).toEqual(4);
    expect(choices.realLength).toEqual(2);

    expect(choices.getChoice(0)).toBeInstanceOf(Choice);
    expect(choices.getChoice(0)).to.have.property('name', 'a');
    expect(choices.getChoice(1)).toBeInstanceOf(Choice);
    expect(choices.getChoice(1)).to.have.property('name', 'b');

    expect(choices.get(1)).toBeInstanceOf(Choice);
    expect(choices.get(1)).to.have.property('disabled', true);
    expect(choices.get(3)).toBeInstanceOf(inquirer.Separator);
  });
});
