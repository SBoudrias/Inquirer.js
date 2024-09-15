#!/usr/bin/env node

import { select } from '@inquirer/prompts';
import colors from 'yoctocolors-cjs';
import figures from '@inquirer/figures';
import checkboxDemo from './demos/checkbox.mjs';
import confirmDemo from './demos/confirm.mjs';
import editorDemo from './demos/editor.mjs';
import expandDemo from './demos/expand.mjs';
import inputDemo from './demos/input.mjs';
import loaderDemo from './demos/loader.mjs';
import numberDemo from './demos/number.mjs';
import passwordDemo from './demos/password.mjs';
import rawlistDemo from './demos/rawlist.mjs';
import searchDemo from './demos/search.mjs';
import selectDemo from './demos/select.mjs';
import timeoutDemo from './demos/timeout.mjs';

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
};

async function askNextDemo() {
  let selectedDemo = await select({
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

(async () => {
  try {
    let nextDemo = await askNextDemo();
    while (nextDemo !== 'exit') {
      await demos[nextDemo]();
      nextDemo = await askNextDemo();
    }
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      // noop; silence this error
      return;
    }

    throw error;
  }
})();
