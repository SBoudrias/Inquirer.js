import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import AFTER @inquirer/testing/vitest to ensure mocks are applied
import { search } from '@inquirer/i18n/zh';

const source = (input?: string) =>
  ['选项一', '选项二', '选项三']
    .filter((opt) => !input || opt.includes(input))
    .map((value) => ({ value }));

describe('search (zh)', () => {
  it('idle state shows search prompt with Chinese help tip', async () => {
    const answer = search({ message: '搜索', source });
    await screen.next();
    const output = screen.getScreen();
    expect(output).toContain('导航');
    expect(output).toContain('选择');

    screen.keypress('enter');
    await answer;
  });

  it('typing filters results', async () => {
    const answer = search({ message: '搜索', source });
    await screen.next();
    screen.type('二');
    await screen.next();
    expect(screen.getScreen()).toContain('选项二');

    screen.keypress('enter');
    await answer;
  });

  it('pressing enter selects the current choice', async () => {
    const answer = search({ message: '搜索', source });
    await screen.next();
    screen.keypress('enter');
    await expect(answer).resolves.toBe('选项一');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 搜索 选项一"`);
  });
});
