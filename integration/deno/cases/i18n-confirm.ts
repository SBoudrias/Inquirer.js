import { confirm } from '@inquirer/i18n';

// Locale auto-detection reads LANG/LC_* env variables; fr renders "Oui/Non".
process.env['LC_ALL'] = 'fr_FR.UTF-8';

const answer = await confirm({ message: 'Voulez-vous continuer ?' });
console.log('RESULT ' + JSON.stringify(answer));
