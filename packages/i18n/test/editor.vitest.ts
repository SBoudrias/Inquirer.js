import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import AFTER @inquirer/testing/vitest to ensure mocks are applied
import { editor } from '@inquirer/i18n/zh';

describe('editor (zh)', () => {
  it('idle state shows Chinese waiting message', async () => {
    const answer = editor({ message: '请输入描述' });
    expect(screen.getScreen()).toContain('按');
    expect(screen.getScreen()).toContain('键启动您的首选编辑器。');

    screen.keypress('enter');
    screen.type('内容');
    screen.keypress('enter');
    await answer;
  });

  it('after editing shows done state', async () => {
    const answer = editor({ message: '请输入描述' });
    screen.keypress('enter');
    screen.type('编辑器内容');
    screen.keypress('enter');
    await answer;
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 请输入描述"`);
  });
});
