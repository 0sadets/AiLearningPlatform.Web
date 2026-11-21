export type AnalyticsDataStatus =
  | "NoData"
  | "Limited"
  | "Sufficient";

export type ConceptReviewPriority =
  | "NotAssessed"
  | "InsufficientData"
  | "Low"
  | "Medium"
  | "High";

export type RecommendationPriority =
  | "Preliminary"
  | "Low"
  | "Medium"
  | "High";

export interface AnalyticsMaterialDto {
  materialId: number;
  materialTitle: string;
  chunkIndex: number;
  excerpt: string;
}

export interface StudentAnalyticsSummaryDto {
  totalConcepts: number;
  assessedConcepts: number;
  sufficientlyAssessedConcepts: number;
  conceptsNeedingReview: number;
  preliminaryConceptsNeedingReview: number;
  completedTests: number;
  completedAttempts: number;
  excludedLatestAttempts: number;
}

export interface StudentConceptAnalyticsDto {
  conceptId: number;
  name: string;
  description: string | null;

  observedMasteryPercent: number | null;

  questionsCount: number;
  answeredQuestionsCount: number;
  correctAnswersCount: number;
  testsCount: number;

  dataStatus: AnalyticsDataStatus;

  prerequisiteRiskPercent: number | null;
  weakPrerequisiteConceptIds: number[];

  reviewPriority: ConceptReviewPriority;
  materials: AnalyticsMaterialDto[];
}

export interface StudentTopicAnalyticsDto {
  topicId: number;
  name: string;

  totalConcepts: number;
  assessedConcepts: number;
  sufficientlyAssessedConcepts: number;

  observedMasteryPercent: number | null;
  dataStatus: AnalyticsDataStatus;
  conceptIds: number[];
}

export interface StudentRecommendationDto {
  conceptId: number;
  conceptName: string;
  priority: RecommendationPriority;
  reason: string;
  observedMasteryPercent: number | null;
  materials: AnalyticsMaterialDto[];
}

export interface StudentAttemptHistoryDto {
  attemptId: number;
  testId: number;
  testTitle: string;
  completedAtUtc: string;
  percentage: number | null;
  hasKnowledgeSnapshot: boolean;
}

export interface StudentCourseTestProgressDto {
  totalAvailableTests: number;
  completedAvailableTests: number;
  notCompletedAvailableTests: number;
  completionPercent: number | null;
}

export interface StudentKnowledgeAnalyticsDto {
  courseId: number;
  graphRevision: number;
  calculatedAtUtc: string;
  hasCurrentTopics: boolean;
  testProgress?: StudentCourseTestProgressDto | null;

  summary: StudentAnalyticsSummaryDto;
  concepts: StudentConceptAnalyticsDto[];
  topics: StudentTopicAnalyticsDto[];
  recommendations: StudentRecommendationDto[];
  attemptHistory: StudentAttemptHistoryDto[];
  warnings: string[];
}