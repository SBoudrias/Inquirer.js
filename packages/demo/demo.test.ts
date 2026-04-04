import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import demos AFTER @inquirer/testing/vitest to ensure mocks are applied
import confirmDemo from './src/demos/confirm.ts';
import inputDemo from './src/demos/input.ts';
import selectDemo from './src/demos/select.ts';
import checkboxDemo from './src/demos/checkbox.ts';
import editorDemo from './src/demos/editor.ts';

describe('@inquirer/demo E2E tests', () => {
  describe('screen.getScreen()', () => {
    it('returns the current prompt screen', async () => {
      const demo = confirmDemo();
      expect(screen.getScreen()).toMatchInlineSnapshot(`"? Confirm? (Y/n)"`);

      screen.keypress('enter');
      await screen.next();
      expect(screen.getScreen()).toMatchInlineSnapshot(
        `"? Confirm with default to no? (y/N)"`,
      );

      screen.keypress('enter');
      await screen.next();
      expect(screen.getScreen()).toMatchInlineSnapshot(
        `"? Confirm with your custom transformer function? (Y/n)"`,
      );

      screen.keypress('enter');
      await screen.next();
      expect(screen.getScreen()).toMatchInlineSnapshot(`"? Confirm? (Y/n)"`);

      screen.keypress('enter');
      await demo;

      expect(await screen.getFullOutput()).toMatchInlineSnapshot(`
        "✔ Confirm? Yes
        ✔ Confirm with default to no? No
        ✔ Confirm with your custom transformer function? 👍"
      `);
    });
  });

  describe('screen.getFullOutput()', () => {
    it('accumulates all output across prompts', async () => {
      const demo = confirmDemo();
      expect(screen.getScreen()).toMatchInlineSnapshot(`"? Confirm? (Y/n)"`);

      screen.keypress('enter');
      await screen.next();
      expect(screen.getScreen()).toMatchInlineSnapshot(
        `"? Confirm with default to no? (y/N)"`,
      );

      // Full output contains both prompts
      expect(await screen.getFullOutput()).toMatchInlineSnapshot(`
        "✔ Confirm? Yes
        ? Confirm with default to no? (y/N)"
      `);

      screen.keypress('enter');
      await screen.next();
      screen.keypress('enter');
      await screen.next();
      screen.keypress('enter');
      await demo;

      // Final output contains all prompts
      expect(await screen.getFullOutput()).toMatchInlineSnapshot(`
        "✔ Confirm? Yes
        ✔ Confirm with default to no? No
        ✔ Confirm with your custom transformer function? 👍"
      `);
    });
  });

  describe('screen.type()', () => {
    it('types text into input prompts', async () => {
      const demo = inputDemo();
      expect(screen.getScreen()).toMatchInlineSnapshot(
        `"? What's your favorite food? (Croissant)"`,
      );

      screen.type('Pizza');
      expect(screen.getScreen()).toMatchInlineSnapshot(
        `"? What's your favorite food? Pizza"`,
      );

      screen.keypress('enter');
      await screen.next();
      expect(screen.getScreen()).toMatchInlineSnapshot(`"? Enter an hex color?"`);

      screen.type('fff');
      expect(screen.getScreen()).toMatchInlineSnapshot(`"? Enter an hex color? fff"`);

      screen.keypress('enter');
      await screen.next();
      expect(screen.getScreen()).toMatchInlineSnapshot(
        `"? (Slow validation) provide a number:"`,
      );

      screen.type('42');
      expect(screen.getScreen()).toMatchInlineSnapshot(
        `"? (Slow validation) provide a number: 42"`,
      );

      screen.keypress('enter');
      await demo;

      expect(await screen.getFullOutput()).toMatchInlineSnapshot(`
        "✔ What's your favorite food? Pizza
        ✔ Enter an hex color? fff
        ✔ (Slow validation) provide a number: 42"
      `);
    }, 10000);
  });

  describe('screen.keypress()', () => {
    it('navigates with arrow keys', async () => {
      const demo = selectDemo();
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a package manager
        ❯ npm
          yarn
         ──────────────
        - jspm (disabled)
        - pnpm (pnpm is not available)

        npm is the most popular package manager
        ↑↓ navigate • ⏎ select"
      `);

      screen.keypress('down');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a package manager
          npm
        ❯ yarn
         ──────────────
        - jspm (disabled)
        - pnpm (pnpm is not available)

        yarn is an awesome package manager
        ↑↓ navigate • ⏎ select"
      `);

      screen.keypress('enter');
      await screen.next();
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select your favorite letter
         == Alphabet (choices cycle as you scroll through) ==
        ❯ A
          B
          C
          D
          E
          F

        ↑↓ navigate • ⏎ select"
      `);

      screen.keypress('enter');
      await screen.next();
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select your favorite letter (example without loop)
         == Alphabet (choices cycle as you scroll through) ==
        ❯ A
          B
          C
          D
          E
          F

        ↑↓ navigate • ⏎ select"
      `);

      screen.keypress('enter');
      await screen.next();
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a recipe
        ❯ Spaghetti Carbonara
            Eggs, Pecorino Romano, Pancetta
            30 minutes
          Margherita Pizza
            Tomatoes, Mozzarella, Basil
            45 minutes
          Caesar Salad

        ↑↓ navigate • ⏎ select"
      `);

      screen.keypress('enter');
      await demo;

      expect(await screen.getFullOutput()).toMatchInlineSnapshot(`
        "✔ Select a package manager yarn
        ✔ Select your favorite letter A
        ✔ Select your favorite letter (example without loop) A
        ✔ Select a recipe Spaghetti Carbonara"
      `);
    });

    it('toggles with space key', async () => {
      const demo = checkboxDemo();
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a package manager
        ❯◯ npm
         ◯ yarn
         ──────────────
         - jspm (disabled)
         - pnpm (pnpm is not available)
         ◎ Node.js (required dependency)

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);

      screen.keypress({ name: 'space' });
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a package manager
        ❯◉ npm
         ◯ yarn
         ──────────────
         - jspm (disabled)
         - pnpm (pnpm is not available)
         ◎ Node.js (required dependency)

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);

      screen.keypress('enter');
      await screen.next();
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select your favorite letters
         == Alphabet (choices cycle as you scroll through) ==
        ❯◉ A
         ◯ B
         ◉ C
         ◯ D
         ◯ E
         ◯ F

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);

      screen.keypress('enter');
      await demo;

      expect(await screen.getFullOutput()).toMatchInlineSnapshot(`
        "✔ Select a package manager npm, Node.js
        ✔ Select your favorite letters A, C"
      `);
    });
  });

  describe('editor prompt', () => {
    it('captures typed text as editor content', async () => {
      const demo = editorDemo();
      expect(screen.getScreen()).toContain('short bio');

      // Press enter to open the editor, type content, then enter to save
      screen.keypress('enter');
      screen.type('Line 1\nLine 2\nLine 3');
      screen.keypress('enter');

      // Second prompt opens editor automatically (waitForUserInput: false)
      await screen.next();
      screen.type('Auto editor content');
      screen.keypress('enter');

      // Third prompt opens editor with custom messages
      await screen.next();
      screen.keypress('enter');
      screen.type('Custom messages content');
      screen.keypress('enter');

      await demo;
    }, 10000);
  });

  describe('screen.clear()', () => {
    it('resets screen state between test runs', async () => {
      const demo1 = confirmDemo();
      expect(screen.getScreen()).toMatchInlineSnapshot(`"? Confirm? (Y/n)"`);

      screen.keypress('enter');
      await screen.next();
      screen.keypress('enter');
      await screen.next();
      screen.keypress('enter');
      await screen.next();
      screen.keypress('enter');
      await demo1;

      screen.clear();

      const demo2 = confirmDemo();
      expect(screen.getScreen()).toMatchInlineSnapshot(`"? Confirm? (Y/n)"`);

      // After clear, full output only contains second run
      const matches = (await screen.getFullOutput()).match(/Confirm\?/g) || [];
      expect(matches.length).toBe(1);

      screen.keypress('enter');
      await screen.next();
      screen.keypress('enter');
      await screen.next();
      screen.keypress('enter');
      await screen.next();
      screen.keypress('enter');
      await demo2;

      expect(await screen.getFullOutput()).toMatchInlineSnapshot(`
        "✔ Confirm? Yes
        ✔ Confirm with default to no? No
        ✔ Confirm with your custom transformer function? 👍"
      `);
    });
  });
});
