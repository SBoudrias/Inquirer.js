#!/usr/bin/env node
import { Builtins, Cli } from 'clipanion';
import { LintCommand } from './lint/command.ts';
import { NormalizeCommand } from './normalize/command.ts';
import { PinCommand } from './pin/command.ts';

const cli = Cli.from([LintCommand, NormalizeCommand, PinCommand, Builtins.HelpCommand], {
  binaryLabel: 'Package',
  binaryName: 'package',
  enableCapture: false,
});

process.exitCode = await cli.run(process.argv.slice(2), Cli.defaultContext);
