import figures from '@inquirer/figures';

// Symbol fallback logic depends on env detection (TERM/CI) working in Deno.
console.log('RESULT ' + JSON.stringify(figures.tick));
