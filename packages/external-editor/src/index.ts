import { detect } from 'chardet';
import { spawn, spawnSync } from 'child_process';
import { readFileSync, unlinkSync, type WriteFileOptions, writeFileSync } from 'fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import iconv from 'iconv-lite';
import { CreateFileError } from './errors/CreateFileError.ts';
import { LaunchEditorError } from './errors/LaunchEditorError.ts';
import { ReadFileError } from './errors/ReadFileError.ts';
import { RemoveFileError } from './errors/RemoveFileError.ts';

export interface IEditorParams {
  args: string[];
  bin: string;
}

export interface IFileOptions {
  prefix?: string;
  postfix?: string;
  mode?: number;
  template?: string;
  dir?: string;
}

export type StringCallback = (err: Error | undefined, result: string | undefined) => void;
export type VoidCallback = () => void;
export { CreateFileError, LaunchEditorError, ReadFileError, RemoveFileError };

export function edit(text: string = '', fileOptions?: IFileOptions): string {
  const editor = new ExternalEditor(text, fileOptions);
  editor.run();
  editor.cleanup();
  return editor.text;
}

export function editAsync(
  text: string = '',
  callback: StringCallback,
  fileOptions?: IFileOptions,
): void {
  const editor = new ExternalEditor(text, fileOptions);
  editor.runAsync((err: Error | undefined, result: string | undefined) => {
    if (err) {
      setImmediate(callback, err, undefined);
    } else {
      try {
        editor.cleanup();
        setImmediate(callback, undefined, result);
      } catch (cleanupError) {
        setImmediate(callback, cleanupError as Error, undefined);
      }
    }
  });
}

function sanitizeAffix(affix?: string): string {
  if (!affix) return '';
  return affix.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

function splitStringBySpace(str: string): string[] {
  const pieces: string[] = [];
  let currentString = '';
  for (let strIndex = 0; strIndex < str.length; strIndex++) {
    const currentLetter = str.charAt(strIndex);
    if (
      strIndex > 0 &&
      currentLetter === ' ' &&
      str[strIndex - 1] !== '\\' &&
      currentString.length > 0
    ) {
      pieces.push(currentString);
      currentString = '';
    } else {
      currentString = `${currentString}${currentLetter}`;
    }
  }
  if (currentString.length > 0) {
    pieces.push(currentString);
  }
  return pieces;
}

export class ExternalEditor {
  public text: string = '';
  public tempFile!: string;
  public editor!: IEditorParams;
  public lastExitStatus: number = 0;
  private fileOptions: IFileOptions = {};

  public get temp_file(): string {
    console.log('DEPRECATED: temp_file. Use tempFile moving forward.');
    return this.tempFile;
  }

  public get last_exit_status(): number {
    console.log('DEPRECATED: last_exit_status. Use lastExitStatus moving forward.');
    return this.lastExitStatus;
  }

  constructor(text: string = '', fileOptions?: IFileOptions) {
    this.text = text;

    if (fileOptions) {
      this.fileOptions = fileOptions;
    }

    this.determineEditor();
    this.createTemporaryFile();
  }

  public run(): string {
    this.launchEditor();
    this.readTemporaryFile();
    return this.text;
  }

  public runAsync(callback: StringCallback): void {
    try {
      this.launchEditorAsync(() => {
        try {
          this.readTemporaryFile();
          setImmediate(callback, undefined, this.text);
        } catch (readError) {
          setImmediate(callback, readError as Error, undefined);
        }
      });
    } catch (launchError) {
      setImmediate(callback, launchError as Error, undefined);
    }
  }

  public cleanup(): void {
    this.removeTemporaryFile();
  }

  private determineEditor() {
    const editor = process.env['VISUAL']
      ? process.env['VISUAL']
      : process.env['EDITOR']
        ? process.env['EDITOR']
        : process.platform.startsWith('win')
          ? 'notepad'
          : 'vim';

    const editorOpts = splitStringBySpace(editor).map((piece: string) =>
      piece.replace('\\ ', ' '),
    );
    const bin = editorOpts.shift()!;

    this.editor = { args: editorOpts, bin };
  }

  private createTemporaryFile() {
    try {
      const baseDir = this.fileOptions.dir ?? os.tmpdir();
      const id = randomUUID();
      const prefix = sanitizeAffix(this.fileOptions.prefix);
      const postfix = sanitizeAffix(this.fileOptions.postfix);
      const filename = `${prefix}${id}${postfix}`;
      const candidate = path.resolve(baseDir, filename);
      const baseResolved = path.resolve(baseDir) + path.sep;
      if (!candidate.startsWith(baseResolved)) {
        throw new Error('Resolved temporary file escaped the base directory');
      }
      this.tempFile = candidate;
      const opt: WriteFileOptions = { encoding: 'utf8', flag: 'wx' };
      if (Object.prototype.hasOwnProperty.call(this.fileOptions, 'mode')) {
        opt.mode = this.fileOptions.mode;
      }
      writeFileSync(this.tempFile, this.text, opt);
    } catch (createFileError) {
      throw new CreateFileError(createFileError as Error);
    }
  }

  private readTemporaryFile() {
    try {
      const tempFileBuffer = readFileSync(this.tempFile);
      if (tempFileBuffer.length === 0) {
        this.text = '';
      } else {
        let encoding: string = detect(tempFileBuffer) ?? 'utf8';

        if (!iconv.encodingExists(encoding)) {
          // Probably a bad idea, but will at least prevent crashing
          encoding = 'utf8';
        }

        this.text = iconv.decode(tempFileBuffer, encoding);
      }
    } catch (readFileError) {
      throw new ReadFileError(readFileError as Error);
    }
  }

  private removeTemporaryFile() {
    try {
      unlinkSync(this.tempFile);
    } catch (removeFileError) {
      throw new RemoveFileError(removeFileError as Error);
    }
  }

  private launchEditor() {
    try {
      const editorProcess = spawnSync(
        this.editor.bin,
        this.editor.args.concat([this.tempFile]),
        { stdio: 'inherit' },
      );
      this.lastExitStatus = editorProcess.status ?? 0;
    } catch (launchError) {
      throw new LaunchEditorError(launchError as Error);
    }
  }

  private launchEditorAsync(callback: VoidCallback) {
    try {
      const editorProcess = spawn(
        this.editor.bin,
        this.editor.args.concat([this.tempFile]),
        { stdio: 'inherit' },
      );
      editorProcess.on('exit', (code: number) => {
        this.lastExitStatus = code;
        setImmediate(callback);
      });
    } catch (launchError) {
      throw new LaunchEditorError(launchError as Error);
    }
  }
}
