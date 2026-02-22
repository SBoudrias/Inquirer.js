import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import AFTER @inquirer/testing/vitest to ensure mocks are applied
import { confirm } from '@inquirer/i18n/zh';

describe('confirm (zh)', () => {
  it('idle state with default=true shows Chinese hint', async () => {
    const answer = confirm({ message: '你想继续吗?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 你想继续吗? (是/否)"`);

    screen.keypress('enter');
    await answer;
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 你想继续吗? 是"`);
  });

  it('idle state with default=false shows Chinese hint', async () => {
    const answer = confirm({ message: '你想继续吗?', default: false });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 你想继续吗? (是/否)"`);

    screen.keypress('enter');
    await answer;
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 你想继续吗? 否"`);
  });

  it('pressing enter with default=true resolves to true', async () => {
    const answer = confirm({ message: '确认?' });
    screen.keypress('enter');
    await expect(answer).resolves.toBe(true);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 确认? 是"`);
  });

  it('pressing enter with default=false resolves to false', async () => {
    const answer = confirm({ message: '确认?', default: false });
    screen.keypress('enter');
    await expect(answer).resolves.toBe(false);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 确认? 否"`);
  });

  it('pressing y still resolves to true in Chinese locale', async () => {
    const answer = confirm({ message: '确认?' });
    screen.type('y');
    screen.keypress('enter');
    await expect(answer).resolves.toBe(true);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 确认? 是"`);
  });

  it('pressing n still resolves to false in Chinese locale', async () => {
    const answer = confirm({ message: '确认?' });
    screen.type('n');
    screen.keypress('enter');
    await expect(answer).resolves.toBe(false);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 确认? 否"`);
  });
});
