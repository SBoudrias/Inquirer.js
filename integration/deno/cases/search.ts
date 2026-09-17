import { search } from '@inquirer/prompts';

// Static source: filtering logic is covered by unit tests; this case verifies
// the search prompt's rendering and submit pipeline works under Deno.
const answer = await search({
  message: 'Pick a fruit',
  source: () => [{ name: 'banana', value: 'banana' }],
});
console.log('RESULT ' + JSON.stringify(answer));
