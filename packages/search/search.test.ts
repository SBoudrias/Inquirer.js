import { describe, it, expect, expectTypeOf } from 'vitest';
import { render } from '@inquirer/testing';
import search, { Separator } from './src/index.ts';

// Array of all countries names as string
const PROVINCES = [
  { name: 'Alberta', value: 'AB' },
  { name: 'British Columbia', value: 'BC' },
  { name: 'Manitoba', value: 'MB' },
  { name: 'New Brunswick', value: 'NB' },
  { name: 'Newfoundland and Labrador', value: 'NL' },
  { name: 'Nova Scotia', value: 'NS' },
  { name: 'Ontario', value: 'ON' },
  { name: 'Prince Edward Island', value: 'PE' },
  { name: 'Quebec', value: 'QC' },
  { name: 'Saskatchewan', value: 'SK' },
  { name: 'Northwest Territories', value: 'NT' },
  { name: 'Nunavut', value: 'NU' },
  { name: 'Yukon', value: 'YT' },
];

function getListSearch(
  choices: ReadonlyArray<
    Separator | { value: string; name?: string; disabled?: boolean | string }
  >,
) {
  return (term: string = '') => {
    if (!term) return choices;

    return choices.filter((choice) => {
      return (
        Separator.isSeparator(choice) ||
        (choice.name ?? choice.value)
          .toLocaleLowerCase()
          .includes(term.toLocaleLowerCase())
      );
    });
  };
}

