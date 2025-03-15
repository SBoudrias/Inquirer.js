#!/usr/bin/env node

import { select } from '@inquirer/prompts';
import colors from 'yoctocolors-cjs';
import figures from '@inquirer/figures';
import checkboxDemo from './demos/checkbox.ts';
import confirmDemo from './demos/confirm.ts';
import editorDemo from './demos/editor.ts';
import expandDemo from './demos/expand.ts';
import inputDemo from './demos/input.ts';
import loaderDemo from './demos/loader.ts';
import numberDemo from './demos/number.ts';
import passwordDemo from './demos/password.ts';
import rawlistDemo from './demos/rawlist.ts';
import searchDemo from './demos/search.ts';
import selectDemo from './demos/select.ts';
import timeoutDemo from './demos/timeout.ts';

const demos = {
  checkbox: checkboxDemo,
  confirm: confirmDemo,
  editor: editorDemo,
  expand: expandDemo,
  input: inputDemo,
  loader: loaderDemo,
  number: numberDemo,
  password: passwordDemo,
  rawlist: rawlistDemo,
  search: searchDemo,
  select: selectDemo,
  timeout: timeoutDemo,
} as const;

type Demos = keyof typeof demos | 'advanced' | 'back' | 'exit';

async function askNextDemo() {
  let selectedDemo: Demos = await select({
    message: 'Which prompt demo do you want to run?',
    choices: [
      { name: 'Input', value: 'input' },
      { name: 'Password', value: 'password' },
      { name: 'Confirm', value: 'confirm' },
      { name: 'Select', value: 'select' },
      { name: 'Checkbox', value: 'checkbox' },
      { name: 'Search', value: 'search' },
      { name: 'Expand', value: 'expand' },
      { name: 'Rawlist', value: 'rawlist' },
      { name: 'Editor', value: 'editor' },
      { name: 'Number', value: 'number' },
      { name: 'Advanced demos', value: 'advanced' },
      { name: "Exit (I'm done)", value: 'exit' },
    ],
    theme: {
      prefix: {
        done: colors.magenta(figures.play),
      },
    },
  });

  if (selectedDemo === 'advanced') {
    selectedDemo = await select(
      {
        message: 'Which demo do you want to run?',
        choices: [
          { name: 'Default value after timeout', value: 'timeout' },
          { name: 'Loader', value: 'loader' },
          { name: 'Go back', value: 'back' },
        ],
      },
      {
        clearPromptOnDone: true,
      },
    );
  }

  if (selectedDemo === 'back') {
    return askNextDemo();
  }

  return selectedDemo;
}

try {
  let nextDemo = await askNextDemo();
  while (nextDemo !== 'exit') {
    await demos[nextDemo]();
    nextDemo = await askNextDemo();
  }
} catch (error) {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    // noop; silence this error
  } else {
    throw error;
  }
}
