/***
 * Node External Editor
 *
 * Kevin Gravier <kevin@mrkmg.com>
 * MIT 2018
 */

// tslint:disable-next-line:no-var-requires
require('es6-shim');

import Chai = require('chai');
import { readFileSync, statSync, writeFileSync } from 'fs';
import { encode } from 'iconv-lite';
import { dirname } from 'path';
import { edit, editAsync, ExternalEditor } from '../../src';
const assert = Chai.assert;

const testingInput = 'aAbBcCdDeEfFgG';
const expectedResult = 'aAbBcCdDeE';

describe('main', () => {
  let previousVisual: string;
  let editor: ExternalEditor;

  before(() => {
    previousVisual = process.env.VISUAL;
    process.env.VISUAL = 'truncate --size 10';
  });

  beforeEach(() => {
    editor = new ExternalEditor(testingInput);
  });

  afterEach(() => {
    editor.cleanup();
  });

  after(() => {
    process.env.VISUAL = previousVisual;
  });

  it('convenience method ".edit"', () => {
    const text = edit(testingInput);
    assert.equal(text, expectedResult);
  });

  it('convenience method ".editAsync"', (cb) => {
    editAsync(testingInput, (e, text) => {
      assert.equal(text, expectedResult);
      cb();
    });
  });

  it('writes original text to file', () => {
    const contents = readFileSync(editor.tempFile).toString();
    assert.equal(contents, testingInput);
  });

  it('run() returns correctly', () => {
    const text = editor.run();
    assert.equal(text, expectedResult);
    assert.equal(editor.lastExitStatus, 0);
  });

  it('runAsync() callbacks correctly', (cb) => {
    editor.runAsync((e, text) => {
      assert.equal(text, expectedResult);
      assert.equal(editor.lastExitStatus, 0);
      cb();
    });
  });

  it('run() returns text same as editor.text', () => {
    const text = editor.run();
    assert.equal(text, editor.text);
  });

  it('runAsync() callback text same as editor.text', (cb) => {
    editor.runAsync((e, text) => {
      assert.equal(text, editor.text);
      cb();
    });
  });
});

describe('invalid exit code', () => {
  let editor: ExternalEditor;

  beforeEach(() => {
    editor = new ExternalEditor(testingInput);
    editor.editor.bin = 'bash';
    editor.editor.args = ['-c', 'exit 1'];
  });

  afterEach(() => {
    editor.cleanup();
  });

  it('run()', () => {
    editor.run();
    assert.equal(editor.lastExitStatus, 1);
  });

  it('runAsync()', (cb) => {
    editor.runAsync((e, text) => {
      assert.equal(editor.lastExitStatus, 1);
      cb();
    });
  });
});

describe('custom options', () => {
  let editor: ExternalEditor = null;

  afterEach(() => {
    if (editor) {
      editor.cleanup();
    }
    editor = null;
  });

  it('prefix', () => {
    editor = new ExternalEditor('testing', {
      prefix: 'pre',
    });

    assert.match(editor.tempFile, /.+\/pre.+$/);
  });

  it('postfix', () => {
    editor = new ExternalEditor('testing', {
      postfix: 'end.post',
    });

    assert.match(editor.tempFile, /.+end\.post$/);
  });

  it('dir', () => {
    editor = new ExternalEditor('testing', {
      dir: __dirname,
    });

    assert.equal(dirname(editor.tempFile), __dirname);
  });

  it('mode', () => {
    editor = new ExternalEditor('testing', {
      mode: 0o755,
    });

    const stat = statSync(editor.tempFile);
    const int = parseInt(stat.mode.toString(8), 10);

    assert.equal(int, 100755);
  });
});

describe('charsets', () => {
  let previousVisual: string;
  let editor: ExternalEditor;

  before(() => {
    previousVisual = process.env.VISUAL;
    process.env.VISUAL = 'true';
  });

  beforeEach(() => {
    editor = new ExternalEditor('XXX');
  });

  afterEach(() => {
    editor.cleanup();
  });

  after(() => {
    process.env.VISUAL = previousVisual;
  });

  it('empty', () => {
    writeFileSync(editor.tempFile, '');
    const text = editor.run();
    assert.equal(text, '');
  });

  it('utf8', () => {
    const testData = 'काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥';
    const textEncoding = 'utf8';
    writeFileSync(editor.tempFile, encode(testData, textEncoding), {
      encoding: 'binary',
    });
    const result = editor.run();
    assert.equal(testData, result);
  });

  it('utf16', () => {
    const testData = 'काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥';
    const textEncoding = 'utf16';
    writeFileSync(editor.tempFile, encode(testData, textEncoding), {
      encoding: 'binary',
    });
    const result = editor.run();
    assert.equal(testData, result);
  });

  it('win1252', () => {
    const testData = 'Testing 1 2 3 ! @ #';
    const textEncoding = 'win1252';
    writeFileSync(editor.tempFile, encode(testData, textEncoding), {
      encoding: 'binary',
    });
    const result = editor.run();
    assert.equal(testData, result);
  });

  it('Big5', () => {
    const testData = '能 脊 胼 胯 臭 臬 舀 舐 航 舫 舨 般 芻 茫 荒 荔';
    const textEncoding = 'Big5';
    writeFileSync(editor.tempFile, encode(testData, textEncoding), {
      encoding: 'binary',
    });
    const result = editor.run();
    assert.equal(testData, result);
  });
});
