var expect = require('chai').expect;
var _ = require('lodash');
var ReadlineStub = require('../../helpers/readline');
var fixtures = require('../../helpers/fixtures');

var Editor = require('../../../lib/prompts/editor');

describe('`editor` prompt', function() {
  beforeEach(function() {
    this.previousVisual = process.env.VISUAL;
    // Writes the word "testing" to the file
    process.env.VISUAL = 'node ./test/bin/write.js testing';
    this.fixture = _.clone(fixtures.editor);
    this.rl = new ReadlineStub();
  });

  afterEach(function() {
    process.env.VISUAL = this.previousVisual;
  });

  it('should retrieve temporary files contents', function() {
    var prompt = new Editor(this.fixture, this.rl);

    var promise = prompt.run();
    this.rl.emit('line', '');

    return promise.then(answer => {
      return expect(answer).to.equal('testing');
    });
  });
});
