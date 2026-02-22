import { createLocalizedPrompts } from '../create.ts';
import type { Locale } from '../types.ts';

const zhLocale: Locale = {
  confirm: {
    yesLabel: '是',
    noLabel: '否',
    hintYes: '是/否',
    hintNo: '是/否',
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
    waitingMessage: (enterKey) => `按 ${enterKey} 键启动您的首选编辑器。`,
  },
  password: {
    maskedText: '[输入已隐藏]',
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
} = createLocalizedPrompts(zhLocale);

export { Separator } from '@inquirer/prompts';
