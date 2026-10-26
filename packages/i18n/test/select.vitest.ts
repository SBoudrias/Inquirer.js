import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import AFTER @inquirer/testing/vitest to ensure mocks are applied
import { select } from '@inquirer/i18n/zh';

const choices = [
  { name: '选项一', value: '1' },
  { name: '选项二', value: '2' },
  { name: '选项三', value: '3' },
];

describe('select (zh)', () => {
  it('idle state shows first choice highlighted with Chinese help tip', async () => {
    const answer = select({ message: '请选择', choices });
    const output = screen.getScreen();
    expect(output).toContain('导航');
    expect(output).toContain('选择');
    expect(output).toContain('❯ 选项一');

    screen.keypress('enter');
    await answer;
  });

  it('pressing down highlights second choice', async () => {
    const answer = select({ message: '请选择', choices });
    screen.keypress('down');
    expect(screen.getScreen()).toContain('❯ 选项二');

    screen.keypress('enter');
    await answer;
  });

  it('pressing enter selects the current choice', async () => {
    const answer = select({ message: '请选择', choices });
    screen.keypress('enter');
    await expect(answer).resolves.toBe('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 请选择 选项一"`);
  });
});
