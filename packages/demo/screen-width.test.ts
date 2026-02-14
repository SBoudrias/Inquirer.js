import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import { input } from '@inquirer/prompts';

describe('@inquirer/testing screen width', () => {
  it('does not hard-wrap long lines at 80 columns', async () => {
    const longMessage = 'A'.repeat(200);
    const { answer, getScreen, events } = await render(input, {
      message: longMessage,
    });

    const screen = getScreen();
    // The prompt should render on a single line (? + message), not wrapped
    expect(screen).not.toContain('\n');
    expect(screen).toContain(longMessage);

    events.type('x');
    events.keypress('enter');
    await answer;
  });

  it('does not hard-wrap long lines in getFullOutput()', async () => {
    const longMessage = 'A'.repeat(200);
    const { answer, getFullOutput, events } = await render(input, {
      message: longMessage,
    });

    events.type('x');
    events.keypress('enter');
    await answer;

    const output = await getFullOutput();
    // The done line should contain the full message on one line
    expect(output).toContain(longMessage);
  });
});
