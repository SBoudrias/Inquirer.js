import { expect } from 'chai';
import ReadlineStub from '../../helpers/readline';

import Base from '../../../lib/prompts/base';

describe('`base` prompt (e.g. prompt helpers)', () => {
  beforeEach(function () {
    this.rl = new ReadlineStub();
    this.base = new Base(
      {
        message: 'foo bar',
        name: 'name',
      },
      this.rl
    );
  });

  it('should not point by reference to the entry `question` object', function () {
    const question = {
      message: 'foo bar',
      name: 'name',
    };
    const base = new Base(question, this.rl);
    expect(question).to.not.equal(base.opt);
    expect(question.name).to.equal(base.opt.name);
    expect(question.message).to.equal(base.opt.message);
  });
});
