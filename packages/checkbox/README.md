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
import checkbox from '@inquirer/checkbox';

const answer = await checkbox({
  message: 'Select a package manager',
  choices: [
    { name: 'npm', value: 'npm' },
    { name: 'yarn', value: 'yarn' },
    { name: 'pnpm', value: 'pnpm', disabled: true },
  ],
});
```

## Options

| Property | Type      | Required | Description                    |
| -------- | --------- | -------- | ------------------------------ |
| message  | `string`  | yes      | The question to ask            |
| choices  | `Array<{ value: string, name?: string, disabled?: boolean }>` | yes       | List of the available choices. The `value` will be returned as the answer, and used as display if no `name` is defined. Choices who're `disabled` will be displayed, but not selectable. |

# License

Copyright (c) 2022 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))
Licensed under the MIT license.
