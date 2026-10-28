import type { FullTestDraftDto } from "../types/test";
import {
  QuestionType,
  type CreateQuestionDto,
  type QuestionDto,
} from "../types/testQuestion";
import {
  toTestPayload,
  type TestSettingsValues,
} from "./testForm";
import type { AiGeneratedQuestionDto } from "../types/aiGeneration";

export interface OptionDraft {
  key: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionDraft {
  key: string;
  text: string;
  type: QuestionType;
  points: string;
  answerOptions: OptionDraft[];

  aiSource?: {
    materialId: number | null;
    materialTitle: string | null;
    chunkIndex: number | null;
    excerpt: string | null;
  };
}

export function createQuestionDraft(): QuestionDraft {
  return {
    key: crypto.randomUUID(),
    text: "",
    type: QuestionType.SingleChoice,
    points: "1",
    answerOptions: [
      { key: crypto.randomUUID(), text: "", isCorrect: true },
      { key: crypto.randomUUID(), text: "", isCorrect: false },
    ],
  };
}

export function createTrueFalseOptions(): OptionDraft[] {
  return [
    { key: crypto.randomUUID(), text: "Так", isCorrect: true },
    { key: crypto.randomUUID(), text: "Ні", isCorrect: false },
  ];
}

export function mapQuestionToDraft(question: QuestionDto): QuestionDraft {
  return {
    key: crypto.randomUUID(),
    text: question.text,
    type: question.type,
    points: String(question.points),
    answerOptions: [...question.answerOptions]
      .sort((a, b) => a.order - b.order)
      .map((option) => ({
        key: crypto.randomUUID(),
        text: option.text,
        isCorrect: option.isCorrect,
      })),
  };
}
export function mapAiQuestionToDraft(
  question: AiGeneratedQuestionDto,
): QuestionDraft {
  return {
    key: crypto.randomUUID(),

    text: question.text,
    type: question.type,
    points: String(question.points),

    answerOptions: question.options.map((option) => ({
      key: crypto.randomUUID(),
      text: option.text,
      isCorrect: option.isCorrect,
    })),

    aiSource: {
      materialId: question.sourceMaterialId,
      materialTitle: question.sourceMaterialTitle,
      chunkIndex: question.sourceChunkIndex,
      excerpt: question.sourceExcerpt,
    },
  };
}

export function validateDraftQuestions(
  questions: QuestionDraft[],
): string | null {
  if (questions.length === 0) {
    return "Додайте щонайменше одне питання.";
  }

  for (const [index, question] of questions.entries()) {
    const prefix = `Питання ${index + 1}:`;

    if (!question.text.trim() || question.text.trim().length > 2000) {
      return `${prefix} введіть текст питання (до 2000 символів).`;
    }

    const points = Number(question.points);

    if (
      !/^\d+$/.test(question.points.trim()) ||
      !Number.isSafeInteger(points) ||
      points <= 0
    ) {
      return `${prefix} бали мають бути цілим додатним числом.`;
    }

    if (question.type === QuestionType.Text) {
      return `${prefix} текстові питання поки не підтримуються.`;
    }

    if (question.answerOptions.length < 2) {
      return `${prefix} потрібно щонайменше два варіанти.`;
    }

    if (
      question.answerOptions.some(
        (option) =>
          !option.text.trim() ||
          option.text.trim().length > 1000,
      )
    ) {
      return `${prefix} заповніть усі варіанти (до 1000 символів).`;
    }

    const correctCount = question.answerOptions.filter(
      (option) => option.isCorrect,
    ).length;

    if (
      question.type === QuestionType.SingleChoice &&
      correctCount !== 1
    ) {
      return `${prefix} оберіть одну правильну відповідь.`;
    }

    if (
      question.type === QuestionType.MultipleChoice &&
      correctCount < 2
    ) {
      return `${prefix} оберіть щонайменше дві правильні відповіді.`;
    }

    if (
      question.type === QuestionType.TrueFalse &&
      (question.answerOptions.length !== 2 || correctCount !== 1)
    ) {
      return `${prefix} для «Так / Ні» потрібна одна правильна відповідь.`;
    }
  }

  return null;
}

export function buildFullTestPayload(
  settings: TestSettingsValues,
  questions: QuestionDraft[],
): FullTestDraftDto {
  return {
    ...toTestPayload(settings),

    questions: questions.map(
      (question): CreateQuestionDto => ({
        text: question.text.trim(),
        type: question.type,
        points: Number(question.points),

        answerOptions: question.answerOptions.map((option) => ({
          text: option.text.trim(),
          isCorrect: option.isCorrect,
        })),
      }),
    ),
  };
}