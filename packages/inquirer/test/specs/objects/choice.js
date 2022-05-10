import { expect } from 'chai';

import Choice from '../../../lib/objects/choice';
import Separator from '../../../lib/objects/separator';

describe('Choice object', () => {
  it('should normalize accept String as value', () => {
    const choice = new Choice('foo');
    expect(choice.name).to.equal('foo');
    expect(choice.value).to.equal('foo');
  });

  it('should use value|name as default if default property is missing', () => {
    const onlyName = new Choice({ name: 'foo' });
    const onlyVal = new Choice({ value: 'bar' });

    expect(onlyName.name).to.equal('foo');
    expect(onlyName.value).to.equal('foo');
    expect(onlyName.short).to.equal('foo');
    expect(onlyVal.name).to.equal('bar');
    expect(onlyVal.value).to.equal('bar');
    expect(onlyVal.short).to.equal('bar');
  });

  it('should keep extra keys', () => {
    const choice = new Choice({ name: 'foo', extra: '1' });

    expect(choice.extra).to.equal('1');
    expect(choice.name).to.equal('foo');
    expect(choice.value).to.equal('foo');
  });

  it("shouldn't process Separator object", () => {
    const sep = new Choice(new Separator());
    expect(sep).to.be.instanceOf(Separator);
  });

  it("shouldn't process object with property type=separator", () => {
    const obj = { type: 'separator' };
    const sep = new Choice(obj);
    expect(sep).to.equal(obj);
  });
});
