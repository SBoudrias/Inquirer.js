import { beforeEach, describe, it, expect } from 'vitest';
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
    expect(question).not.toEqual(base.opt);
    expect(question.name).toEqual(base.opt.name);
    expect(question.message).toEqual(base.opt.message);
  });
});
