var expect = require('chai').expect;
var _ = require('lodash');
var ReadlineStub = require('../../helpers/readline');
var fixtures = require('../../helpers/fixtures');

var Editor = require('../../../lib/prompts/editor');

describe('`editor` prompt', function () {
  beforeEach(function () {
    this.previous_visual = process.env.VISUAL;
    process.env.VISUAL = "truncate --size 0";
    this.fixture = _.clone(fixtures.editor);
    this.rl = new ReadlineStub();
  });

  afterEach(function () {
    process.env.VISUAL = this.previous_visual;
  });

  it('should use raw value from the users editor', function (done) {
    var input = new Editor(this.fixture, this.rl);

    input.run().then(function (answer) {
      expect(answer).to.equal('');
      done();
    });

    this.rl.emit('line', '');
  });

  it('should output filtered value', function () {
    this.fixture.filter = function () {
      return 'pass';
    };

    var prompt = new Editor(this.fixture, this.rl);

    var promise = prompt.run();
    this.rl.emit('line', '');

    return promise.then(function () {
      expect(this.rl.output.__raw__).to.contain('pass');
    }.bind(this));
  });
});
