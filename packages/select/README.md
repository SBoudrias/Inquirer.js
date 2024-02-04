# `@inquirer/select`

Simple interactive command line prompt to display a list of choices (single select.)

![select prompt](https://cdn.rawgit.com/SBoudrias/Inquirer.js/28ae8337ba51d93e359ef4f7ee24e79b69898962/assets/screenshots/list.svg)

# Installation

```sh
npm install @inquirer/select

yarn add @inquirer/select
```

# Usage

```js
import select, { Separator } from '@inquirer/select';

const answer = await select({
  message: 'Select a package manager',
  choices: [
    {
      name: 'npm',
      value: 'npm',
      description: 'npm is the most popular package manager',
    },
    {
      name: 'yarn',
      value: 'yarn',
      description: 'yarn is an awesome package manager',
    },
    new Separator(),
    {
      name: 'jspm',
      value: 'jspm',
      disabled: true,
    },
    {
      name: 'pnpm',
      value: 'pnpm',
      disabled: '(pnpm is not available)',
    },
  ],
});
```

## Options

| Property | Type                                                                                                       | Required | Description                                                                                                                                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| message  | `string`                                                                                                   | yes      | The question to ask                                                                                                                                                                                                                                                                 |
| choices  | `Array<{ value: string, name?: string, description?: string, disabled?: boolean \| string } \| Separator>` | yes      | List of the available choices. The `value` will be returned as the answer, and used as display if no `name` is defined. Choices who're `disabled` will be displayed, but not selectable. The `description` will be displayed under the prompt when the cursor land over the choice. |
| default  | `string`                                                                                                   | no       | Defines in front of which item the cursor will initially appear. When omitted, the cursor will appear on the first selectable item.                                                                                                                                                 |
| pageSize | `number`                                                                                                   | no       | By default, lists of choice longer than 7 will be paginated. Use this option to control how many choices will appear on the screen at once.                                                                                                                                         |
| loop     | `boolean`                                                                                                  | no       | Defaults to `true`. When set to `false`, the cursor will be constrained to the top and bottom of the choice list without looping.                                                                                                                                                   |
| theme    | [See Theming](#Theming)                                                                                    | no       | Customize look of the prompt.                                                                                                                                                                                                                                                       |

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
    help: (text: string) => string;
    highlight: (text: string) => string;
    disabled: (text: string) => string;
  };
  icon: {
    cursor: string;
  };
};
```

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
