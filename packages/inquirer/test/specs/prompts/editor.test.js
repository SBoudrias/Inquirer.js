import { expect } from 'chai';
import ReadlineStub from '../../helpers/readline.js';
import fixtures from '../../helpers/fixtures.js';

import Editor from '../../../lib/prompts/editor.js';

describe('`editor` prompt', () => {
  beforeEach(function () {
    this.previousVisual = process.env.VISUAL;
    // Writes the word "testing" to the file
    process.env.VISUAL = 'node ./test/bin/write.js testing';
    this.fixture = { ...fixtures.editor };
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

  it('should open editor without waiting for the user to press enter', function () {
    this.fixture.waitUserInput = false;
    const prompt = new Editor(this.fixture, this.rl);

    const promise = prompt.run();

    return promise.then((answer) => expect(answer).to.equal('testing'));
  });
});
