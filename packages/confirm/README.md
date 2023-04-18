# `@inquirer/confirm`

Simple interactive command line prompt to gather boolean input from users.

![Confirm prompt](https://cdn.rawgit.com/SBoudrias/Inquirer.js/28ae8337ba51d93e359ef4f7ee24e79b69898962/assets/screenshots/confirm.svg)

# Installation

```sh
npm install @inquirer/confirm

yarn add @inquirer/confirm
```

# Usage

```js
import confirm from '@inquirer/confirm';

const answer = await confirm({ message: 'Enter your name' });
```

## Options

| Property | Type      | Required | Description                    |
| -------- | --------- | -------- | ------------------------------ |
| message  | `string`  | yes      | The question to ask            |
| default  | `boolean` | no       | Default answer (true or false) |
| transformer | `(boolean) => string`                  | no       | Transform/Format the raw value entered by the user. The function should return the transformed output for both the boolean values: `true` (positive confirmation) and `false` (negative confirmation) by the user |

# License

Copyright (c) 2022 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))
Licensed under the MIT license.
