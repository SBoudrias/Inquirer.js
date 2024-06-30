import { describe, it, expect } from 'vitest';
import stripAnsi from 'strip-ansi';

import Separator from '../../../src/objects/separator.mjs';
import inquirer from '../../../src/index.mjs';

describe('Separator constructor', () => {
  it('should set a default', () => {
    const sep = new Separator();
    expect(stripAnsi(sep.toString())).toEqual('──────────────');
  });

  it('should set user input as separator', () => {
    const sep = new Separator('foo bar');
    expect(stripAnsi(sep.toString())).toEqual('foo bar');
  });

  it('instances should be stringified when appended to a string', () => {
    const sep = new Separator('foo bar');
    expect(stripAnsi(String(sep))).toEqual('foo bar');
  });

  it('should be exposed on Inquirer object', () => {
    expect(inquirer.Separator).toEqual(Separator);
  });

  it('should expose a helper function to check for separator', () => {
    expect(Separator.isSeparator({})).toEqual(false);
    expect(Separator.isSeparator(new Separator())).toEqual(true);
  });

  it("give the type 'separator' to its object", () => {
    const sep = new Separator();
    expect(sep.type).toEqual('separator');
  });
});
