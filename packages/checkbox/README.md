# `@inquirer/checkbox`

Simple interactive command line prompt to display a list of checkboxes (multi select).

![Checkbox prompt](https://cdn.rawgit.com/SBoudrias/Inquirer.js/28ae8337ba51d93e359ef4f7ee24e79b69898962/assets/screenshots/checkbox.svg)

# Installation

```sh
npm install @inquirer/checkbox

yarn add @inquirer/checkbox
```

# Usage

```js
import checkbox, { Separator } from '@inquirer/checkbox';

const answer = await checkbox({
  message: 'Select a package manager',
  choices: [
    { name: 'npm', value: 'npm' },
    { name: 'yarn', value: 'yarn' },
    new Separator(),
    { name: 'pnpm', value: 'pnpm', disabled: true },
    {
      name: 'pnpm',
      value: 'pnpm',
      disabled: '(pnpm is not available)',
    },
  ],
});
```

## Options

| Property | Type                                                                                                    | Required | Description                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| message  | `string`                                                                                                | yes      | The question to ask                                                                                                                                                                                   |
| choices  | `Array<{ value: string, name?: string, disabled?: boolean \| string, checked?: boolean } \| Separator>` | yes      | List of the available choices. The `value` will be returned as the answer, and used as display if no `name` is defined. Choices who're `disabled` will be displayed, but not selectable.              |
| pageSize | `number`                                                                                                | no       | By default, lists of choice longer than 7 will be paginated. Use this option to control how many choices will appear on the screen at once.                                                           |
| loop     | `boolean`                                                                                               | no       | Defaults to `true`. When set to `false`, the cursor will be constrained to the top and bottom of the choice list without looping.                                                                     |
| required | `boolean`                                                                                               | no       | When set to `true`, ensures at least one choice must be selected.                                                                                                                                     |
| validate | `string\[\] => boolean \| string \| Promise<string \| boolean>`                                         | no       | On submit, validate the choices. When returning a string, it'll be used as the error message displayed to the user. Note: returning a rejected promise, we'll assume a code error happened and crash. |
| theme    | [See Theming](#Theming)                                                                                 | no       | Customize look of the prompt.                                                                                                                                                                         |

The `Separator` object can be used to render non-selectable lines in the choice list. By default it'll render a line, but you can provide the text as argument (`new Separator('-- Dependencies --')`). This option is often used to add labels to groups within long list of options.

## Theming

You can theme a prompt by passing a `theme` object option. The theme object only need to includes the keys you wish to modify, we'll fallback on the defaults for the rest.

```ts
type Theme = {
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
    disabledChoice: (text: string) => string;
    renderSelectedChoices: <T>(
      selectedChoices: ReadonlyArray<Choice<T>>,
      allChoices: ReadonlyArray<Choice<T> | Separator>,
    ) => string;
  };
  icon: {
    checked: string;
    unchecked: string;
    cursor: string;
  };
};
```

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
