import { screen } from '@inquirer/testing/jest';
// Default-imported prompts must be usable after the adapter auto-mocks
// their package: without an __esModule marker on the mock, interop wraps
// it again and `input(...)` becomes "(0, _input.default) is not a function".
import input from '@inquirer/input';

describe('jest adapter (public API)', () => {
  it('auto-mocks default-imported prompt packages', async () => {
    const answer = input({ message: 'Your name' });
    expect(screen.getScreen()).toContain('Your name');
    screen.type('ada');
    screen.keypress('enter');
    expect(await answer).toBe('ada');
  });
});
