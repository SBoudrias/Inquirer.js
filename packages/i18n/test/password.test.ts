import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import AFTER @inquirer/testing/vitest to ensure mocks are applied
import { password } from '@inquirer/i18n/zh';

describe('password (zh)', () => {
  it('idle state shows Chinese masked text', async () => {
    const answer = password({ message: '请输入密码' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 请输入密码 [输入已隐藏]"`);

    screen.type('secret');
    screen.keypress('enter');
    await answer;
  });

  it('after typing still shows masked text', async () => {
    const answer = password({ message: '请输入密码' });
    screen.type('secret');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 请输入密码 [输入已隐藏]"`);

    screen.keypress('enter');
    await answer;
  });

  it('done state shows completion', async () => {
    const answer = password({ message: '请输入密码' });
    screen.type('secret');
    screen.keypress('enter');
    await expect(answer).resolves.toBe('secret');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 请输入密码"`);
  });
});
