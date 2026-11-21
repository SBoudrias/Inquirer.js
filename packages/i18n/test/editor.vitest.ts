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

  it('shows the localized validation error when the validator rejects without a message', async () => {
    const answer = editor({
      message: '请输入描述',
      validate: (value: string) => value === '有效内容',
    });
    screen.keypress('enter');
    screen.type('内容');
    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toContain('您必须提供有效的值');

    // The prompt stays usable: the kept edits round-trip through a retry.
    screen.keypress('enter');
    screen.type('有效内容');
    screen.keypress('enter');
    await expect(answer).resolves.toBe('有效内容');
  });

  it('lets the theme override the localized validation error', async () => {
    const answer = editor({
      message: '请输入描述',
      validate: (value: string) => value === 'ok',
      theme: { style: { validationError: 'Nope' } },
    });
    screen.keypress('enter');
    screen.type('no');
    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toContain('Nope');

    screen.keypress('enter');
    screen.type('ok');
    screen.keypress('enter');
    await expect(answer).resolves.toBe('ok');
  });
});
