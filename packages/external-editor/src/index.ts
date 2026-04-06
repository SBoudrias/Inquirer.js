import { detect } from 'chardet';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, unlinkSync, type WriteFileOptions, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import iconv from 'iconv-lite';
import {
  CreateFileError,
  LaunchEditorError,
  ReadFileError,
  RemoveFileError,
} from './errors.ts';
import { parseEditorCommand, type EditorParams } from './parse-editor-command.ts';

type StringCallback = (err: Error | undefined, result: string | undefined) => void;

export type FileOptions = {
  prefix?: string;
  postfix?: string;
  mode?: number;
  template?: string;
  dir?: string;
};

/** @deprecated Use FileOptions */
export type IFileOptions = FileOptions;

export { CreateFileError, LaunchEditorError, ReadFileError, RemoveFileError };

export function edit(text: string = '', fileOptions?: FileOptions): string {
  return new ExternalEditor(text, fileOptions).run();
}

export function editAsync(text?: string, fileOptions?: FileOptions): Promise<string>;
/** @deprecated Use editAsync(text, options) returning a Promise instead */
export function editAsync(
  text: string,
  callback: StringCallback,
  fileOptions?: FileOptions,
): void;
export function editAsync(
  text: string = '',
  callbackOrOptions?: StringCallback | FileOptions,
  fileOptions?: FileOptions,
): Promise<string> | void {
  const callback =
    typeof callbackOrOptions === 'function' ? callbackOrOptions : undefined;
  const options =
    typeof callbackOrOptions === 'function' ? fileOptions : callbackOrOptions;

  const editor = new ExternalEditor(text, options);
  const promise = editor.runAsync();

  if (callback) {
    promise.then(
      (result) => callback(undefined, result),
      (err: unknown) => callback(err as Error, undefined),
    );
    return;
  }

  return promise;
}

function sanitizeAffix(affix?: string): string {
  if (!affix) return '';
  return affix.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

export class ExternalEditor {
  public editor!: EditorParams;
  public lastExitStatus: number = 0;

  private text: string = '';
  private tempFile: string = '';
  private fileOptions: FileOptions = {};

  constructor(text: string = '', fileOptions: FileOptions = {}) {
    this.text = text;
    this.fileOptions = fileOptions;

    this.editor = parseEditorCommand(
      process.env['VISUAL'] ??
        process.env['EDITOR'] ??
        (process.platform.startsWith('win') ? 'notepad' : 'vim'),
    );
  }

  public run(): string {
    this.createTempFile();
    try {
      try {
        const editorProcess = spawnSync(
          this.editor.bin,
          this.editor.args.concat([this.tempFile]),
          { stdio: 'inherit' },
        );
        this.lastExitStatus = editorProcess.status ?? 0;
      } catch (launchError) {
        throw new LaunchEditorError(launchError);
      }
      this.readTemporaryFile();
      return this.text;
    } finally {
      this.cleanup();
    }
  }

  public runAsync(): Promise<string>;
  /** @deprecated Use runAsync() returning a Promise instead */
  public runAsync(callback: StringCallback): void;
  public runAsync(callback?: StringCallback): Promise<string> | void {
    this.createTempFile();
    const promise = new Promise<void>((resolve, reject) => {
      try {
        const editorProcess = spawn(
          this.editor.bin,
          this.editor.args.concat([this.tempFile]),
          { stdio: 'inherit' },
        );
        editorProcess.on('exit', (code: number) => {
          this.lastExitStatus = code;
          resolve();
        });
      } catch (launchError) {
        reject(new LaunchEditorError(launchError));
      }
    })
      .then(() => {
        this.readTemporaryFile();
        return this.text;
      })
      .finally(() => {
        this.cleanup();
      });

    if (callback) {
      promise.then(
        (text) => callback(undefined, text),
        (err: unknown) => callback(err as Error, undefined),
      );
      return;
    }

    return promise;
  }

  public cleanup(): void {
    if (!this.tempFile) return;
    try {
      unlinkSync(this.tempFile);
      this.tempFile = '';
    } catch (removeFileError) {
      throw new RemoveFileError(removeFileError);
    }
  }

  private createTempFile() {
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
      throw new CreateFileError(createFileError);
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
      throw new ReadFileError(readFileError);
    }
  }
}
