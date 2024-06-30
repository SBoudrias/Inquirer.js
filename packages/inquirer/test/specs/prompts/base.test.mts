import { beforeEach, describe, it, expect } from 'vitest';
import ReadlineStub from '../../helpers/readline.mjs';

import Base from '../../../src/prompts/base.mjs';

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
    // @ts-expect-error 2024-06-29
    expect(question.name).toEqual(base.opt.name);
    // @ts-expect-error 2024-06-29
    expect(question.message).toEqual(base.opt.message);
  });
});
