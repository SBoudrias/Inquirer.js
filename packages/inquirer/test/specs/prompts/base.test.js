import { beforeEach, describe, it } from 'vitest';
import { expect } from 'chai';
import ReadlineStub from '../../helpers/readline.js';

import Base from '../../../lib/prompts/base.js';

describe('`base` prompt (e.g. prompt helpers)', () => {
  let rl;

  beforeEach(() => {
    rl = new ReadlineStub();
  });

  it('should not point by reference to the entry `question` object', () => {
    const question = {
      message: 'foo bar',
      name: 'name',
    };
    const base = new Base(question, rl);
    expect(question).to.not.equal(base.opt);
    expect(question.name).to.equal(base.opt.name);
    expect(question.message).to.equal(base.opt.message);
  });
});
