import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import AFTER @inquirer/testing/vitest to ensure mocks are applied
import { rawlist } from '@inquirer/i18n/zh';

const choices = [
  { name: '选项一', value: '1' },
  { name: '选项二', value: '2' },
  { name: '选项三', value: '3' },
];

describe('rawlist (zh)', () => {
  it('idle state shows numbered choices', async () => {
    const answer = rawlist({ message: '请选择', choices });
    const output = screen.getScreen();
    expect(output).toContain('1) 选项一');
    expect(output).toContain('2) 选项二');
    expect(output).toContain('3) 选项三');

    screen.type('1');
    screen.keypress('enter');
    await answer;
  });

  it('typing a number highlights that item', async () => {
    const answer = rawlist({ message: '请选择', choices });
    screen.type('2');
    expect(screen.getScreen()).toContain('2');

    screen.keypress('enter');
    await answer;
  });

  it('pressing enter selects the typed choice', async () => {
    const answer = rawlist({ message: '请选择', choices });
    screen.type('1');
    screen.keypress('enter');
    await expect(answer).resolves.toBe('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 请选择 选项一"`);
  });
});
