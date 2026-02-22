import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import AFTER @inquirer/testing/vitest to ensure mocks are applied
import { checkbox } from '@inquirer/i18n/zh';

const choices = [
  { name: '选项一', value: '1' },
  { name: '选项二', value: '2' },
  { name: '选项三', value: '3' },
];

describe('checkbox (zh)', () => {
  it('idle state shows choices with Chinese help tip', async () => {
    const answer = checkbox({ message: '请选择', choices });
    const output = screen.getScreen();
    expect(output).toContain('导航');
    expect(output).toContain('选择');
    expect(output).toContain('提交');
    expect(output).toContain('全选');
    expect(output).toContain('反选');

    screen.keypress({ name: 'space' });
    screen.keypress('enter');
    await answer;
  });

  it('pressing space selects the first item', async () => {
    const answer = checkbox({ message: '请选择', choices });
    screen.keypress({ name: 'space' });
    expect(screen.getScreen()).toContain('◉');

    screen.keypress('enter');
    await answer;
  });

  it('pressing enter submits selected values', async () => {
    const answer = checkbox({ message: '请选择', choices });
    screen.keypress({ name: 'space' });
    screen.keypress('enter');
    await expect(answer).resolves.toEqual(['1']);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 请选择 选项一"`);
  });
});
