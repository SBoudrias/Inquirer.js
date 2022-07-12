# `@inquirer/editor`

Prompt that'll open the user preferred editor with default content and allow for a convenient multi-line input controlled through the command line.

# Installation

```sh
npm install @inquirer/editor

yarn add @inquirer/editor
```

# Usage

```js
import editor from '@inquirer/editor';

const answer = await editor({
  message: 'Enter a description'
});
```

## Options

| Property | Type      | Required | Description                    |
| -------- | --------- | -------- | ------------------------------ |
| message  | `string`  | yes      | The question to ask            |
| default  | `string`  | no       | Default value which will automatically be present in the editor |
| validate    | `string => boolean \| string \| Promise<string \| boolean>` | no       | On submit, validate the content. When returning a string, it'll be used as the error message displayed to the user. Note: returning a rejected promise, we'll assume a code error happened and crash. |
| postfix  | `string`  | no (default to `.txt`) | The postfix of the file being edited. Adding this will add color highlighting to the file content in most editors. |


# License

Copyright (c) 2022 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))
Licensed under the MIT license.
