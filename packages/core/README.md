# `@inquirer/core`

The `@inquirer/core` package is the library enabling the creation of Inquirer prompts.

It aims to implements a lightweight API similar to React hooks - but without JSX.

# Installation

```sh
npm install @inquirer/core

yarn add @inquirer/core
```

# Usage

```ts
import chalk from 'chalk';
import {
  createPrompt,
  useState,
  useKeypress,
  isEnterKey,
  usePrefix,
} from '@inquirer/core';

const confirm = createPrompt<boolean, { message: string; default?: boolean }>(
  (config, done) => {
    const [status, setStatus] = useState('pending');
    const [value, setValue] = useState('');
    const prefix = usePrefix({});

    useKeypress((key, rl) => {
      if (isEnterKey(key)) {
        const answer = value ? /^y(es)?/i.test(value) : config.default !== false;
        setValue(answer ? 'yes' : 'no');
        setStatus('done');
        done(answer);
      } else {
        setValue(rl.line);
      }
    });

    let formattedValue = value;
    let defaultValue = '';
    if (status === 'done') {
      formattedValue = chalk.cyan(value);
    } else {
      defaultValue = chalk.dim(config.default === false ? ' (y/N)' : ' (Y/n)');
    }

    const message = chalk.bold(config.message);
    return `${prefix} ${message}${defaultValue} ${formattedValue}`;
  },
);

/**
 *  Which then can be used like this:
 */
const answer = await confirm({ message: 'Do you want to continue?' });
```

See more examples:

- [Confirm Prompt](https://github.com/SBoudrias/Inquirer.js/blob/master/packages/confirm/src/index.mts)
- [Input Prompt](https://github.com/SBoudrias/Inquirer.js/blob/master/packages/input/src/index.mts)
- [Password Prompt](https://github.com/SBoudrias/Inquirer.js/blob/master/packages/password/src/index.mts)
- [Editor Prompt](https://github.com/SBoudrias/Inquirer.js/blob/master/packages/editor/src/index.mts)
- [Select Prompt](https://github.com/SBoudrias/Inquirer.js/blob/master/packages/select/src/index.mts)
- [Checkbox Prompt](https://github.com/SBoudrias/Inquirer.js/blob/master/packages/checkbox/src/index.mts)
- [Rawlist Prompt](https://github.com/SBoudrias/Inquirer.js/blob/master/packages/rawlist/src/index.mts)
- [Expand Prompt](https://github.com/SBoudrias/Inquirer.js/blob/master/packages/expand/src/index.mts)

## API

### `createPrompt(viewFn)`

The `createPrompt` function returns an asynchronous function that returns a cancelable promise resolving to the valid answer a user submit. This prompt function takes the prompt configuration as its first argument (this is defined by each prompt), and the context options as a second argument.

The prompt configuration is unique to each prompt. The context options are:

| Property          | Type                    | Required | Description                                                  |
| ----------------- | ----------------------- | -------- | ------------------------------------------------------------ |
| input             | `NodeJS.ReadableStream` | no       | The stdin stream (defaults to `process.stdin`)               |
| output            | `NodeJS.WritableStream` | no       | The stdout stream (defaults to `process.stdout`)             |
| clearPromptOnDone | `boolean`               | no       | If true, we'll clear the screen after the prompt is answered |

The cancelable promise exposes a `cancel` method that'll exit the prompt and reject the promise.

#### Typescript

If using typescript, `createPrompt` takes 2 generic arguments (ex `createPrompt<string, { message: string }>()`)

The first one is the type of the resolved value; `function createPrompt<Value>(): Promise<Value> {}`

The second one is the type of the prompt config; in other words the interface the created prompt will provide to users.

### Hooks

Hooks can only be called within the prompt function and are used to handle state and events.

Those hooks are matching the React hooks API:

- `useState`
- `useRef`
- `useEffect`
- `useMemo`

And those are custom utilities from Inquirer:

- `useKeypress`
- `usePagination`
- `usePrefix`

### Key utilities

Listening for keypress events inside an inquirer prompt is a very common pattern. To ease this, we export a few utility functions taking in the keypress event object and return a boolean:

- `isEnterKey()`
- `isBackspaceKey()`
- `isSpaceKey()`
- `isUpKey()` - Note: this utility will handle vim and emacs keybindings (up, `k`, and `ctrl+p`)
- `isDownKey()` - Note: this utility will handle vim and emacs keybindings (down, `j`, and `ctrl+n`)
- `isNumberKey()` one of 1, 2, 3, 4, 5, 6, 7, 8, 9, 0

### `usePagination`

When looping through a long list of options (like in the `select` prompt), paginating the results appearing on the screen at once can be necessary. The `usePagination` hook is the utility used within the `select` and `checkbox` prompts to cycle through the list of options.

Pagination works by taking in the list of options and returning a subset of the rendered items that fit within the page. The hook takes in a few options. It needs a list of options (`items`), and a `pageSize` which is the number of lines to be rendered. The `active` index is the index of the currently selected/selectable item. The `loop` option is a boolean that indicates if the list should loop around when reaching the end: this is the default behavior. The pagination hook renders items only as necessary, so it takes a function that can render an item at an index, including an `active` state, called `renderItem`.

```js
export default createPrompt((config, done) => {
  const [active, setActive] = useState(0);

  const allChoices = config.choices.map((choice) => choice.name);

  const page = usePagination({
    items: allChoices,
    active: active,
    renderItem: ({ item, index, isActive }) => `${isActive ? ">" : " "}${index}. ${item.toString()}`
    pageSize: config.pageSize,
    loop: config.loop,
  });

  return `... ${page}`;
});
```

### Theming

Theming utilities will allow you to expose customization of the prompt style. Inquirer also has a few standard theme values shared across all the official prompts.

To allow standard customization:

```ts
import { createPrompt, usePrefix, makeTheme, type Theme } from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';

type PromptConfig = {
  theme?: PartialDeep<Theme>;
};

export default createPrompt<string, PromptConfig>((config, done) => {
  const theme = makeTheme(config.theme);

  const prefix = usePrefix({ isLoading, theme });

  return `${prefix} ${theme.style.highlight('hello')}`;
});
```

To setup a custom theme:

```ts
import { createPrompt, makeTheme, type Theme } from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';

type PromptTheme = {};

const promptTheme: PromptTheme = {
  icon: '!',
};

type PromptConfig = {
  theme?: PartialDeep<Theme<PromptTheme>>;
};

export default createPrompt<string, PromptConfig>((config, done) => {
  const theme = makeTheme(promptTheme, config.theme);

  const prefix = usePrefix({ isLoading, theme });

  return `${prefix} ${theme.icon}`;
});
```

The [default theme keys cover](https://github.com/SBoudrias/Inquirer.js/blob/theme/packages/core/src/lib/theme.mts):

```ts
type DefaultTheme = {
  prefix: string;
  spinner: {
    interval: number;
    frames: string[];
  };
  style: {
    answer: (text: string) => string;
    message: (text: string) => string;
    error: (text: string) => string;
    defaultAnswer: (text: string) => string;
    help: (text: string) => string;
    highlight: (text: string) => string;
    key: (text: string) => string;
  };
};
```

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
