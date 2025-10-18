import { Answers, Question } from '../types.ts';
import { makeTheme } from '@inquirer/core';

type RendererFunction<A extends Answers = Answers> = (question: Question<A>) => string;

type Choice = { name: string; value: string | number };

type TypedQuestion<A extends Answers = Answers, T = string | boolean | number> = Omit<
  Question<A>,
  'choices' | 'default'
> & {
  choices?: Choice[];
  default?: T; // now default is typed
};

type SkippedRendererType<A extends Answers = Answers> = {
  [key: string]: RendererFunction<A>;
  confirm: RendererFunction<A>;
  select: RendererFunction<A>;
  checkbox: RendererFunction<A>;
  editor: RendererFunction<A>;
  password: RendererFunction<A>;
  default: RendererFunction<A>;
};
const theme = makeTheme();
const prefix = typeof theme.prefix === 'string' ? theme.prefix : theme.prefix.idle;

const SkippedRenderer: SkippedRendererType = {
  confirm: (question: TypedQuestion) => {
    const defaultVal = question.default;
    const answerText = defaultVal === true ? 'Yes' : defaultVal === false ? 'No' : '';
    return renderLine(question.message.toString(), answerText);
  },

  select: (question: TypedQuestion) => {
    const defaultVal = question.default;
    let answerText = String(defaultVal);

    if (question.choices && defaultVal !== undefined) {
      const selectedChoice = question.choices.find((c) => c.value === defaultVal);
      answerText = selectedChoice ? selectedChoice.name : String(defaultVal);
    }
    return renderLine(question.message.toString(), answerText);
  },

  checkbox: (question: TypedQuestion) => {
    const defaultVal = question.default;
    let answerText = '';

    if (Array.isArray(defaultVal) && question.choices) {
      const selectedNames = question.choices
        .filter((c) => defaultVal.includes(c.value))
        .map((c) => c.name);
      answerText = selectedNames.join(', ');
    } else if (defaultVal !== undefined) {
      answerText = String(defaultVal);
    }

    return renderLine(question.message.toString(), answerText);
  },

  editor: (question: TypedQuestion) => {
    const answerText = question.default !== undefined ? '[Default Content]' : '';
    return renderLine(question.message.toString(), answerText);
  },

  password: (question: TypedQuestion) => {
    const defaultVal = question.default;
    let answerText = '';

    if (defaultVal !== undefined) {
      answerText = '[PASSWORD SET]';
    }
    return renderLine(question.message.toString(), answerText);
  },

  default: (question: TypedQuestion) => {
    const answerText = question.default !== undefined ? String(question.default) : '';
    return renderLine(question.message.toString(), answerText);
  },
  list: (question: TypedQuestion) => SkippedRenderer.select(question),
  rawlist: (question: TypedQuestion) => SkippedRenderer.select(question),
  input: (question: TypedQuestion) => SkippedRenderer.default(question),
  number: (question: TypedQuestion) => SkippedRenderer.default(question),
};

function renderLine(message: string, answerText: string) {
  return theme.style.help(`${prefix} ${message} ${answerText}`);
}

export default SkippedRenderer;
