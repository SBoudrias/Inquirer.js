import { describe, it, expect } from 'vitest';
import stripAnsi from 'strip-ansi';

import Separator from '../../../lib/objects/separator.js';
import inquirer from '../../../lib/inquirer.js';

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
    expect(Separator.exclude({})).toEqual(true);
    expect(Separator.exclude(new Separator())).toEqual(false);
  });

  it("give the type 'separator' to its object", () => {
    const sep = new Separator();
    expect(sep.type).toEqual('separator');
  });
});
