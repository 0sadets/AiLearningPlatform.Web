import type { QuestionType } from "./testQuestion";

export const TestAttemptStatus = {
  InProgress: 1,
  Completed: 2,
} as const;

export type TestAttemptStatus =
  (typeof TestAttemptStatus)[keyof typeof TestAttemptStatus];

export interface StudentTestOptionDto {
  id: number;
  text: string;
  order: number;
}

export interface StudentTestQuestionDto {
  id: number;
  text: string;
  type: QuestionType;
  order: number;
  points: number;
  answerOptions: StudentTestOptionDto[];
}

export interface TestAttemptDto {
  id: number;
  testId: number;
  testTitle: string;
  startedAt: string;
  status: TestAttemptStatus;
  questions: StudentTestQuestionDto[];
}

export interface SubmitAnswerDto {
  questionId: number;
  selectedOptionIds: number[];
}

export interface SubmitTestAttemptDto {
  answers: SubmitAnswerDto[];
}

export interface TestAttemptResultDto {
  id: number;
  testId: number;
  status: TestAttemptStatus;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
}