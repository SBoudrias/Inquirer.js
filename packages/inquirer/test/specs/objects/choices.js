const { expect } = require('chai');

const inquirer = require('../../../lib/inquirer');
const Choices = require('../../../lib/objects/choices');
const Choice = require('../../../lib/objects/choice');

describe('Choices collection', () => {
  it('should create Choice object from array member', () => {
    const choices = new Choices(['bar', { name: 'foo' }]);
    expect(choices.getChoice(0)).to.be.instanceOf(Choice);
    expect(choices.getChoice(1)).to.be.instanceOf(Choice);
  });

  it('should support for number', () => {
    const choices = new Choices([1, 2, 3, 4]);
    expect(choices.getChoice(0).value).to.equal(1);
  });

  it('should not process Separator object', () => {
    const sep = new inquirer.Separator();
    const choices = new Choices(['Bar', sep]);
    expect(choices.get(0).name).to.equal('Bar');
    expect(choices.get(1)).to.equal(sep);
  });

  it('should provide access to length information', () => {
    const choices = new Choices(['Bar', new inquirer.Separator(), 'foo']);
    expect(choices.length).to.equal(3);
    expect(choices.realLength).to.equal(2);

    choices.length = 1;
    expect(choices.length).to.equal(1);
    expect(choices.get(1)).to.equal(undefined);
    expect(() => {
      choices.realLength = 0;
    }).to.throw();
  });

  it('should allow plucking choice content', () => {
    const choices = new Choices([
      { name: 'n', key: 'foo' },
      { name: 'a', key: 'lab' },
    ]);
    expect(choices.pluck('key')).to.eql(['foo', 'lab']);
  });

  it('should allow filtering value with where', () => {
    const choices = new Choices([
      { name: 'n', key: 'foo' },
      { name: 'a', key: 'lab' },
    ]);
    expect(choices.where({ key: 'lab' })).to.eql([
      {
        name: 'a',
        value: 'a',
        short: 'a',
        key: 'lab',
        disabled: undefined,
      },
    ]);
  });

  it('should façade forEach', () => {
    const raw = ['a', 'b', 'c'];
    const choices = new Choices(raw);
    choices.forEach((val, i) => {
      expect(val.name).to.equal(raw[i]);
    });
  });

  it('should façade filter', () => {
    const choices = new Choices(['a', 'b', 'c']);
    const filtered = choices.filter((val) => val.name === 'a');
    expect(filtered.length).to.equal(1);
    expect(filtered[0].name).to.equal('a');
  });

  it('should façade push and update the realChoices internally', () => {
    const choices = new Choices(['a', { name: 'b', disabled: true }]);
    choices.push('b', new inquirer.Separator());
    expect(choices.length).to.equal(4);
    expect(choices.realLength).to.equal(2);
    expect(choices.getChoice(0)).to.be.instanceOf(Choice).and.have.property('name', 'a');
    expect(choices.getChoice(1)).to.be.instanceOf(Choice).and.have.property('name', 'b');
    expect(choices.get(1)).to.be.instanceOf(Choice).and.have.property('disabled', true);
    expect(choices.get(3)).to.be.instanceOf(inquirer.Separator);
  });
});
