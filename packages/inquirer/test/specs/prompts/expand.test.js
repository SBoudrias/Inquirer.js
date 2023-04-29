import { beforeEach, describe, it } from 'vitest';
import { expect } from 'chai';
import ReadlineStub from '../../helpers/readline.js';
import fixtures from '../../helpers/fixtures.js';

import Expand from '../../../lib/prompts/expand.js';

describe('`expand` prompt', () => {
  let fixture;
  let rl;
  let expand;

  beforeEach(() => {
    fixture = { ...fixtures.expand };
    rl = new ReadlineStub();
    expand = new Expand(fixture, rl);
  });

  it('should throw if `key` is missing', () => {
    expect(() => {
      fixture.choices = ['a', 'a'];
      return new Expand(fixture, rl);
    }).to.throw(/Format error/);
  });

  it('should throw if `key` is duplicate', () => {
    expect(() => {
      fixture.choices = [
        { key: 'a', name: 'foo' },
        { key: 'a', name: 'foo' },
      ];
      return new Expand(fixture, rl);
    }).to.throw(/Duplicate key error/);
  });

  it('should throw if `key` is duplicate case insensitive', () => {
    expect(() => {
      fixture.choices = [
        { key: 'a', name: 'foo' },
        { key: 'A', name: 'foo' },
      ];
      return new Expand(fixture, rl);
    }).to.throw(/Duplicate key error/);
  });

  it('should throw if `key` is `h`', () => {
    expect(() => {
      fixture.choices = [{ key: 'h', name: 'foo' }];
      return new Expand(fixture, rl);
    }).to.throw(/Reserved key error/);
  });

  it('should allow false as a value', () => {
    const promise = expand.run();

    rl.emit('line', 'd');
    return promise.then((answer) => {
      expect(answer).to.equal(false);
    });
  });

  it('pass the value as answer, and display short on the prompt', () => {
    fixture.choices = [
      { key: 'a', name: 'A Name', value: 'a value', short: 'ShortA' },
      { key: 'b', name: 'B Name', value: 'b value', short: 'ShortB' },
    ];
    const prompt = new Expand(fixture, rl);
    const promise = prompt.run();
    rl.emit('line', 'b');

    return promise.then((answer) => {
      expect(answer).to.equal('b value');
      expect(rl.output.__raw__).to.match(/ShortB/);
    });
  });

  it('should use a string the `default` value', () =>
    new Promise((done) => {
      fixture.default = 'chile';
      expand = new Expand(fixture, rl);

      expand.run().then((answer) => {
        expect(answer).to.equal('chile');
        done();
      });
      rl.emit('line');
    }));

  it('should use the `default` argument value', () =>
    new Promise((done) => {
      fixture.default = 1;
      expand = new Expand(fixture, rl);

      expand.run().then((answer) => {
        expect(answer).to.equal('bar');
        done();
      });
      rl.emit('line');
    }));

  it('should return the user input', () =>
    new Promise((done) => {
      expand.run().then((answer) => {
        expect(answer).to.equal('bar');
        done();
      });
      rl.emit('line', 'b');
    }));

  it('should strip the user input', () =>
    new Promise((done) => {
      expand.run().then((answer) => {
        expect(answer).to.equal('bar');
        done();
      });
      rl.emit('line', ' b ');
    }));

  it('should have help option', () =>
    new Promise((done) => {
      expand.run().then((answer) => {
        expect(rl.output.__raw__).to.match(/a\) acab/);
        expect(rl.output.__raw__).to.match(/b\) bar/);
        expect(answer).to.equal('chile');
        done();
      });
      rl.emit('line', 'h');
      rl.emit('line', 'c');
    }));

  it('should not allow invalid command', () => {
    const promise = expand.run();

    rl.emit('line', 'blah');
    setTimeout(() => {
      rl.emit('line', 'a');
    }, 10);
    return promise;
  });

  it('should display and capitalize the default choice `key`', () => {
    fixture.default = 1;
    expand = new Expand(fixture, rl);

    expand.run();
    expect(rl.output.__raw__).to.contain('(aBcdh)');
  });

  it('should display and capitalize the default choice by name value', () => {
    fixture.default = 'chile';
    expand = new Expand(fixture, rl);

    expand.run();
    expect(rl.output.__raw__).to.contain('(abCdh)');
  });

  it('should display and capitalize the default choice H (Help) `key` if no string default matched', () => {
    fixture.default = 'chile!';
    expand = new Expand(fixture, rl);

    expand.run();
    expect(rl.output.__raw__).to.contain('(abcdH)');
  });

  it('should display and capitalize the default choice H (Help) `key` if none provided', () => {
    delete fixture.default;
    expand = new Expand(fixture, rl);
    expand.run();

    expect(rl.output.__raw__).to.contain('(abcdH)');
  });

  it("should 'autocomplete' the user input", () =>
    new Promise((done) => {
      expand = new Expand(fixture, rl);
      expand.run();
      rl.line = 'a';
      rl.emit('keypress');
      setTimeout(() => {
        expect(rl.output.__raw__).to.contain('acab');
        done();
      }, 10);
    }));
});
