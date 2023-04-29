# `@inquirer/password`

Interactive password input component for command line interfaces. Supports input validation and masked or transparent modes.

![Password prompt](https://cdn.rawgit.com/SBoudrias/Inquirer.js/28ae8337ba51d93e359ef4f7ee24e79b69898962/assets/screenshots/password.svg)

# Installation

```sh
npm install @inquirer/password

yarn add @inquirer/password
```

# Usage

```js
import password from '@inquirer/password';

const answer = await password({ message: 'Enter your name' });
```

## Options

| Property | Type                                                        | Required | Description                                                                                                                                                                                                             |
| -------- | ----------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| message  | `string`                                                    | yes      | The question to ask                                                                                                                                                                                                     |
| mask     | `boolean`                                                   | no       | Show a `*` mask over the input or keep it transparent                                                                                                                                                                   |
| validate | `string => boolean \| string \| Promise<string \| boolean>` | no       | On submit, validate the filtered answered content. When returning a string, it'll be used as the error message displayed to the user. Note: returning a rejected promise, we'll assume a code error happened and crash. |

# License

Copyright (c) 2023 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
