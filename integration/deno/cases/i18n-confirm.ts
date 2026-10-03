import { confirm } from '@inquirer/i18n';
import { PassThrough } from 'node:stream';

// Locale auto-detection reads LANG/LC_* env variables; fr renders "Oui/Non".
process.env['LC_ALL'] = 'fr_FR.UTF-8';

// CI has no TTY; capture the rendered frames so the test can assert the
// localized screen (e.g. "Oui") alongside the answer.
const screen = new PassThrough();
const frames: string[] = [];
screen.on('data', (chunk) => frames.push(String(chunk)));

const answer = await confirm({ message: 'Voulez-vous continuer ?' }, { output: screen });
console.log('RESULT ' + JSON.stringify({ answer, screen: frames.join('') }));
