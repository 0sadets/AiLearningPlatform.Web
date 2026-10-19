import type { QuestionType } from "./testQuestion";
import type { TestAttemptStatus } from "./testAttempt";

export interface TeacherAttemptSummaryDto {
  attemptId: number;
  status: TestAttemptStatus;
  startedAt: string;
  completedAt: string | null;

  score: number | null;
  maxScore: number | null;
  percentage: number | null;
}

export interface TeacherStudentResultDto {
  userId: number;

  firstName: string;
  lastName: string;
  email: string;

  attemptsCount: number;

  bestScore: number | null;
  bestMaxScore: number | null;
  bestPercentage: number | null;

  lastCompletedAt: string | null;

  attempts: TeacherAttemptSummaryDto[];
}

export interface TeacherTestResultsDto {
  testId: number;
  testTitle: string;

  studentsCount: number;

  totalAttempts: number;
  completedAttempts: number;
  inProgressAttempts: number;

  students: TeacherStudentResultDto[];
}

export interface TeacherAnswerOptionResultDto {
  id: number;
  text: string;
  order: number;

  isCorrect: boolean;
  isSelected: boolean;
}

export interface TeacherQuestionResultDto {
  questionId: number;

  text: string;
  type: QuestionType;

  order: number;
  points: number;
  earnedPoints: number;

  wasAnswered: boolean;
  isCorrect: boolean;

  answerOptions: TeacherAnswerOptionResultDto[];
}

export interface TeacherAttemptDetailsDto {
  attemptId: number;
  testId: number;
  testTitle: string;

  userId: number;
  firstName: string;
  lastName: string;
  email: string;

  status: TestAttemptStatus;

  startedAt: string;
  completedAt: string | null;

  score: number | null;
  maxScore: number | null;
  percentage: number | null;

  questions: TeacherQuestionResultDto[];
}