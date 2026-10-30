<img width="75px" height="75px" align="right" alt="Inquirer Logo" src="https://raw.githubusercontent.com/SBoudrias/Inquirer.js/main/assets/inquirer_readme.svg?sanitize=true" title="Inquirer.js"/>

# @inquirer/i18n

[![npm](https://badge.fury.io/js/@inquirer%2Fi18n.svg)](https://www.npmjs.com/package/@inquirer/i18n)

Internationalized Inquirer prompts — a 100% drop-in replacement for `@inquirer/prompts` with built-in localization.

# Installation

<table>
<tr>
  <th>yarn</th>
  <th>pnpm</th>
</tr>
<tr>
<td>

```sh
yarn add @inquirer/i18n
```

</td>
<td>

```sh
pnpm add @inquirer/i18n
```

</td>
</tr>
<tr>
  <th>bun</th>
  <th>deno</th>
</tr>
<tr>
<td>

```sh
bun add @inquirer/i18n
```

</td>
<td>

```sh
deno add npm:@inquirer/i18n
```

</td>
</tr>
<tr>
<th colSpan="2">npm</th>
</tr>
<tr>
<td colSpan="2">

```sh
npm install @inquirer/i18n
```

</td>
</tr>
</table>

On Deno, locale detection reads the `LANGUAGE`, `LC_ALL`, `LC_MESSAGES`, and `LANG` environment variables, so run your script with `--allow-env`.

# Usage

## Auto-detected locale

The root import reads `LANGUAGE`, `LC_ALL`, `LC_MESSAGES`, and `LANG` environment
variables (in that order) and falls back to the `Intl` API for Windows compatibility.
If no supported locale is detected, English is used.

```js
import { input, select, confirm } from '@inquirer/i18n';
```

## Fixed locale

Pin to a specific language by using a sub-path import:

```js
import { input, select, confirm } from '@inquirer/i18n/fr'; // French
import { input, select, confirm } from '@inquirer/i18n/zh'; // Chinese (Simplified)
```

## Supported locales

| Sub-path                  | Language                                   |
| ------------------------- | ------------------------------------------ |
| `@inquirer/i18n` _(auto)_ | Auto-detected                              |
| `@inquirer/i18n/en`       | English (re-export of `@inquirer/prompts`) |
| `@inquirer/i18n/fr`       | French                                     |
| `@inquirer/i18n/es`       | Spanish                                    |
| `@inquirer/i18n/zh`       | Chinese (Simplified)                       |
| `@inquirer/i18n/pt`       | Portuguese                                 |

# Adding a custom locale

Use `createLocalizedPrompts` to build a locale, then either export it directly
or register it for auto-detection via `registerLocale`:

```ts
import { createLocalizedPrompts, registerLocale } from '@inquirer/i18n';
import type { Locale } from '@inquirer/i18n';

const deLocale: Locale = {
  confirm: {
    yesLabel: 'Ja',
    noLabel: 'Nein',
    invalidAnswer: (yes, no) => `Sie müssen mit "${yes}" oder "${no}" antworten.`,
  },
  select: { helpNavigate: 'Navigieren', helpSelect: 'Auswählen' },
  checkbox: {
    helpNavigate: 'Navigieren',
    helpSelect: 'Auswählen',
    helpSubmit: 'Bestätigen',
    helpAll: 'Alle',
    helpInvert: 'Umkehren',
  },
  search: { helpNavigate: 'Navigieren', helpSelect: 'Auswählen' },
  editor: {
    loadingMessage: () => 'Überprüfung...',
    waitingMessage: (enterKey) => `Drücken Sie ${enterKey}, um Ihren Editor zu öffnen.`,
  },
  password: {
    maskedText: '[Eingabe verborgen]',
    helpToggle: 'Sichtbarkeit umschalten',
  },
};

// Option A — use directly
export const { input, select, confirm } = createLocalizedPrompts(deLocale);

// Option B — register so `@inquirer/i18n` auto-detects it when LANG=de
registerLocale('de', createLocalizedPrompts(deLocale));
```

`registerLocale` must be called before any prompt is invoked. After registration,
`import { confirm } from '@inquirer/i18n'` will pick the German locale automatically
whenever `LANG` (or the other sources) resolve to `de`.

# Themes and locales

The strings above are the localized defaults. A `theme` passed to a prompt applies
in every language — it overrides the locale strings, exactly as it overrides the
built-in English ones in `@inquirer/prompts`. For example
`password({ message, theme: { style: { maskedText: '[***]' } } })` renders `[***]`
under every locale.

To change the words of a single language, don't put them in the theme: build a
locale with `createLocalizedPrompts` and register it with `registerLocale` instead:

```js
import { createLocalizedPrompts, registerLocale } from '@inquirer/i18n';
import { locale as zh } from '@inquirer/i18n/zh';

registerLocale(
  'zh',
  createLocalizedPrompts({
    ...zh,
    password: { ...zh.password, maskedText: '[已隐藏]' },
  }),
);
```

Note: a custom `keysHelpTip` formatter receives the help-line labels already
translated into the active language (e.g. `导航` for `navigate` under `zh`).

# License

Copyright (c) 2025 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
