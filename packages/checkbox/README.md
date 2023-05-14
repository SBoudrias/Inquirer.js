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

| Property | Type                                                                                                    | Required | Description                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| message  | `string`                                                                                                | yes      | The question to ask                                                                                                                                                                      |
| choices  | `Array<{ value: string, name?: string, disabled?: boolean \| string, checked?: boolean } \| Separator>` | yes      | List of the available choices. The `value` will be returned as the answer, and used as display if no `name` is defined. Choices who're `disabled` will be displayed, but not selectable. |

The `Separator` object can be used to render non-selectable lines in the choice list. By default it'll render a line, but you can provide the text as argument (`new Separator('-- Dependencies --')`). This option is often used to add labels to groups within long list of options.

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
