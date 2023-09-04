import { describe, it, expect } from 'vitest';

import Choice from '../../../lib/objects/choice.js';
import Separator from '../../../lib/objects/separator.js';

describe('Choice object', () => {
  it('should normalize accept String as value', () => {
    const choice = new Choice('foo');
    expect(choice.name).toEqual('foo');
    expect(choice.value).toEqual('foo');
  });

  it('should use value|name as default if default property is missing', () => {
    const onlyName = new Choice({ name: 'foo' });
    const onlyVal = new Choice({ value: 'bar' });

    expect(onlyName.name).toEqual('foo');
    expect(onlyName.value).toEqual('foo');
    expect(onlyName.short).toEqual('foo');
    expect(onlyVal.name).toEqual('bar');
    expect(onlyVal.value).toEqual('bar');
    expect(onlyVal.short).toEqual('bar');
  });

  it('should keep extra keys', () => {
    const choice = new Choice({ name: 'foo', extra: '1' });

    expect(choice.extra).toEqual('1');
    expect(choice.name).toEqual('foo');
    expect(choice.value).toEqual('foo');
  });

  it("shouldn't process Separator object", () => {
    const sep = new Choice(new Separator());
    expect(sep).toBeInstanceOf(Separator);
  });

  it("shouldn't process object with property type=separator", () => {
    const obj = { type: 'separator' };
    const sep = new Choice(obj);
    expect(sep).toEqual(obj);
  });
});
