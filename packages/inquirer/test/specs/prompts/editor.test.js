import { beforeEach, afterEach, describe, it } from 'vitest';
import { expect } from 'vitest';
import { createRequire } from 'node:module';
import ReadlineStub from '../../helpers/readline.js';
import fixtures from '../../helpers/fixtures.js';

import Editor from '../../../lib/prompts/editor.js';

const defaultVisual = process.env.VISUAL;

const require = createRequire(import.meta.url);
const writeBin = require.resolve('../../bin/write.js');
const answer = 'testing';

describe('`editor` prompt', () => {
  let fixture;
  let rl;

  beforeEach(() => {
    // Writes the word "testing" to the file
    process.env.VISUAL = `node ${writeBin} ${answer}`;

    fixture = { ...fixtures.editor };
    rl = new ReadlineStub();
  });

  afterEach(() => {
    process.env.VISUAL = defaultVisual;
  });

  it('should retrieve temporary files contents', async () => {
    const prompt = new Editor(fixture, rl);

    const promise = prompt.run();
    rl.emit('line', '');
    const answer = await promise;

    expect(answer).toEqual(answer);
  });

  it('should open editor without waiting for the user to press enter', async () => {
    const prompt = new Editor({ ...fixture, waitUserInput: false }, rl);

    const answer = await prompt.run();

    expect(answer).toEqual(answer);
  });
});
