import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import AFTER @inquirer/testing/vitest to ensure mocks are applied
import { expand } from '@inquirer/i18n/zh';

const choices = [
  { key: 'y' as const, name: '覆盖', value: 'overwrite' },
  { key: 'n' as const, name: '跳过', value: 'skip' },
  { key: 'd' as const, name: '查看差异', value: 'diff' },
];

describe('expand (zh)', () => {
  it('idle state shows collapsed letter choices', async () => {
    const answer = expand({ message: '覆盖此文件?', choices });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 覆盖此文件? (yndH)"`);

    screen.type('y');
    screen.keypress('enter');
    await answer;
  });

  it('pressing h and enter shows expanded list without help choice', async () => {
    const answer = expand({ message: '覆盖此文件?', choices });
    screen.type('h');
    screen.keypress('enter');
    const output = screen.getScreen();
    expect(output).toContain('y) 覆盖');
    expect(output).toContain('n) 跳过');
    expect(output).toContain('d) 查看差异');

    screen.type('y');
    screen.keypress('enter');
    await answer;
  });

  it('selecting a choice shows done state', async () => {
    const answer = expand({ message: '覆盖此文件?', choices });
    screen.type('y');
    screen.keypress('enter');
    await expect(answer).resolves.toBe('overwrite');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 覆盖此文件? 覆盖"`);
  });
});