describe('search prompt', () => {
  it('allows to search', async () => {
    const { answer, events, getScreen } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province 
      ❯ Alberta
        British Columbia
        Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario

      ↑↓ navigate • ⏎ select"
    `);

    events.type('New');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('NB');
    expect(getScreen()).toMatchInlineSnapshot(
      `"✔ Select a Canadian province New Brunswick"`,
    );
  });

  it('works with string results', async () => {
    const choices = [
      'Stark',
      'Lannister',
      'Targaryen',
      'Baratheon',
      'Greyjoy',
      'Martell',
      'Tyrell',
      'Arryn',
      'Tully',
    ];

    const { answer, events, getScreen } = await render(search, {
      message: 'Select a family',
      source: (term: string = '') => {
        return choices.filter((choice) => choice.includes(term));
      },
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family 
      ❯ Stark
        Lannister
        Targaryen
        Baratheon
        Greyjoy
        Martell
        Tyrell

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family 
        Stark
      ❯ Lannister
        Targaryen
        Baratheon
        Greyjoy
        Martell
        Tyrell

      ↑↓ navigate • ⏎ select"
    `);

    events.type('Targ');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family Targ
      ❯ Targaryen

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('Targaryen');
  });

  it('allows to search and navigate the list', async () => {
    const { answer, events, getScreen } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province 
      ❯ Alberta
        British Columbia
        Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario

      ↑↓ navigate • ⏎ select"
    `);

    events.type('N');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province N
      ❯ Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario
        Prince Edward Island
        Saskatchewan

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('down');
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province N
        Manitoba
        New Brunswick
      ❯ Newfoundland and Labrador
        Nova Scotia
        Ontario
        Prince Edward Island
        Saskatchewan

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('NL');
    expect(getScreen()).toMatchInlineSnapshot(
      `"✔ Select a Canadian province Newfoundland and Labrador"`,
    );
  });

  it('controls bounds of the list when navigating', async () => {
    const { answer, events, getScreen } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
    });

    events.type('New');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('up');
    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);
    events.keypress('down');
    events.keypress('down');
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
        New Brunswick
      ❯ Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('NB');
    expect(getScreen()).toMatchInlineSnapshot(
      `"✔ Select a Canadian province New Brunswick"`,
    );
  });

  it('handles search errors', async () => {
    const abortController = new AbortController();
    const { answer, events, getScreen } = await render(
      search,
      {
        message: 'Select a Canadian province',
        source: (term: string | void) => {
          if (!term) return Promise.resolve([]);

          throw new Error("You're being rate limited");
        },
      },
      { signal: abortController.signal },
    );

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province 

      ↑↓ navigate • ⏎ select"
    `);

    events.type('New');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      > You're being rate limited

      ↑↓ navigate • ⏎ select"
    `);

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('handles empty results', async () => {
    const abortController = new AbortController();
    const { answer, events, getScreen } = await render(
      search,
      {
        message: 'Select a Canadian province',
        source: () => [],
      },
      { signal: abortController.signal },
    );

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province 

      ↑↓ navigate • ⏎ select"
    `);

    events.type('N');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province N
      > No results found

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('backspace');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province 

      ↑↓ navigate • ⏎ select"
    `);

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('handles separators & disabled choices', async () => {
    const choices = [
      new Separator('~ Americas ~'),
      { value: 'Canada' },
      { value: 'United States' },
      { value: 'Mexico' },
      new Separator('~ Europe ~'),
      { value: 'France', disabled: 'Cannot be selected during the Olympics' },
      { value: 'Germany', disabled: true },
      { value: 'Spain' },
    ];

    const { answer, events, getScreen } = await render(search, {
      message: 'Select a country',
      source: getListSearch(choices),
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a country 
       ~ Americas ~
      ❯ Canada
        United States
        Mexico
       ~ Europe ~
      - France Cannot be selected during the Olympics
      - Germany (disabled)

      ↑↓ navigate • ⏎ select"
    `);

    events.type('France');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a country France
       ~ Americas ~
       ~ Europe ~
      - France Cannot be selected during the Olympics

      ↑↓ navigate • ⏎ select"
    `);

    // This event will be ignored;
    events.keypress('enter');

    Array.from({ length: 'France'.length }).forEach(() => events.keypress('backspace'));
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a country 
       ~ Americas ~
      ❯ Canada
        United States
        Mexico
       ~ Europe ~
      - France Cannot be selected during the Olympics
      - Germany (disabled)

      ↑↓ navigate • ⏎ select"
    `);

    events.type('United');
    await Promise.resolve();
    events.keypress('enter');

    await expect(answer).resolves.toEqual('United States');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Select a country United States"`);
  });

  it('handles choices with descriptions', async () => {
    const choices = [
      { value: 'Stark', description: 'Winter is coming' },
      { value: 'Lannister', description: 'Hear me roar' },
      { value: 'Targaryen', description: 'Fire and blood' },
    ];

    const { answer, events, getScreen } = await render(search, {
      message: 'Select a family',
      source: getListSearch(choices),
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family 
      ❯ Stark
        Lannister
        Targaryen

      Winter is coming
      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family 
        Stark
      ❯ Lannister
        Targaryen

      Hear me roar
      ↑↓ navigate • ⏎ select"
    `);

    events.type('Targ');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family Targ
      ❯ Targaryen

      Fire and blood
      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('Targaryen');
  });

  it('allows default parameters to be used as source function parameters', async () => {
    const abortController = new AbortController();
    const { answer } = await render(
      search,
      {
        message: 'Select a family',
        source: (term: string = '') => {
          expectTypeOf(term).toEqualTypeOf<string>();
          return [];
        },
      },
      { signal: abortController.signal },
    );

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('Autocomplete with tab', async () => {
    const { answer, events, getScreen } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province 
      ❯ Alberta
        British Columbia
        Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario

      ↑↓ navigate • ⏎ select"
    `);

    events.type('New');

    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New Brunswick
      ❯ New Brunswick
        Newfoundland and Labrador

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('NB');
  });

  it('Autocomplete when pressing enter fail validation', async () => {
    const FOLDERS = ['src', 'dist'];
    const FILES = ['src/index.mts', 'dist/index.js'];

    const { answer, events, getScreen } = await render(search, {
      message: 'Select a file',
      source: (term?: string) => {
        if (term && FOLDERS.includes(term)) {
          return FILES.filter((file) => file.includes(term)).map((file) => ({
            name: file,
            value: file,
          }));
        }

        return FOLDERS.filter((folder) => !term || folder.includes(term)).map((file) => ({
          name: file,
          value: file,
        }));
      },
      validate: (value: string) => {
        return FILES.includes(value) ? true : 'Invalid file';
      },
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a file 
      ❯ src
        dist

      ↑↓ navigate • ⏎ select"
    `);

    events.type('di');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a file di
      ❯ dist

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a file dist
      ❯ dist/index.js

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('dist/index.js');
  });

  it('handles validation errors', async () => {
    const { answer, events, getScreen } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
      validate: (value: string) => {
        if (value === 'NB') return 'New Brunswick is unavailable at the moment.';
        if (value === 'AB') return false; // Test default error
        return true;
      },
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province 
      ❯ Alberta
        British Columbia
        Manitoba
        New Brunswick
        Newfoundland and Labrador
        Nova Scotia
        Ontario

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await Promise.resolve();
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province Alberta
      ❯ Alberta

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province Alberta
      > You must provide a valid value

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress({ name: 'backspace', ctrl: true });
    events.type('New Brun');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New Brun
      ❯ New Brunswick

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New Brunswick
      ❯ New Brunswick

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress('enter');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New Brunswick
      > New Brunswick is unavailable at the moment.

      ↑↓ navigate • ⏎ select"
    `);

    events.keypress({ name: 'backspace', ctrl: true });
    events.type('Quebec');
    await Promise.resolve();
    events.keypress('enter');
    await expect(answer).resolves.toEqual('QC');
  });

  it('supports custom instructions', async () => {
    const { answer, events, getScreen } = await render(search, {
      message: 'Select a Canadian province',
      source: getListSearch(PROVINCES),
      pageSize: 3,
      instructions: {
        navigation: 'Utiliser les flèches directionnelles',
        pager: 'Utiliser les flèches pour révéler plus de choix',
      },
    });

    // Test custom pager instruction when results exceed pageSize
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province 
      ❯ Alberta
        British Columbia
        Manitoba

      Utiliser les flèches pour révéler plus de choix"
    `);

    // Test custom navigation instruction when results fit in pageSize
    events.type('New');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a Canadian province New
      ❯ New Brunswick
        Newfoundland and Labrador

      Utiliser les flèches directionnelles"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('NB');
  });
});
