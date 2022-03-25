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

# License

Copyright (c) 2022 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))
Licensed under the MIT license.
