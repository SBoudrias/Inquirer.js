import { createLocalizedPrompts } from '../create.ts';
import type { Locale } from '../types.ts';

export const locale: Locale = {
  confirm: {
    yesLabel: '是',
    noLabel: '否',
  },
  select: {
    helpNavigate: '导航',
    helpSelect: '选择',
  },
  checkbox: {
    helpNavigate: '导航',
    helpSelect: '选择',
    helpSubmit: '提交',
    helpAll: '全选',
    helpInvert: '反选',
  },
  search: {
    helpNavigate: '导航',
    helpSelect: '选择',
  },
  editor: {
    loadingMessage: () => '验证中...',
    waitingMessage: (enterKey) => `按 ${enterKey} 键启动您的首选编辑器。`,
  },
  password: {
    maskedText: '[输入已隐藏]',
    helpToggle: '切换可见性',
  },
};

export const {
  confirm,
  select,
  checkbox,
  search,
  expand,
  rawlist,
  editor,
  input,
  number,
  password,
} = createLocalizedPrompts(locale);

export { Separator } from '@inquirer/prompts';
