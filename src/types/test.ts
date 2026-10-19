import type { CreateQuestionDto } from "./testQuestion";
export interface StudentTestProgressDto {
  status: number;

  attemptsCount: number;
  completedAttemptsCount: number;

  remainingAttempts: number | null;
  activeAttemptId: number | null;

  bestScore: number | null;
  bestMaxScore: number | null;
  bestPercentage: number | null;

  lastCompletedAt: string | null;

  isDeadlinePassed: boolean;

  canStartNewAttempt: boolean;
  canContinueAttempt: boolean;
}
export interface TestDto {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  isPublished: boolean;
  isArchived: boolean;
  maxAttempts: number | null;
  deadline: string | null;
  questionsCount: number;
  totalPoints: number;
  createdAt: string;
  updatedAt: string | null;
  studentProgress?: StudentTestProgressDto | null;
}

export interface CreateTestDto {
  title: string;
  description?: string | null;
  maxAttempts?: number | null;
  deadline?: string | null;
}

export type UpdateTestDto = CreateTestDto;

export interface FullTestDraftDto extends CreateTestDto {
  questions: CreateQuestionDto[];
}

export const StudentTestStatus = {
  NotStarted: 1,
  InProgress: 2,
  Completed: 3,
  Expired: 4,
  AttemptsExhausted: 5,
}

export type StudentTestStatus =
  (typeof StudentTestStatus)[keyof typeof StudentTestStatus]

