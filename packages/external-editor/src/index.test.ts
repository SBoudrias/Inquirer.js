import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import iconv from 'iconv-lite';
import path from 'node:path';
import { edit, editAsync, ExternalEditor } from './index.ts';
import { parseEditorCommand } from './parse-editor-command.ts';

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

  afterAll(() => {
    process.env['VISUAL'] = previousVisual;
  });

  it('convenience function `edit`', () => {
    const text = edit(testingInput);
    expect(text).toBe(expectedResult);
  });

  it('convenience function `editAsync`', async () => {
    const text = await editAsync(testingInput);
    expect(text).toBe(expectedResult);
  });

  it('run() returns correctly', () => {
    const text = editor.run();
    expect(text).toBe(expectedResult);
    expect(editor.lastExitStatus).toBe(0);
  });

  it('runAsync() returns correctly', async () => {
    const text = await editor.runAsync();
    expect(text).toBe(expectedResult);
    expect(editor.lastExitStatus).toBe(0);
  });
});

describe('parseEditorCommand', () => {
  it('simple binary name', () => {
    expect(parseEditorCommand('vim')).toEqual({ bin: 'vim', args: [] });
  });

  it('binary with arguments', () => {
    expect(parseEditorCommand('notepad --test')).toEqual({
      bin: 'notepad',
      args: ['--test'],
    });
  });

  it('path containing spaces and no quotes', () => {
    // Without quotes, splits on the first space
    expect(
      parseEditorCommand('C:\\Program Files (x86)\\Notepad++\\notepad++.exe'),
    ).toEqual({
      bin: 'C:\\Program',
      args: ['Files', '(x86)\\Notepad++\\notepad++.exe'],
    });
  });

  it('quoted path without arguments', () => {
    expect(
      parseEditorCommand('"C:\\Program Files (x86)\\Notepad++\\notepad++.exe"'),
    ).toEqual({
      bin: 'C:\\Program Files (x86)\\Notepad++\\notepad++.exe',
      args: [],
    });
  });

  it('quoted path with arguments', () => {
    expect(
      parseEditorCommand(
        '"C:\\Program Files (x86)\\Notepad++\\notepad++.exe" --wait --line 10',
      ),
    ).toEqual({
      bin: 'C:\\Program Files (x86)\\Notepad++\\notepad++.exe',
      args: ['--wait', '--line', '10'],
    });
  });

  it('unmatched quote treats rest as binary', () => {
    expect(parseEditorCommand('"unclosed path')).toEqual({
      bin: 'unclosed path',
      args: [],
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

  it('run()', () => {
    editor.run();
    expect(editor.lastExitStatus).toBe(1);
  });

  it('runAsync()', async () => {
    await editor.runAsync();
    expect(editor.lastExitStatus).toBe(1);
  });
});

// Helper: inline node script that writes the received tempFile path to a capture file.
// argv layout when spawned via spawnSync with -e: [node, captureFile, tempFilePath]
const capturePathScript =
  "const fs=require('fs'); fs.writeFileSync(process.argv[1], process.argv[2])";

// Helper: inline node script that captures the stat mode of the tempFile.
// argv layout when spawned via spawnSync with -e: [node, captureFile, tempFilePath]
const captureModeScript =
  "const fs=require('fs'); const s=fs.statSync(process.argv[2]); fs.writeFileSync(process.argv[1], String(s.mode))";

describe('custom options', () => {
  it('prefix', () => {
    const captureFile = path.join(os.tmpdir(), randomUUID());
    const editor = new ExternalEditor('testing', { prefix: 'pre' });
    editor.editor = {
      bin: process.execPath,
      args: ['-e', capturePathScript, captureFile],
    };
    editor.run();
    const usedPath = readFileSync(captureFile, 'utf8');
    unlinkSync(captureFile);
    const escapedSep = path.sep.replace(/\\/g, '\\\\');
    expect(usedPath).toMatch(new RegExp(`.+${escapedSep}pre.+$`));
  });

  it('postfix', () => {
    const captureFile = path.join(os.tmpdir(), randomUUID());
    const editor = new ExternalEditor('testing', { postfix: 'end.post' });
    editor.editor = {
      bin: process.execPath,
      args: ['-e', capturePathScript, captureFile],
    };
    editor.run();
    const usedPath = readFileSync(captureFile, 'utf8');
    unlinkSync(captureFile);
    expect(usedPath).toMatch(/.+end\.post$/);
  });

  it('dir', () => {
    const captureFile = path.join(os.tmpdir(), randomUUID());
    const editor = new ExternalEditor('testing', { dir: import.meta.dirname });
    editor.editor = {
      bin: process.execPath,
      args: ['-e', capturePathScript, captureFile],
    };
    editor.run();
    const usedPath = readFileSync(captureFile, 'utf8');
    unlinkSync(captureFile);
    expect(path.dirname(usedPath)).toBe(import.meta.dirname);
  });

  it('mode', () => {
    const captureFile = path.join(os.tmpdir(), randomUUID());
    const editor = new ExternalEditor('testing', { mode: 0o755 });
    editor.editor = {
      bin: process.execPath,
      args: ['-e', captureModeScript, captureFile],
    };
    editor.run();
    const modeStr = readFileSync(captureFile, 'utf8');
    unlinkSync(captureFile);
    const int = parseInt(parseInt(modeStr, 10).toString(8), 10);

    if (process.platform.startsWith('win')) {
      // windows can't set executable bits in chmod so the max is 666
      expect(int).toBe(100666);
    } else {
      expect(int).toBe(100755);
    }
  });
});

// Helper: inline node script that writes hex-encoded content to the tempFile.
// argv layout when spawned via spawnSync with -e: [node, hexData, tempFilePath]
const writeEncodedScript =
  "const fs=require('fs'); fs.writeFileSync(process.argv[2], Buffer.from(process.argv[1], 'hex'))";

describe('charsets', () => {
  it('empty', () => {
    const editor = new ExternalEditor('XXX');
    editor.editor = { bin: process.execPath, args: ['-e', writeEncodedScript, ''] };
    const text = editor.run();
    expect(text).toBe('');
  });

  it('utf8', () => {
    const testData = 'काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥';
    const hex = Buffer.from(iconv.encode(testData, 'utf8')).toString('hex');
    const editor = new ExternalEditor('XXX');
    editor.editor = { bin: process.execPath, args: ['-e', writeEncodedScript, hex] };
    const result = editor.run();
    expect(result).toBe(testData);
  });

  it('utf16', () => {
    const testData = 'काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥';
    const hex = Buffer.from(iconv.encode(testData, 'utf16')).toString('hex');
    const editor = new ExternalEditor('XXX');
    editor.editor = { bin: process.execPath, args: ['-e', writeEncodedScript, hex] };
    const result = editor.run();
    expect(result).toBe(testData);
  });

  it('win1252', () => {
    const testData = 'Testing 1 2 3 ! @ #';
    const hex = Buffer.from(iconv.encode(testData, 'win1252')).toString('hex');
    const editor = new ExternalEditor('XXX');
    editor.editor = { bin: process.execPath, args: ['-e', writeEncodedScript, hex] };
    const result = editor.run();
    expect(result).toBe(testData);
  });

  it('Big5', () => {
    const testData = '能 脊 胼 胯 臭 臬 舀 舐 航 舫 舨 般 芻 茫 荒 荔';
    const hex = Buffer.from(iconv.encode(testData, 'Big5')).toString('hex');
    const editor = new ExternalEditor('XXX');
    editor.editor = { bin: process.execPath, args: ['-e', writeEncodedScript, hex] };
    const result = editor.run();
    expect(result).toBe(testData);
  });
});
