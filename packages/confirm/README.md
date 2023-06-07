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

const answer = await confirm({ message: 'Continue?' });
```

## Options

| Property    | Type                  | Required | Description                                             |
| ----------- | --------------------- | -------- | ------------------------------------------------------- |
| message     | `string`              | yes      | The question to ask                                     |
| default     | `boolean`             | no       | Default answer (true or false)                          |
| transformer | `(boolean) => string` | no       | Transform the prompt printed message to a custom string |

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
