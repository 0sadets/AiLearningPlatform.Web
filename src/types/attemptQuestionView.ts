import type { QuestionType } from "./testQuestion";

export interface AttemptAnswerOptionView {
  id: number;
  text: string;
  order: number;
  isCorrect: boolean;
  isSelected: boolean;
}

export interface AttemptQuestionView {
  questionId: number;
  text: string;
  type: QuestionType;
  order: number;
  points: number;

  isAnswered: boolean;
  isCorrect: boolean;

  textAnswer: string | null;
  earnedPoints: number | null;

  answerOptions: AttemptAnswerOptionView[];

  isAiGenerated: boolean;
  sourceMaterialId: number | null;
  sourceMaterialTitle: string | null;
  sourceChunkIndex: number | null;
  sourceExcerpt: string | null;
}