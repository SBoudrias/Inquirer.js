<img width="75px" height="75px" align="right" alt="Inquirer Logo" src="https://raw.githubusercontent.com/SBoudrias/Inquirer.js/main/assets/inquirer_readme.svg?sanitize=true" title="Inquirer.js"/>

# @inquirer/prompts-i18n

[![npm](https://badge.fury.io/js/@inquirer%2Fprompts-i18n.svg)](https://www.npmjs.com/package/@inquirer/prompts-i18n)

Internationalized Inquirer prompts - 100% drop-in replacements for `@inquirer/prompts` with built-in localization support.

# Installation

<table>
<tr>
  <th>npm</th>
  <th>yarn</th>
  <th>pnpm</th>
  <th>bun</th>
</tr>
<tr>
<td>

```sh
npm install @inquirer/prompts-i18n
```

</td>
<td>

```sh
yarn add @inquirer/prompts-i18n
```

</td>
<td>

```sh
pnpm add @inquirer/prompts-i18n
```

</td>
<td>

```sh
bun add @inquirer/prompts-i18n
```

</td>
</tr>
</table>

# Usage

Simply replace your import from `@inquirer/prompts` with a language-specific import:

```js
// Before
import { input, select, confirm } from '@inquirer/prompts';

// After (French)
import { input, select, confirm } from '@inquirer/prompts-i18n/fr';

// After (Spanish)
import { input, select, confirm } from '@inquirer/prompts-i18n/es';
```

All prompts work exactly the same way as the original package. The only difference is that help text, validation messages, and UI labels are automatically translated to your chosen language.

# Supported Languages

- `@inquirer/prompts-i18n/en` - English (default, re-export of original)
- `@inquirer/prompts-i18n/fr` - French
- `@inquirer/prompts-i18n/es` - Spanish
- `@inquirer/prompts-i18n/zh` - Chinese (Simplified)
- `@inquirer/prompts-i18n/pr` - Portuguese

# Example

```js
import { input, confirm, select } from '@inquirer/prompts-i18n/fr';

const name = await input({ message: 'Quel est votre nom ?' });

const confirmed = await confirm({ message: 'Continuer ?' });

const choice = await select({
  message: 'Choisissez une option',
  choices: [
    { name: 'Option 1', value: 'opt1' },
    { name: 'Option 2', value: 'opt2', disabled: true },
  ],
});
```

# Available Prompts

All prompts from `@inquirer/prompts` are available:

- `input`
- `select`
- `checkbox`
- `confirm`
- `search`
- `password`
- `expand`
- `editor`
- `number`
- `rawlist`
- `Separator`

See the [@inquirer/prompts documentation](https://github.com/SBoudrias/Inquirer.js/tree/main/packages/prompts) for full usage details.

# License

Copyright (c) 2025 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
