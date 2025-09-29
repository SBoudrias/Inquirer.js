#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const [, , file] = process.argv;
if (!file) {
  throw new Error('Expected temporary file path');
}

const contents = readFileSync(file, 'utf8');
writeFileSync(file, contents.slice(0, 10));
