import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import iconv from 'iconv-lite';
import { dirname } from 'node:path';
import { edit, editAsync, ExternalEditor } from '../src/index.ts';

const testingInput = 'aAbBcCdDeEfFgG';
const expectedResult = 'aAbBcCdDeE';

describe('main', () => {
  let previousVisual: string | undefined;
  let editor: ExternalEditor;

  beforeAll(() => {
    previousVisual = process.env['VISUAL'];
    process.env['VISUAL'] = 'truncate --size 10';
  });

  beforeEach(() => {
    editor = new ExternalEditor(testingInput);
  });

  afterEach(() => {
    editor.cleanup();
  });

  afterAll(() => {
    process.env['VISUAL'] = previousVisual;
  });

  it('convenience function `edit`', () => {
    const text = edit(testingInput);
    expect(text).toBe(expectedResult);
  });

  it('convenience function `editAsync`', async () => {
    const text = await new Promise((resolve) => {
      editAsync(testingInput, (error, text) => {
        expect(error).toBeUndefined();
        resolve(text);
      });
    });

    expect(text).toBe(expectedResult);
  });

  it('writes original text to file', () => {
    const contents = readFileSync(editor.tempFile).toString();
    expect(contents).toBe(testingInput);
  });

  it('run() returns correctly', () => {
    const text = editor.run();
    expect(text).toBe(expectedResult);
    expect(editor.lastExitStatus).toBe(0);
  });

  it('runAsync() callbacks correctly', async () => {
    const text = await new Promise<string | undefined>((resolve) => {
      editor.runAsync((error, text) => {
        expect(error).toBeUndefined();
        resolve(text);
      });
    });

    expect(text).toBe(expectedResult);
    expect(editor.lastExitStatus).toBe(0);
  });

  it('run() returns text same as editor.text', () => {
    const text = editor.run();
    expect(text).toBe(editor.text);
  });

  it('runAsync() callback text same as editor.text', async () => {
    const text = await new Promise<string | undefined>((resolve) => {
      editor.runAsync((error, text) => {
        expect(error).toBeUndefined();
        resolve(text);
      });
    });

    expect(text).toBe(editor.text);
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
    expect(editor.lastExitStatus).toBe(1);
  });

  it('runAsync()', async () => {
    await new Promise<void>((resolve) => {
      editor.runAsync((error) => {
        expect(error).toBeUndefined();
        resolve();
      });
    });

    expect(editor.lastExitStatus).toBe(1);
  });
});

describe('custom options', () => {
  let editor: ExternalEditor | null = null;

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

    expect(editor.tempFile).toMatch(/.+\/pre.+$/);
  });

  it('postfix', () => {
    editor = new ExternalEditor('testing', {
      postfix: 'end.post',
    });

    expect(editor.tempFile).toMatch(/.+end\.post$/);
  });

  it('dir', () => {
    editor = new ExternalEditor('testing', {
      dir: __dirname,
    });

    expect(dirname(editor.tempFile)).toBe(__dirname);
  });

  it('mode', () => {
    editor = new ExternalEditor('testing', {
      mode: 0o755,
    });

    const stat = statSync(editor.tempFile);
    const int = parseInt(stat.mode.toString(8), 10);

    expect(int).toBe(100755);
  });
});

describe('charsets', () => {
  let previousVisual: string | undefined;
  let editor: ExternalEditor;

  beforeAll(() => {
    previousVisual = process.env['VISUAL'];
    process.env['VISUAL'] = 'true';
  });

  beforeEach(() => {
    editor = new ExternalEditor('XXX');
  });

  afterEach(() => {
    editor.cleanup();
  });

  afterAll(() => {
    process.env['VISUAL'] = previousVisual;
  });

  it('empty', () => {
    writeFileSync(editor.tempFile, '');
    const text = editor.run();
    expect(text).toBe('');
  });

  it('utf8', () => {
    const testData = 'काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥';
    const textEncoding = 'utf8';
    writeFileSync(editor.tempFile, iconv.encode(testData, textEncoding), {
      encoding: 'binary',
    });
    const result = editor.run();
    expect(result).toBe(testData);
  });

  it('utf16', () => {
    const testData = 'काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥';
    const textEncoding = 'utf16';
    writeFileSync(editor.tempFile, iconv.encode(testData, textEncoding), {
      encoding: 'binary',
    });
    const result = editor.run();
    expect(result).toBe(testData);
  });

  it('win1252', () => {
    const testData = 'Testing 1 2 3 ! @ #';
    const textEncoding = 'win1252';
    writeFileSync(editor.tempFile, iconv.encode(testData, textEncoding), {
      encoding: 'binary',
    });
    const result = editor.run();
    expect(result).toBe(testData);
  });

  it('Big5', () => {
    const testData = '能 脊 胼 胯 臭 臬 舀 舐 航 舫 舨 般 芻 茫 荒 荔';
    const textEncoding = 'Big5';
    writeFileSync(editor.tempFile, iconv.encode(testData, textEncoding), {
      encoding: 'binary',
    });
    const result = editor.run();
    expect(result).toBe(testData);
  });
});
