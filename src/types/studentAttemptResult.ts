import type { QuestionType } from "./testQuestion";

export interface StudentResultAnswerOptionDto {
  id: number;
  text: string;
  order: number;
  isCorrect: boolean;
  isSelected: boolean;
}

export interface StudentResultQuestionDto {
  questionId: number;
  text: string;
  type: QuestionType;
  points: number;
  order: number;

  isAnswered: boolean;
  isCorrect: boolean;
  textAnswer: string | null;

  answerOptions: StudentResultAnswerOptionDto[];

  isAiGenerated: boolean;
  sourceMaterialId: number | null;
  sourceMaterialTitle: string | null;
  sourceChunkIndex: number | null;
  sourceExcerpt: string | null;
}

export interface StudentAttemptResultDto {
  id: number;
  testId: number;

  status: number;
  startedAt: string;
  completedAt: string | null;

  score: number | null;
  maxScore: number | null;
  percentage: number | null;

  questions: StudentResultQuestionDto[];
}