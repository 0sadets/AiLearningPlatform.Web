import type { QuestionType } from "./testQuestion";

export type AiDifficulty = "easy" | "medium" | "hard";

export type AiGenerationStatus =
  | "Pending"
  | "Processing"
  | "Completed"
  | "PartiallyCompleted"
  | "Failed"
  | "Cancelled";

export interface AiQuestionCounts {
  singleChoice: number;
  multipleChoice: number;
  trueFalse: number;
}

export interface CreateAiGenerationDto {
  materialIds: number[];
  difficulty: AiDifficulty;
  questionCounts: AiQuestionCounts;
  existingQuestions?: string[];
}

export interface AiGenerationJobDto {
  id: string;
  courseId: number;
  status: AiGenerationStatus;

  requestedQuestionsCount: number;
  generatedQuestionsCount: number;
  progressPercentage: number;

  currentBatchIndex: number;
  totalBatches: number;
  llmCallsCount: number;

  modelId: string | null;
  errorMessage: string | null;

  cancellationRequested: boolean;
  isFinished: boolean;

  createdAtUtc: string;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
}

export interface AiGeneratedOptionDto {
  text: string;
  isCorrect: boolean;
}

export interface AiGeneratedQuestionDto {
  text: string;
  type: QuestionType;
  points: number;

  options: AiGeneratedOptionDto[];

  sourceMaterialId: number | null;
  sourceMaterialTitle: string | null;
  sourceChunkIndex: number | null;
  sourceExcerpt: string | null;
}

export interface AiGenerationCallDto {
  modelId: string;
  questionsCount: number;
  durationMs: number;
  promptTokens: number;
  completionTokens: number;
}

export interface AiGenerationResultDto {
  modelId: string;

  requestedQuestionsCount: number;
  generatedQuestionsCount: number;

  sourceChunksCount: number;
  selectedSourceChunksCount: number;

  durationMs: number;
  calls: AiGenerationCallDto[];

  questions: AiGeneratedQuestionDto[];

  isPartialCoverage: boolean;
  isPartialResult: boolean;

  detectedTopicsCount: number;
  coveredTopicsCount: number;

  requestedQuestionCounts: AiQuestionCounts;
  generatedQuestionCounts: AiQuestionCounts;

  warnings: string[];
}