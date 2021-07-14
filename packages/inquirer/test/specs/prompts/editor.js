const { expect } = require('chai');
const _ = require('lodash');
const ReadlineStub = require('../../helpers/readline');
const fixtures = require('../../helpers/fixtures');

const Editor = require('../../../lib/prompts/editor');

describe('`editor` prompt', () => {
  beforeEach(function () {
    this.previousVisual = process.env.VISUAL;
    // Writes the word "testing" to the file
    process.env.VISUAL = 'node ./test/bin/write.js testing';
    this.fixture = _.clone(fixtures.editor);
    this.rl = new ReadlineStub();
  });

  afterEach(function () {
    process.env.VISUAL = this.previousVisual;
  });

  it('should retrieve temporary files contents', function () {
    const prompt = new Editor(this.fixture, this.rl);

    const promise = prompt.run();
    this.rl.emit('line', '');

    return promise.then((answer) => expect(answer).to.equal('testing'));
  });
});
