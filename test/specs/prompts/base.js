var expect = require('chai').expect;
var ReadlineStub = require('../../helpers/readline');

var Base = require('../../../lib/prompts/base');

describe('`base` prompt (e.g. prompt helpers)', function () {
  beforeEach(function () {
    this.rl = new ReadlineStub();
    this.base = new Base({
      message: 'foo bar',
      name: 'name'
    }, this.rl);
  });

  it('should not point by reference to the entry `question` object', function () {
    var question = {
      message: 'foo bar',
      name: 'name'
    };
    var base = new Base(question, this.rl);
    expect(question).to.not.equal(base.opt);
    expect(question.name).to.equal(base.opt.name);
    expect(question.message).to.equal(base.opt.message);
  });

  // You could erase `base._run` and this test and nothing would change.
  it('should have a dummy run', function (done) {
    this.base.run().then(function () {
      done();
    });
  });
});
