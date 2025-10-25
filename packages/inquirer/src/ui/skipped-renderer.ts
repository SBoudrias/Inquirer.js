import colors from 'yoctocolors-cjs';
import { Answers, Question } from '../types.ts';

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

const SkippedRenderer: SkippedRendererType = {
  confirm: (question: TypedQuestion) => {
    const defaultVal = question.default;
    const answerText = defaultVal === true ? 'Yes' : defaultVal === false ? 'No' : '';
    const prefix = '?';
    const line = `${prefix} ${question.message} ${answerText}`;
    return colors.dim(line);
  },

  select: (question: TypedQuestion) => {
    const defaultVal = question.default;
    const prefix = '?';
    let answerText = String(defaultVal);

    if (question.choices && defaultVal !== undefined) {
      const selectedChoice = question.choices.find((c) => c.value === defaultVal);
      answerText = selectedChoice ? selectedChoice.name : String(defaultVal);
    }

    const line = `${prefix} ${question.message} ${answerText}`;
    return colors.dim(line);
  },

  checkbox: (question: TypedQuestion) => {
    const defaultVal = question.default;
    const prefix = '?';
    let answerText = '';

    if (Array.isArray(defaultVal) && question.choices) {
      const selectedNames = question.choices
        .filter((c) => defaultVal.includes(c.value))
        .map((c) => c.name);
      answerText = selectedNames.join(', ');
    } else if (defaultVal !== undefined) {
      answerText = String(defaultVal);
    }

    const line = `${prefix} ${question.message} ${answerText}`;
    return colors.dim(line);
  },

  editor: (question: TypedQuestion) => {
    const prefix = '?';
    const answerText = question.default !== undefined ? '[Default Content]' : '';
    const line = `${prefix} ${question.message} ${answerText}`;
    return colors.dim(line);
  },

  password: (question: TypedQuestion) => {
    const defaultVal = question.default;
    const prefix = '?';
    let answerText = '';

    if (defaultVal !== undefined) {
      answerText = '[PASSWORD SET]';
    }

    const line = `${prefix} ${question.message} ${answerText}`;
    return colors.dim(line);
  },

  default: (question: TypedQuestion) => {
    const prefix = '?';
    const answer = question.default !== undefined ? String(question.default) : '';
    const line = `${prefix} ${question.message} ${answer}`;
    return colors.dim(line);
  },
  list: (question: TypedQuestion) => SkippedRenderer.select(question),
  rawlist: (question: TypedQuestion) => SkippedRenderer.select(question),
  input: (question: TypedQuestion) => SkippedRenderer.default(question),
  number: (question: TypedQuestion) => SkippedRenderer.default(question),
};

export default SkippedRenderer;
