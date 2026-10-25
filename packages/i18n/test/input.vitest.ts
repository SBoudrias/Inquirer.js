import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import AFTER @inquirer/testing/vitest to ensure mocks are applied
import { input } from '@inquirer/i18n/zh';

describe('input (zh)', () => {
  it('idle state shows input prompt', async () => {
    const answer = input({ message: '请输入名称' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 请输入名称"`);

    screen.type('测试');
    screen.keypress('enter');
    await answer;
  });

  it('typing shows entered text', async () => {
    const answer = input({ message: '请输入名称' });
    screen.type('测试');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 请输入名称 测试"`);

    screen.keypress('enter');
    await answer;
  });

  it('done state shows the answer', async () => {
    const answer = input({ message: '请输入名称' });
    screen.type('测试');
    screen.keypress('enter');
    await expect(answer).resolves.toBe('测试');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 请输入名称 测试"`);
  });
});
