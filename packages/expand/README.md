# `@inquirer/expand`

Compact single select prompt. Every option is assigned a shortcut key, and selecting `h` will expand all the choices and their descriptions.

![Expand prompt closed](https://cdn.rawgit.com/SBoudrias/Inquirer.js/28ae8337ba51d93e359ef4f7ee24e79b69898962/assets/screenshots/expand-y.svg)
![Expand prompt expanded](https://cdn.rawgit.com/SBoudrias/Inquirer.js/28ae8337ba51d93e359ef4f7ee24e79b69898962/assets/screenshots/expand-d.svg)

# Installation

```sh
npm install @inquirer/expand

yarn add @inquirer/expand
```

# Usage

```js
import expand from '@inquirer/expand';

const answer = await expand({
  message: 'Conflict on file.js',
  default: 'y',
  choices: [
    {
      key: 'y',
      name: 'Overwrite',
      value: 'overwrite',
    },
    {
      key: 'a',
      name: 'Overwrite this one and all next',
      value: 'overwrite_all',
    },
    {
      key: 'd',
      name: 'Show diff',
      value: 'diff',
    },
    {
      key: 'x',
      name: 'Abort',
      value: 'abort',
    },
  ],
});
```

## Options

| Property | Type                                                   | Required | Description                                                                               |
| -------- | ------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------- |
| message  | `string`                                               | yes      | The question to ask                                                                       |
| choices  | `Array<{ key: string, name: string, value?: string }>` | yes      | Array of the different allowed choices. The `h`/help option is always provided by default |
| default  | `string`                                               | no       | Default choices to be selected. (value must be one of the choices `key`)                  |
| expanded | `boolean`                                              | no       | Expand the choices by default                                                             |

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
