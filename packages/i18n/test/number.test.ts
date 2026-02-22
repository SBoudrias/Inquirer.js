import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import AFTER @inquirer/testing/vitest to ensure mocks are applied
import { number } from '@inquirer/i18n/zh';

describe('number (zh)', () => {
  it('idle state shows empty input', async () => {
    const answer = number({ message: '请输入数字' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 请输入数字"`);

    screen.type('42');
    screen.keypress('enter');
    await answer;
  });

  it('typing a number shows it', async () => {
    const answer = number({ message: '请输入数字' });
    screen.type('42');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 请输入数字 42"`);

    screen.keypress('enter');
    await answer;
  });

  it('done state shows the number answer', async () => {
    const answer = number({ message: '请输入数字' });
    screen.type('42');
    screen.keypress('enter');
    await expect(answer).resolves.toBe(42);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 请输入数字 42"`);
  });
});
